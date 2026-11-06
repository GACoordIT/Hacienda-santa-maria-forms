# Guía rápida de revisión

1. Instalar Node.js 20 o superior.
2. Abrir una terminal en esta carpeta.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.
5. Abrir `http://localhost:8787/` para revisar el formulario.
6. Abrir `http://localhost:8787/api/health` para comprobar el Worker.

La interfaz y el Worker pueden revisarse sin una base conectada. El inicio de sesión, la administración de usuarios y el historial no funcionarán hasta que el responsable conecte y adapte la persistencia. No usar datos reales ni publicar para operación hasta completar esa integración.

Consultar `README.md` para las condiciones de entrega y publicación.
