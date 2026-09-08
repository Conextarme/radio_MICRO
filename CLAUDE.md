# Instrucciones permanentes del proyecto

## Registro obligatorio de cambios

Cada vez que modifiques, crees, renombres o elimines uno o más archivos de este proyecto (`radio_MICRO`), debes actualizar también el archivo:

CAMBIOS_IA.md

Hazlo siempre al finalizar el trabajo, sin que el usuario tenga que recordártelo.

Añade una nueva entrada al principio de `CAMBIOS_IA.md`, justo debajo del título principal (por encima de cualquier entrada anterior).

Cada entrada debe contener:

- Fecha y hora local.
- Título breve del cambio.
- Objetivo solicitado.
- Archivos modificados.
- Archivos creados.
- Archivos eliminados.
- Explicación clara de lo realizado.
- Motivo técnico de los cambios.
- Pruebas o validaciones realizadas.
- Resultado de esas pruebas.
- Posibles riesgos o asuntos pendientes.
- Instrucciones para revertir el cambio.

Usa este formato:

## AAAA-MM-DD HH:MM — Título del cambio

### Objetivo
Descripción de lo que pidió el usuario.

### Archivos afectados
- `ruta/archivo.ext`: modificado, creado, eliminado o renombrado.

### Cambios realizados
Explicación clara y comprensible de los cambios.

### Motivo
Por qué se ha realizado cada cambio importante.

### Validaciones
- Prueba ejecutada.
- Resultado obtenido.

### Riesgos o pendientes
- Riesgos conocidos.
- Aspectos que todavía deben comprobarse.
- Escribir "Ninguno detectado" cuando corresponda.

### Cómo revertir
Instrucciones concretas para deshacer únicamente este cambio.

---

## Reglas del registro

1. No sobrescribas entradas anteriores.
2. No borres ni resumas el historial existente.
3. No inventes pruebas que no hayas ejecutado.
4. Si no has podido realizar una prueba, indícalo expresamente.
5. Usa rutas de archivo exactas.
6. Explica los cambios con lenguaje comprensible para una persona no programadora.
7. No incluyas contraseñas, claves privadas, tokens ni secretos.
8. No copies el contenido de archivos privados o de configuración sensible (`.env` u otros).
9. Actualiza `CAMBIOS_IA.md` incluso cuando el cambio sea pequeño.
10. Antes de terminar, revisa `git diff` o las diferencias disponibles para confirmar que el registro coincide con los cambios reales.
11. La actualización de `CAMBIOS_IA.md` forma parte obligatoria de la tarea.
12. No des por terminada una tarea de modificación hasta haber actualizado el registro.

## Seguridad

Nunca incluyas en el registro:

- Claves privadas.
- Contraseñas.
- Tokens de acceso.
- Credenciales de cualquier tipo.
- Contenido sensible de archivos de configuración.

Puedes indicar que se modificó una configuración privada, pero sin copiar su valor.

## Respuesta final

Cuando termines una modificación, responde indicando:

1. Qué has cambiado.
2. Qué archivos se han modificado.
3. Qué pruebas has realizado.
4. Que el trabajo ha quedado registrado en `CAMBIOS_IA.md`.
