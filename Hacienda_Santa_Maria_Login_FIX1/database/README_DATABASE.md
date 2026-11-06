# Base de datos

El Worker espera un binding llamado `DB` con la interfaz de consultas de Cloudflare D1 (`prepare`, `bind`, `first`, `all`, `run`). `schema.sql` crea las tablas `users`, `sessions`, `records` y `audit_logs`.

Este esquema es específico de SQLite/Cloudflare D1. El motor definitivo de la organización no está confirmado. Si se utilizará otro motor, el responsable debe adaptar la capa de consultas del Worker y validar tipos, fechas, transacciones e índices. No se debe conectar la base directamente desde el navegador.

## Inicialización D1

```bash
npx wrangler d1 execute NOMBRE_DE_TU_D1 --remote --file=database/schema.sql
```

## Primer administrador

```bash
npm run admin:prepare
npx wrangler d1 execute NOMBRE_DE_TU_D1 --remote --file=database/bootstrap-admin.sql
```

Ejecutar el SQL de bootstrap una sola vez y eliminarlo inmediatamente después. No subirlo a GitHub.
