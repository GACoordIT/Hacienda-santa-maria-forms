# Guía de usuario y administración | Hacienda Santa María

## Abrir el formulario
1. Abre `index.html` en el navegador.
2. Inicia sesión con una de las cuentas iniciales:
   - Administrador: usuario `admin`, contraseña `GrupoA,$123#`
   - Usuario estándar: usuario `estandar`, contraseña `estandar123`
3. Tanto administrador como usuario estándar pueden llenar el formulario y generar el PDF.
4. Para cerrar la sesión, pulsa **Cerrar sesión** en la parte superior.

## Administrar usuarios
Solo una cuenta con rol **Administrador** ve el botón **Administrar usuarios**.
1. Pulsa **Administrar usuarios**.
2. En **Crear usuario**, escribe el nombre de usuario y la contraseña que quieras.
3. Opcionalmente, escribe el nombre para mostrar.
4. Elige **Administrador** o **Usuario estándar**.
5. Pulsa **Crear usuario**.
6. En la lista puedes cambiar el rol o eliminar usuarios. El sistema evita eliminar la cuenta activa o dejar el sistema sin administradores.

Los nombres de usuario aceptan de 3 a 40 caracteres: letras, números, punto, guion y guion bajo. La contraseña debe tener al menos 6 caracteres.

## Dónde se guardan las cuentas
Esta versión local guarda la lista de usuarios en `localStorage` del navegador y la sesión actual en `sessionStorage`. Los usuarios permanecen guardados en ese perfil de navegador aunque cierres y abras el navegador, pero **no se comparten entre navegadores, perfiles o computadoras**. No borres los datos del sitio del navegador o podrías perder los usuarios creados.

## Advertencia de seguridad
Esta es una versión local de demostración, no un sistema de autenticación seguro. Los usuarios y contraseñas se almacenan en el navegador y alguien con acceso al equipo o a las herramientas de desarrollo puede inspeccionarlos o modificar el rol. No la publiques para uso real ni la uses con información sensible. Para compartir cuentas entre computadoras o usarla por internet, hay que integrar autenticación centralizada con un servicio/servidor y controles de acceso en el servidor.

## Solución de problemas
- Si un usuario recién creado no aparece, comprueba que estás usando el mismo navegador y perfil donde lo creaste.
- Si la pantalla vuelve al login, vuelve a ingresar las credenciales.
- Si no carga el PDF, verifica que haya conexión a internet para cargar la biblioteca PDF-Lib desde CDN.
- Mantén una copia de respaldo de la carpeta del proyecto antes de modificar archivos.
