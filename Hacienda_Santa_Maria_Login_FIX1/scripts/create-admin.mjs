import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomBytes, pbkdf2Sync, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const rl = createInterface({ input: stdin, output: stdout });
try {
  console.log('\nCrear el primer administrador de Hacienda Santa María');
  const username = (await rl.question('Usuario (3-40 caracteres): ')).trim();
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) throw new Error('Nombre de usuario inválido.');
  const displayName = (await rl.question('Nombre visible: ')).trim() || username;
  const password = await rl.question('Contraseña (mínimo 12 caracteres): ');
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('base64url');
  const passwordHash = `pbkdf2_sha256$310000$${salt}$${hash}`;
  const q = value => `'${String(value).replaceAll("'", "''")}'`;
 const sql = `INSERT INTO users (id, username, password_hash, display_name, role, active, created_at)
VALUES (${q(randomUUID())}, ${q(username)}, ${q(passwordHash)}, ${q(displayName)}, 'admin', 1, datetime('now'))
ON CONFLICT(username) DO UPDATE SET
password_hash = excluded.password_hash,
display_name = excluded.display_name,
role = 'admin',
active = 1;`;
  await writeFile('database/bootstrap-admin.sql', sql, { mode: 0o600 });
  console.log('\nListo. Se creó database/bootstrap-admin.sql con el hash, no con la contraseña.');
  console.log('Ejecutá ese archivo una sola vez contra la base D1 correcta y luego eliminá el archivo.');
} catch (error) {
  console.error(`\nNo se pudo crear el administrador: ${error.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
