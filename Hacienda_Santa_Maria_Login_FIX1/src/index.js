const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const fail = (message, status = 400) => json({ error: message }, status);
const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")), c=>c.charCodeAt(0));
async function sha256(value) { return b64url(await crypto.subtle.digest("SHA-256", enc.encode(value))); }
async function passwordHash(password, salt = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2", salt:enc.encode(salt), iterations:310000, hash:"SHA-256"}, key, 256);
  return `pbkdf2_sha256$310000$${salt}$${b64url(bits)}`;
}
async function verifyPassword(password, stored) {
  const [scheme, iterations, salt, expected] = (stored || "").split("$");
  if (scheme !== "pbkdf2_sha256") return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2", salt:enc.encode(salt), iterations:Number(iterations), hash:"SHA-256"}, key, 256);
  return b64url(bits) === expected;
}
function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  const item = raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));
  return item ? item.slice(name.length+1) : null;
}
async function sessionUser(request, env) {
  const token = getCookie(request, "hsm_session");
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id,u.username,u.display_name,u.role FROM sessions s
     JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=? AND s.expires_at > datetime('now') AND u.active=1`
  ).bind(await sha256(token)).first();
  return row || null;
}
async function requireUser(request, env, role) {
  const user = await sessionUser(request, env);
  if (!user) return { response: fail("No autenticado", 401) };
  if (role === "admin" && user.role !== "admin") return { response: fail("Permisos insuficientes", 403) };
  return { user };
}
async function audit(env, actorId, action, entityType, entityId, details = null) {
  await env.DB.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,details_json,created_at)
    VALUES(?,?,?,?,?,?,datetime('now'))`).bind(crypto.randomUUID(),actorId,action,entityType,entityId,details?JSON.stringify(details):null).run();
}
async function handleApi(request, env, url) {
  const path = url.pathname, method = request.method;
  // Health check no depende de la base de datos: permite comprobar que el Worker responde.
  if (path === "/api/health" && method === "GET") return json({ok:true, service:"hsm-worker-api", databaseConfigured:Boolean(env.DB)});
  if (!env.DB) return fail("La capa de base de datos aún no está configurada para este entorno.", 503);
  if (path === "/api/auth/login" && method === "POST") {
    const body = await request.json().catch(()=>null);
    if (!body || typeof body.username!=="string" || typeof body.password!=="string") return fail("Usuario y contraseña requeridos.");
    const user = await env.DB.prepare("SELECT id,username,password_hash,role,display_name FROM users WHERE lower(username)=lower(?) AND active=1").bind(body.username.trim()).first();
    if (!user || !(await verifyPassword(body.password,user.password_hash))) return fail("Usuario o contraseña incorrectos.",401);
    const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at) VALUES(?,?,?,datetime('now','+8 hours'),datetime('now'))")
      .bind(crypto.randomUUID(),user.id,await sha256(token)).run();
    await audit(env,user.id,"login","session",null);
    return new Response(JSON.stringify({user:{id:user.id,username:user.username,displayName:user.display_name,role:user.role}}),{
      headers:{"content-type":"application/json","cache-control":"no-store","set-cookie":cookie("hsm_session",token,28800)}
    });
  }
  if (path === "/api/auth/logout" && method === "POST") {
    const token=getCookie(request,"hsm_session");
    if(token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();
    return new Response(null,{status:204,headers:{"set-cookie":cookie("hsm_session","",0),"cache-control":"no-store"}});
  }
  if (path === "/api/auth/me" && method === "GET") {
    const user=await sessionUser(request,env);
    return user?json({user:{id:user.id,username:user.username,displayName:user.display_name,role:user.role}}):fail("No autenticado",401);
  }
  if (path === "/api/users" && method === "GET") {
    const auth=await requireUser(request,env,"admin"); if(auth.response)return auth.response;
    const {results=[]}=await env.DB.prepare("SELECT id,username,display_name,role,active,created_at FROM users ORDER BY username").all();
    return json({users:results});
  }
  if (path === "/api/users" && method === "POST") {
    const auth=await requireUser(request,env,"admin"); if(auth.response)return auth.response;
    const b=await request.json().catch(()=>null);
    if(!b || !/^[a-zA-Z0-9._-]{3,40}$/.test(b.username||"") || typeof b.password!=="string" || b.password.length<12 || !["admin","user"].includes(b.role)) return fail("Datos inválidos. Usuario de 3-40 caracteres, contraseña de al menos 12 y rol válido.");
    const id=crypto.randomUUID(), hash=await passwordHash(b.password);
    try {
      await env.DB.prepare("INSERT INTO users(id,username,password_hash,display_name,role,active,created_at) VALUES(?,?,?,?,?,1,datetime('now'))")
        .bind(id,b.username,hash,b.displayName||b.username,b.role).run();
    } catch { return fail("No se pudo crear el usuario. Verificá que no exista.",409); }
    await audit(env,auth.user.id,"create","user",id,{username:b.username,role:b.role});
    return json({id,username:b.username,role:b.role},201);
  }
  const userMatch=path.match(/^\/api\/users\/([0-9a-f-]+)$/i);
  if(userMatch && method==="PATCH"){
    const auth=await requireUser(request,env,"admin");if(auth.response)return auth.response;
    const b=await request.json().catch(()=>null);
    if(!b || !["admin","user"].includes(b.role))return fail("Rol inválido.");
    const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(userMatch[1]).first();
    if(!target)return fail("Usuario no encontrado.",404);
    if(target.role==="admin"&&b.role!=="admin"){
      const n=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").first();
      if(n.n<=1)return fail("Debe quedar al menos un administrador.",409);
    }
    await env.DB.prepare("UPDATE users SET role=? WHERE id=?").bind(b.role,target.id).run();
    await audit(env,auth.user.id,"change_role","user",target.id,{role:b.role});
    return json({ok:true});
  }
  if(userMatch && method==="DELETE"){
    const auth=await requireUser(request,env,"admin");if(auth.response)return auth.response;
    if(userMatch[1]===auth.user.id)return fail("No podés eliminar tu propia cuenta.",409);
    const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(userMatch[1]).first();
    if(!target)return fail("Usuario no encontrado.",404);
    if(target.role==="admin"){
      const n=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").first();
      if(n.n<=1)return fail("Debe quedar al menos un administrador.",409);
    }
    await env.DB.prepare("UPDATE users SET active=0 WHERE id=?").bind(target.id).run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(target.id).run();
    await audit(env,auth.user.id,"deactivate","user",target.id);
    return json({ok:true});
  }
  if(path==="/api/records" && method==="GET"){
    const auth=await requireUser(request,env);if(auth.response)return auth.response;
    const q=auth.user.role==="admin"
      ? await env.DB.prepare(`SELECT r.id,r.parent_id,r.created_at,r.updated_at,u.username AS created_by,r.form_data_json
          FROM records r JOIN users u ON u.id=r.created_by_user_id ORDER BY r.created_at DESC`).all()
      : await env.DB.prepare(`SELECT r.id,r.parent_id,r.created_at,r.updated_at,u.username AS created_by,r.form_data_json
          FROM records r JOIN users u ON u.id=r.created_by_user_id WHERE r.created_by_user_id=? ORDER BY r.created_at DESC`).bind(auth.user.id).all();
    return json({records:(q.results||[]).map(r=>({...r,form_data:JSON.parse(r.form_data_json)}))});
  }
  if(path==="/api/records" && method==="POST"){
    const auth=await requireUser(request,env);if(auth.response)return auth.response;
    const b=await request.json().catch(()=>null);
    if(!b || !b.form_data || typeof b.form_data!=="object")return fail("Faltan datos del formulario.");
    const id=crypto.randomUUID(), parentId=typeof b.parent_id==="string"?b.parent_id:null;
    if(parentId){
      const parent=await env.DB.prepare("SELECT id,created_by_user_id FROM records WHERE id=?").bind(parentId).first();
      if(!parent || (auth.user.role!=="admin" && parent.created_by_user_id!==auth.user.id))return fail("Registro original no encontrado o sin permisos.",404);
    }
    await env.DB.prepare(`INSERT INTO records(id,parent_id,created_by_user_id,form_data_json,created_at,updated_at)
      VALUES(?,?,?,?,datetime('now'),datetime('now'))`).bind(id,parentId,auth.user.id,JSON.stringify(b.form_data)).run();
    await audit(env,auth.user.id,"create","record",id,{parent_id:parentId});
    return json({id},201);
  }
  if(path.startsWith("/api/records/") && method==="DELETE"){
    const auth=await requireUser(request,env);if(auth.response)return auth.response;
    const id=path.split("/").pop();
    const rec=await env.DB.prepare("SELECT id,created_by_user_id FROM records WHERE id=?").bind(id).first();
    if(!rec)return fail("Registro no encontrado.",404);
    if(auth.user.role!=="admin"&&rec.created_by_user_id!==auth.user.id)return fail("Sin permisos.",403);
    await env.DB.prepare("DELETE FROM records WHERE id=?").bind(id).run();
    await audit(env,auth.user.id,"delete","record",id);
    return json({ok:true});
  }
  return fail("Ruta no encontrada.",404);
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith("/api/")) {
      try { return await handleApi(request,env,url); }
      catch(e) { console.error("HSM API error",e); return fail("Error interno del servidor.",500); }
    }
    if(env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("HSM Worker activo. Configurá el binding ASSETS.",{status:503});
  }
};
