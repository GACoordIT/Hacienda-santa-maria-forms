# Formulario de asignación HSM

## Cómo abrirlo
1. Extrae toda la carpeta del ZIP a una ubicación normal de tu computadora.
2. Haz doble clic en `INICIAR_FORMULARIO.bat`. También puedes abrir `index.html` directamente con Brave o Chrome.
3. Ingresa los datos y las fechas de pago manualmente. Los campos monetarios aceptan cantidades como `330000`, `330,000`, `330000.50`, `330,000.50` y `330,50`. Al salir del campo se muestran con separadores de miles y dos decimales.
4. La suma de pagos se actualiza automáticamente. El formulario no cambia ni reparte los montos ingresados. El enganche debe coincidir con la suma de pagos para generar el documento.
5. Pulsa **Generar PDF para imprimir**. Si el generador PDF en línea no carga, se abrirá una versión imprimible; elige **Guardar como PDF** en el diálogo de impresión.

## Notas importantes
- El plan de pagos aparece automáticamente, por lo que ya no necesita un botón de preparación.
- No requiere instalar Python ni iniciar un servidor local.
- La generación directa del PDF utiliza PDF-Lib desde una CDN y requiere conexión a internet. Si la CDN no carga, el formulario conserva los cálculos y ofrece la alternativa de impresión/guardar como PDF.
- Mantén juntos los archivos de esta carpeta.


Actualización: se añadió un selector de moneda en el Resumen económico para elegir Quetzales (Q) o Dólares estadounidenses (US$). La moneda elegida se refleja en los importes del formulario y del PDF. El selector solo cambia la moneda indicada, no convierte los valores ni aplica una tasa de cambio.
