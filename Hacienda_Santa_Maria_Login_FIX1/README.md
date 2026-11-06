# Hacienda Santa María

Aplicación web preparada para **Cloudflare Workers + Static Assets**. El formulario conserva la generación de PDF; el inicio de sesión, la administración de usuarios y el historial se comunican con la API del Worker.

## Estado de esta entrega

- **Lista para subir el código a un repositorio privado de GitHub.**
- Configuración de Cloudflare Workers y publicación de recursos estáticos preparada.
- **No está conectada a una base de datos real.**
- Las rutas de autenticación, usuarios e historial requieren que el responsable implemente/configure la capa de persistencia.
- `database/schema.sql` y las consultas actuales son una referencia para SQLite/Cloudflare D1. Si se utilizará MySQL, PostgreSQL, SQL Server u otro motor, hay que adaptar `src/index.js` y el esquema antes de habilitar esas funciones.

No se incluyó un ID ficticio de D1 ni credenciales. No se debe crear una base ni reemplazar valores de conexión sin indicación del responsable.

## 1. Requisitos

- Node.js 20 o superior y npm.
- Git (opcional si se sube desde la interfaz web de GitHub).
- Cuenta de Cloudflare con permisos para Workers.

## 2. Prueba local del Worker y del formulario

En la carpeta del proyecto, ejecutar:

```bash
npm install
npm run dev
```

Abrir `http://localhost:8787/` para revisar la interfaz y `http://localhost:8787/api/health` para comprobar que el Worker responde. Mientras no se configure la persistencia, el endpoint de salud debe indicar `databaseConfigured: false`; login, usuarios e historial no estarán operativos.

## 3. Subir a GitHub

1. Crear un repositorio **privado** en GitHub.
2. Subir el contenido de esta carpeta, no el ZIP como único archivo.
3. No subir `.dev.vars`, archivos `.env` reales, `node_modules`, `.wrangler` ni `database/bootstrap-admin.sql`.
4. Revisar que el repositorio no contenga contraseñas, tokens ni datos personales reales.

Con Git instalado, desde esta carpeta:

```bash
git init
git add .
git commit -m "Preparar Hacienda Santa Maria para Cloudflare"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

## 4. Publicación en Cloudflare

El `wrangler.jsonc` ya apunta al Worker `src/index.js` y a los recursos estáticos de `public/`. Se puede desplegar una versión de vista previa para comprobar que el Worker y el formulario cargan, pero la autenticación, usuarios e historial seguirán deshabilitados hasta conectar la persistencia.

**No considerar esta versión lista para uso operativo ni entregar el enlace a usuarios finales.** Antes de producción, el responsable debe:

1. Confirmar el motor de base de datos y el método de conexión permitido en Cloudflare Workers.
2. Adaptar las consultas y el esquema de `src/index.js` al motor elegido (o configurar D1 y validar el esquema si esa fuera la decisión).
3. Configurar los bindings y secretos necesarios sin exponer credenciales al navegador ni al repositorio.
4. Crear el primer administrador mediante un procedimiento compatible con la base elegida. El script actual `scripts/create-admin.mjs` genera SQL específico de SQLite/D1 y no debe ejecutarse contra otro motor sin adaptación.
5. Probar login, cierre de sesión, roles, creación/desactivación de usuarios, historial, edición por versiones y eliminación.
6. Revisar límites de intentos de login, monitoreo, respaldos y políticas de acceso.

## 5. Archivos importantes

- `index.html` y `public/index.html`: interfaz del formulario y flujos de usuario.
- `src/index.js`: API del Worker.
- `public/`: recursos estáticos servidos por Cloudflare.
- `database/schema.sql`: esquema de referencia SQLite/D1, no universal.
- `scripts/create-admin.mjs`: generador de administrador para SQLite/D1.
- `wrangler.jsonc`: configuración del Worker y de Static Assets, sin base ficticia.

