# Registro de cambios del proyecto (IA)

Este archivo recoge, en orden cronológico inverso (lo más reciente arriba), todos los cambios realizados en este proyecto con ayuda de IA desde su creación.

---

## 2026-11-09 11:38 — Fuentes guardadas en el propio proyecto

### Objetivo
El usuario pidió dejar de cargar las fuentes desde Google y guardarlas en la web, y borrar `logos/hoja-de-contacto.png`.

### Archivos afectados
- `fonts/audiowide-latin.woff2`, `fonts/audiowide-latin-ext.woff2`: creados.
- `fonts/rajdhani-400-latin.woff2`, `fonts/rajdhani-400-latin-ext.woff2`: creados.
- `fonts/rajdhani-600-latin.woff2`, `fonts/rajdhani-600-latin-ext.woff2`: creados.
- `fonts/rajdhani-700-latin.woff2`, `fonts/rajdhani-700-latin-ext.woff2`: creados.
- `styles.css`: modificado (declaración de las fuentes al principio).
- `index.html`: modificado.
- `sw.js`: modificado (versión de caché v41 → v42 y fuentes en la lista de la caché).

### Cambios realizados
- Se han descargado de Google Fonts las fuentes que usa la web, Audiowide y Rajdhani en los grosores 400, 600 y 700, y se han guardado en la carpeta `fonts/`. Para cada una hay dos archivos: el de letras latinas normales y el de letras latinas extendidas (como ł, ő o ş). Este segundo solo se descarga si algún texto las usa. No se han incluido las letras devanagari, que la web no usa.
- `styles.css` declara esas fuentes al principio, así que ya no se pide nada a fonts.googleapis.com ni a fonts.gstatic.com.
- `index.html` ya no enlaza con Google. Adelanta la descarga de las cuatro fuentes que se usan nada más abrir (unos 60 KB).
- El service worker guarda esas cuatro fuentes para que la web se vea con su letra también sin conexión.
- **No se ha borrado `logos/hoja-de-contacto.png`.** Al ir a borrarlo se vio que está en `.gitignore`: nunca se ha subido a GitHub ni a Vercel. Es una imagen local que genera `scripts/fetch-logos.py` para revisar los logos, como explica `README.md`. La revisión anterior se equivocó al decir que ocupaba espacio en el repositorio.

### Motivo
Quitar las conexiones a los servidores de Google al abrir la web. Así la letra definitiva llega antes, casi sin el cambio visible desde la letra del sistema, y funciona sin conexión.

### Validaciones
- Los 8 archivos descargados empiezan por la firma `wOF2` (woff2 válido) y ocupan entre 7 y 16 KB cada uno.
- Navegador local, sin service worker ni caché:
  - Se descargan `audiowide-latin`, `rajdhani-400-latin`, `rajdhani-600-latin` y `rajdhani-700-latin` desde `fonts/`, por precarga.
  - Las cuatro quedan cargadas y hay 0 peticiones a Google.
  - Se pintan 44 tarjetas y el título se ve en Audiowide (captura revisada).
  - No hay avisos de precarga sin usar en la consola.
- No probado: la carga sin conexión con el service worker instalado.

### Riesgos o pendientes
- Si en el futuro se usa otro grosor (por ejemplo 500 u 800), habrá que añadir su archivo; si no, el navegador lo imitará con uno de los que hay.
- `prototipos/modo-compacto.html` sigue pidiendo sus fuentes a Google. Es la maqueta y la web no lo usa.

### Cómo revertir
Borrar la carpeta `fonts/` y el bloque de `@font-face` del principio de `styles.css`. En `index.html`, volver a poner el enlace a Google Fonts en lugar de las líneas `preload`. En `sw.js`, quitar las fuentes de `APP_SHELL` y dejar `CACHE_VERSION` en `'v41'`.

---

## 2026-11-09 11:32 — Emisora "Exclusively Queen" en Rock años 70

### Objetivo
El usuario pidió añadir una emisora de Queen en la categoría de rock.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `sw.js`: modificado (versión de caché v40 → v41).

### Cambios realizados
Se ha añadido "Exclusively Queen" (Exclusive Radio, solo canciones de Queen) en Music Time, categoría "Rock años 70", justo detrás de las otras emisoras de la misma cadena (Pink Floyd, Deep Purple y Led Zeppelin). Ahora la categoría tiene 9 emisoras.

### Motivo
Es la misma cadena que ya se usa para Pink Floyd, Deep Purple y Led Zeppelin, que funciona en la web, y su emisora de Queen emite en el mismo formato (MP3 a 128 kbps).

### Validaciones
- Petición al stream con `curl`: respuesta 200, tipo `audio/mpeg`, nombre de emisora "er/queen", 128 kbps, y se recibió audio.
- `emisoras-modos.json` se lee sin errores y la emisora aparece en el modo `music` con la categoría `rock70`.
- No probado: escucharla en la web (para no poner sonido durante las pruebas).

### Riesgos o pendientes
- No tiene logo propio, igual que Deep Purple y Led Zeppelin; se ve el que la web pone por defecto.

### Cómo revertir
Quitar el bloque "Exclusively Queen" de `emisoras-modos.json` y dejar `CACHE_VERSION` en `'v40'`.

---

## 2026-11-09 11:31 — Carga más rápida: fuentes sin bloqueo y lista corta de emisoras ocultas

### Objetivo
El usuario pidió aplicar dos mejoras de rendimiento: que las fuentes no retrasen la primera vista y que la lista de emisoras no espere a descargar el historial completo de fallos.

### Archivos afectados
- `index.html`: modificado.
- `app.js`: modificado.
- `scripts/check-streams.mjs`: modificado.
- `.github/workflows/check-streams.yml`: modificado.
- `emisoras-ocultas.json`: creado.
- `sw.js`: modificado (versión de caché v39 → v40 y nuevo archivo en la lista de la caché).

### Cambios realizados
1. **Fuentes.** Antes, el navegador no mostraba nada hasta descargar las fuentes de Google. Ahora la web aparece enseguida con la letra del sistema y cambia a Audiowide y Rajdhani cuando llegan, un instante después. Además, ya no se descarga el grosor 500 de Rajdhani, que no se usaba. Si el JavaScript está desactivado, las fuentes se cargan como antes.
2. **Emisoras ocultas.** Antes, para saber qué emisoras ocultar (las que fallan 3 semanas seguidas), la web descargaba `stream-health.json` entero (unos 74 KB) antes de pintar las tarjetas. Ahora la comprobación semanal también genera `emisoras-ocultas.json`, de menos de 1 KB, con solo esa lista, y la web lee este archivo. Si falta o está dañado, la web usa el historial completo como antes, y si tampoco puede leerlo, no oculta nada.
   - El robot semanal de GitHub guarda ahora los dos archivos.
   - Con `node scripts/check-streams.mjs --solo-ocultas` se rehace la lista corta a partir del historial, sin comprobar emisoras. Así se ha creado la lista inicial.

### Motivo
Las dos cosas retrasaban la primera vista en el móvil: el CSS de las fuentes bloqueaba el pintado y el historial era una descarga que había que esperar antes de mostrar la lista.

### Validaciones
- `node --check app.js`: sin errores.
- `node scripts/check-streams.mjs --solo-ocultas`: generó `emisoras-ocultas.json` con 1 emisora oculta ("Europa FM"), la misma que sale al calcularlo a mano desde `stream-health.json`.
- Navegador local, sin service worker ni caché:
  - Se descarga `emisoras-ocultas.json` y no `stream-health.json`.
  - Se pintan 44 tarjetas.
  - El enlace de las fuentes acaba como `media="all"` y Audiowide y Rajdhani quedan cargadas.
- Prueba del respaldo, quitando `emisoras-ocultas.json` temporalmente: la web pasó a leer `stream-health.json` y pintó las 44 tarjetas. El archivo se restauró después.
- No probado: la ejecución real del workflow de GitHub (se hará el próximo lunes o al lanzarlo a mano).

### Riesgos o pendientes
- Al abrir la web puede verse un instante la letra del sistema antes de la definitiva (el cambio de fuente es visible).
- El umbral de 3 fallos seguidos está ahora en dos sitios: `HIDE_AFTER_CONSECUTIVE_FAILURES` en `app.js` (para el respaldo) y en `scripts/check-streams.mjs`. Si se cambia, hay que cambiarlo en los dos.
- Comprobar tras el próximo lunes que el robot sube también `emisoras-ocultas.json`.

### Cómo revertir
Deshacer los cambios de este commit en `index.html`, `app.js`, `scripts/check-streams.mjs`, `.github/workflows/check-streams.yml` y `sw.js`, y borrar `emisoras-ocultas.json`. Dejar `CACHE_VERSION` en `'v39'`.

---

## 2026-11-09 11:24 — Modo compacto: correcciones tras la revisión del código

### Objetivo
El usuario pidió revisar todo lo hecho en la sesión y corregir los cinco puntos encontrados en el modo compacto.

### Archivos afectados
- `compact.js`: modificado.
- `compact.css`: modificado.
- `index.html`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado (versión de caché v38 → v39).

### Cambios realizados
1. **Arrastrar el dial con el móvil en vertical.** El casete se ve girado y, al arrastrar el dial "hacia arriba", no respondía porque se medía el movimiento vertical de la pantalla real. Ahora, con la vista girada, se mide el movimiento horizontal, que es el que el usuario ve como "arriba".
2. **Casete cortado en el móvil.** La vista girada usaba la altura total de la pantalla, incluida la barra del navegador, y el casete se salía por un lado. Ahora usa la altura visible real (`100dvh`) y mantiene la anterior como respaldo para navegadores antiguos.
3. **Girar varios pasos seguidos.** Antes, cada toque, cada paso de la rueda del ratón y cada pulsación de flecha cambiaba de emisora (o cargaba un modo) al instante, y se encadenaban conexiones. Ahora el dial se mueve al momento, pero la emisora o el modo solo se aplican cuando se deja de girar durante 0,4 segundos. Mientras se gira el dial de modo, el rótulo de debajo muestra el modo al que apunta.
4. **La lista inferior ya no salta.** Antes se rehacía con cada canción nueva y volvía sola a la emisora activa. Ahora solo se rehace si cambia algo que aparece en ella, y solo vuelve a la emisora activa al abrirla, al cambiar de pestaña o al cambiar de emisora.
5. **Detalles:**
   - Si el compacto no se puede descargar (sin conexión), el icono vuelve a intentarlo al pulsarlo otra vez; antes se quedaba sin responder hasta recargar.
   - Se ha quitado de `app.js` la función `glitch`, que usaba el antiguo botón de microcortes y ya no se usaba en ningún sitio.
   - Los diales informan al lector de pantalla del nombre del modo o de la emisora, en lugar de solo un número.

### Motivo
Son los fallos y mejoras que salieron en la revisión del código de esta sesión: uso en el móvil girado, conexiones innecesarias al girar rápido, lista incómoda de leer, recuperación sin conexión y accesibilidad.

### Validaciones
- `node --check` de `compact.js` y `app.js`: sin errores de sintaxis.
- Navegador local (servidor `python -m http.server`) con la reproducción simulada, sin sonido real:
  - Tres pasos seguidos de rueda en el dial de modo → un solo cambio de modo al final, y el rótulo mostraba el modo de destino mientras tanto. Correcto.
  - Tres toques seguidos en el dial de emisora con la radio "encendida" (simulado) → una sola orden de reproducir, la de la emisora final. Correcto.
  - Vista girada: arrastrar 30 px hacia la derecha de la pantalla avanzó dos modos; arrastrar en vertical no hizo nada. Correcto.
  - Panel de emisoras abierto y desplazado; al llegar una canción nueva, la lista no se rehízo ni se movió. Correcto.
  - La regla con `100dvh` está cargada y el navegador la admite.
  - `window.radioMicro.glitch` ya no existe.
- No probado: el aspecto real de la vista girada en un móvil (en la prueba la ventana no tenía alto visible), la vibración (el navegador la bloquea con toques simulados) y la recarga del icono sin conexión.

### Riesgos o pendientes
- Hay que comprobar en un móvil real la vista girada y el arrastre.
- La espera de 0,4 s hace que la emisora empiece a sonar un poco después de tocar el dial; se puede ajustar en `SETTLE_MS`, en `compact.js`.
- El commit anterior (v38) no llegó a publicarse en Vercel; este cambio necesitará también un despliegue manual si Vercel no lo recoge.
- Las horas de las entradas anteriores de hoy (09:35–16:00) no coinciden con el reloj del equipo (11:24 en el momento de esta entrada).

### Cómo revertir
Deshacer los cambios de este commit en `compact.js`, `compact.css`, `index.html`, `app.js` y `sw.js` (por ejemplo, con `git revert` del commit) y volver a dejar `CACHE_VERSION` en `'v38'`.

---

## 2026-11-09 16:00 — Optimización de rendimiento: desenfoque, sol/luna y tarjetas fuera de pantalla

### Objetivo
Hacer la web más fluida en móviles, sobre todo al desplazar la lista de emisoras.

### Archivos afectados
- `styles.css`: modificado.
- `sw.js`: modificado (versión de caché `v38`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- **Sin desenfoque en pantallas táctiles:** las tarjetas, el podio, el mini reproductor, el panel de canciones, el menú del temporizador y el botón "Ver más" dejan de usar `backdrop-filter`. Solo se aplica en pantallas con puntero táctil.
- **Sol y luna:** el resplandor (`box-shadow`) es fijo; la animación solo cambia la opacidad. Antes la sombra cambiaba en cada cuadro.
- **Tarjetas fuera de pantalla:** `content-visibility: auto` en las tarjetas de emisoras, para que el navegador no pinte las que no se ven.

### Motivo
El desenfoque y las sombras animadas son lo más caro para la GPU en móviles. Quitarlos o fijarlos reduce el trabajo al desplazar.

### Validaciones
- Navegador en vista móvil (puntero táctil): las tarjetas tienen `backdrop-filter: none`; `content-visibility` vale `auto`; el sol mantiene su animación.
- Captura de la página normal: se ve la cabecera, el sol y el podio sin errores visibles.
- No se ha medido el rendimiento (FPS ni Lighthouse) antes y después.

### Riesgos o pendientes
- Sin desenfoque, las tarjetas se ven un poco más planas en móviles. Si no gusta, se puede subir la opacidad de `--card-bg` solo en táctil.
- Los cambios están en el disco pero no subidos a GitHub.
- En el móvil puede hacer falta borrar los datos del sitio para cargar la caché `v38`.

### Cómo revertir
1. En `styles.css`: quitar el bloque "Optimización de rendimiento" (al final, antes de "El atributo hidden…"), restaurar el `box-shadow` animado en `@keyframes sun-pulse` y `moon-breathe`, y devolver `animation: moon-breathe` a `.sleep-dim-moon`.
2. En `sw.js`: volver a poner `var CACHE_VERSION = 'v37';`.
3. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 15:00 — Modo compacto: vibración, un solo estado y optimizaciones

### Objetivo
Confirmar cada paso del dial con una vibración corta; dejar un solo mensaje de estado (en la etiqueta); y aplicar las optimizaciones propuestas: carga bajo demanda, menos repintados, menor frecuencia de los vúmetros y modo ahorro de batería.

### Archivos afectados
- `index.html`: modificado (el CSS y el JS del compacto ya no se cargan al inicio; se cargan al abrir el modo compacto o si estaba abierto la última vez).
- `compact.js`: modificado.
- `compact.css`: modificado.
- `sw.js`: modificado (versión de caché `v37`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- **Vibración:** cada paso del dial de modo o de emisoras vibra 12 ms, si el móvil lo permite.
- **Un solo estado:** "RECONECTANDO…", "EN DIRECTO", etc. aparecen solo en la etiqueta. La línea de la canción se oculta cuando no hay título, y ya no muestra un texto de relleno.
- **Carga bajo demanda:** la vista compacta no se descarga hasta que se abre.
- **Menos repintados:** la vista solo se actualiza cuando cambia algo visible (estado, emisora, modo, estilo o canción).
- **Vúmetros:** pasan de 150 ms a 250 ms.
- **Ahorro de batería:** con menos del 20 % y sin cargador, se paran los giros, los latidos y las interferencias.

### Motivo
- La vibración permite comprobar el giro sin mirar la pantalla.
- Un único mensaje evita repetir el estado en dos sitios.
- Las demás mejoras reducen trabajo del procesador y la descarga inicial, sobre todo en móviles.

### Validaciones
- Navegador: antes de abrir el compacto no se carga `compact.js` ni `compact.css`; al pulsar el icono se cargan y se abre la vista.
- Clic en el dial de modo: pasa de NORMAL a DORMIR.
- Radio sonando: la etiqueta muestra "EN DIRECTO" y la línea de canción aparece con el título.
- Microcorte: la etiqueta muestra "RECONECTANDO…" y la línea de canción se oculta.
- Consola: sin errores de JavaScript.
- No probado: la vibración en un móvil real (el navegador de prueba la acepta pero no vibra); el modo ahorro de batería (requiere batería baja real); la vista con batería baja.

### Riesgos o pendientes
- El modo ahorro de batería depende de que el navegador dé información de batería. En iPhone y algunos navegadores no está disponible y simplemente no se activa.
- La carga bajo demanda hace que el primer clic en el icono tarde un poco más, mientras se descarga el compacto.
- Los cambios están en el disco pero no subidos a GitHub.
- En el móvil puede hacer falta borrar los datos del sitio para que cargue la caché `v37`.

### Cómo revertir
1. En `index.html`: volver a poner `<link rel="stylesheet" href="compact.css">` en la cabecera y `<script src="compact.js" defer></script>` después de `app.js`, y quitar el bloque `<script>` de carga.
2. En `compact.js`: quitar `buzz()`, el ajuste de `setTrack` que oculta la franja, la comprobación de `keyNow`, `applyEco()` y `window.__compactReady`; volver a poner `setInterval(tickVU, 150)` y la línea de `trackString` que devuelve "sin datos de canción".
3. En `compact.css`: quitar el bloque `.compact.eco`.
4. En `sw.js`: volver a poner `var CACHE_VERSION = 'v36';`.
5. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 14:00 — Modo compacto: quitar las flechas de los diales

### Objetivo
Quitar los botones laterales ‹ › de los diales de modo y de emisora, porque el clic dentro del propio dial ya avanza una posición.

### Archivos afectados
- `index.html`: modificado (eliminados los cuatro botones ‹ ›).
- `compact.js`: modificado (eliminada la función que los manejaba).
- `compact.css`: modificado (eliminados los estilos de los botones).
- `sw.js`: modificado (versión de caché `v36`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Se quitan las flechas ‹ › de los dos diales. El dial de modo y el de emisoras siguen avanzando con un clic sobre el propio dial, con el arrastre, la rueda y las teclas de flechas.

### Motivo
El clic dentro del dial ya funciona y las flechas sobraban; así la vista es más limpia.

### Validaciones
- Navegador (vista compacta abierta): hay 0 botones ‹ › en el panel. Un clic en el dial de modo pasa de DORMIR a BIG CALM y el anillo marca la C.
- Consola: no se revisó en esta prueba.

### Riesgos o pendientes
- Los cambios están en el disco pero no subidos: falta commit y push para que Vercel los publique.
- Como en las anteriores, en el móvil puede hacer falta borrar los datos del sitio para que cargue la caché `v36`.

### Cómo revertir
1. En `index.html`: volver a poner los cuatro botones `cpModePrev`, `cpModeNext`, `cpStPrev` y `cpStNext` dentro de `dial-row`.
2. En `compact.js`: volver a añadir la función `stepBy` y sus cuatro `addEventListener`.
3. En `compact.css`: volver a añadir las reglas `.compact .step` y `.compact.small .step`.
4. En `sw.js`: volver a poner `var CACHE_VERSION = 'v35';`.
5. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 13:00 — Modo compacto: icono, diales por clic, letras y botón MODO

### Objetivo
Ajustes pedidos sobre el modo compacto: icono discreto de cinta en la cabecera; título de la radio más pequeño; letras en el dial de modo; sustituir el botón MICROCORTE por un botón MODO que abre la selección de modos en el panel inferior; botones más discretos; diales que avancen un paso por clic o toque para que sean fáciles de usar en el móvil.

### Archivos afectados
- `index.html`: modificado.
- `styles.css`: modificado.
- `compact.css`: modificado.
- `compact.js`: modificado.
- `sw.js`: modificado (versión de caché `v35`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Cabecera: el botón "📼 Modo compacto" pasa a ser un icono de cinta sin texto (con su nombre accesible y tooltip).
- Dial de modo: letras alrededor (N, D, C, M, B) con la activa resaltada. Dial de emisoras y dial de modo tienen botones ‹ › a los lados.
- Diales: un clic o toque avanza una posición; el arrastre sigue funcionando; la rueda y las flechas también.
- Botón MICROCORTE sustituido por MODO, que abre el panel inferior en la pestaña MODOS (los cinco modos con su letra).
- Título de la radio dentro de la etiqueta: más pequeño.
- Línea de la canción: pasa a una franja propia bajo los botones, a todo el ancho; si no cabe, se desplaza despacio.
- Botones de control: más pequeños y de tono más apagado.

### Motivo
En el móvil los diales arrastrados eran difíciles de girar; un toque por paso es más fácil. El título de la radio ocupaba demasiado dentro de la etiqueta. El icono y los botones más discretos reducen el ruido visual de la vista compacta.

### Validaciones
- Navegador (móvil emulado y puntero táctil): un toque en el dial de modo pasa de NORMAL a DORMIR; el anillo marca la D; la pestaña MODOS lista los cinco modos.
- Botón ›/‹ del dial de emisoras: avanza a la emisora 14 de 44.
- Consola: sin errores de JavaScript.
- El usuario confirmó en el móvil que el texto dentro de la cinta se lee bien.
- No probado: el arrastre con el dedo en un móvil real; el desplazamiento de la línea de canción con una canción larga real; el escritorio con ventana ancha.

### Riesgos o pendientes
- Con un arrastre, un toque sin movimiento cuenta como un paso: si al tocar el dial se mueve un poco, puede contar como arrastre. El umbral es de 8 píxeles.
- Las letras del anillo se calculan al pintar; si se cambia el tamaño de la ventana, se recalculan al rotar o redimensionar.
- Pendiente de decidir: borrar `prototipos/modo-compacto.html`.

### Cómo revertir
1. En `index.html`: volver al botón de texto `📼 Modo compacto`, quitar los botones ‹ › y el anillo de letras, y restaurar el botón MICROCORTE.
2. En `compact.js` y `compact.css`: restaurar la versión anterior desde el historial de git.
3. En `styles.css`: restaurar el bloque `.compact-toggle` original (sin `width: 44px` ni alineación).
4. En `sw.js`: volver a `var CACHE_VERSION = 'v34';`.
5. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 12:00 — Modo compacto integrado en la web (casete con emisoras reales)

### Objetivo
Pasar el prototipo del casete a la web real: un interruptor "Modo compacto" junto al selector de modos. En el móvil la vista va siempre en horizontal. El selector de emisoras debe poder saltar por letras o con giro rápido. Incluir optimizaciones.

### Archivos afectados
- `app.js`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado (versión de caché `v34` y nuevos archivos en el "app shell").
- `compact.css`: creado.
- `compact.js`: creado.
- `CAMBIOS_IA.md`: modificado.
- `prototipos/modo-compacto.html`: sin cambios en esta entrada (sigue como maqueta independiente).

### Cambios realizados
- **Interruptor** "📼 Modo compacto" en la cabecera, junto al selector de modos. En escritorio quedan en la esquina superior derecha; en el móvil, uno debajo del otro.
- **Vista compacta** con el casete, los diales de modo y de emisora, la botonera (encender/apagar, play/pausa, parar, estilo, microcorte) y la pantalla de listas. Usa las emisoras reales del modo activo.
- **Reproducción real:** la vista no reproduce audio. Llama a las mismas funciones que el mini reproductor (reproducir, pausar, parar, reconectar). El microcorte es el de verdad: reintenta la conexión.
- **Cambio de modo** con el dial, igual que el selector de la cabecera. Cada modo muestra sus estilos reales.
- **Estilo:** el botón ESTILO abre la pestaña de estilos. Si el modo no tiene estilos, el botón aparece desactivado.
- **Selector de emisoras rápido:** saltos por letras en la pantalla de listas; al girar el dial deprisa, avanza de cuatro en cuatro. Mientras se gira solo se previsualiza; la emisora cambia al soltar, para no parar y arrancar la radio en cada paso.
- **Horizontal en el móvil:** con el teléfono en vertical, la vista se gira para verse en horizontal.
- **Optimizaciones:** se recuerda si la vista compacta estaba abierta y la última emisora escuchada; las animaciones se paran con la pestaña oculta; se respeta "reducir movimiento" del sistema.
- **Cambios en `app.js`:** se añade un puente pequeño (`window.radioMicro`) con lectura de estado y acciones, y un aviso `radio:change` cuando cambia algo. No cambia la lista normal ni el mini reproductor.

### Motivo
- Un solo juego de funciones de reproducción evita que la vista compacta y la web se desincronicen.
- La vista compacta va en su propio archivo (`compact.js` y `compact.css`) para no mezclarla con el resto.
- Los cambios de `sw.js` hacen que los móviles carguen los archivos nuevos juntos.

### Validaciones
- Navegador en escritorio (ancho de móvil emulado; la vista de escritorio no se ha podido comprobar del todo): la web carga las 44 emisoras de Normal; la vista compacta se abre y el botón cambia de texto.
- Encender: suena una emisora real (estado "EN DIRECTO"), las bobinas giran y el latido se activa.
- Teclado en el dial de emisoras: cambia de emisora y reproduce la nueva.
- Microcorte: pasa a "RECONECTANDO…" y vuelve a "EN DIRECTO".
- Letras en la lista: el salto lleva a la primera emisora de esa letra.
- Cambio de modo a Dormir con el teclado: carga 62 emisoras y los estilos reales (Lluvia, Mar, Bosque…).
- Estilo "Lluvia": filtra a 5 emisoras y el dial marca "1 / 5".
- Móvil en vertical (375×812 emulado, puntero táctil): la vista se gira a horizontal y el reproductor cabe en 792 px de ancho.
- Consola: sin errores de JavaScript. Aparecen errores 404 de recursos que no he identificado; no impiden el uso.
- No probado: arrastre con el dedo en un móvil real; audio en un dispositivo real; layout de escritorio con ventana ancha; la lista de emisoras normal después de volver de la vista compacta.

### Riesgos o pendientes
- Los vúmetros y las barras de potencia son simulados; no leen el audio real.
- Las emisoras de "modo compacto" se guardan en el navegador, no en la cuenta de nadie.
- Pendiente de decidir: borrar `prototipos/modo-compacto.html` ahora que la versión real existe.
- Los 404 de la consola: habría que identificar qué recursos faltan (posiblemente logos o el endpoint de títulos en un servidor local).
- Al cambiar de modo con la vista compacta abierta, la radio se detiene (igual que en la lista normal).

### Cómo revertir
1. En `index.html`: quitar el bloque `<div class="header-tools">` (dejar solo el `<select>`), la sección `<section id="compact">` completa y las líneas que cargan `compact.css` y `compact.js`.
2. En `styles.css`: quitar las reglas `.header-tools`, `.compact-toggle` y volver a las de `.mode-select` originales.
3. En `app.js`: quitar las llamadas a `notifyRadioChange()`, la función `notifyRadioChange` y el bloque `window.radioMicro = {...}` antes del arranque.
4. Borrar `compact.css` y `compact.js`.
5. En `sw.js`: quitar `./compact.css` y `./compact.js` de `APP_SHELL` y volver a `var CACHE_VERSION = 'v33';`.
6. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 11:15 — Prototipo del modo compacto con casete y diales

### Objetivo
Montar una maqueta HTML autocontenida para ver cómo quedaría un modo compacto con aspecto de reproductor de casete de los años 70: madera alrededor, casete central con la emisora en la etiqueta, dos diales (modo y emisora), botones de encendido, play, parar, estilo y microcorte, pantalla de listas tipo años 70, y un efecto de latido mientras gira la cinta.

### Archivos afectados
- `prototipos/modo-compacto.html`: creado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Maqueta independiente en `prototipos/modo-compacto.html`. No está conectada a la web real: usa emisoras de ejemplo y no toca `app.js`, `styles.css` ni `sw.js`.
- Diseño: madera de fondo, panel plateado, casete con la emisora en la etiqueta y bobinas que giran al reproducir.
- Diales de modo y de emisora: se pueden arrastrar con el ratón o el dedo, usar la rueda y las flechas del teclado.
- Botones: encender/apagar, play/pausa, parar, estilo (abre la pantalla en la pestaña de estilos) y microcorte (simula reconexión).
- Pantalla de listas plegable, con pestañas EMISORAS y ESTILOS, en estilo de pantalla ámbar.
- Vúmetros y barras de potencia que se mueven solo al reproducir. Son simulados, no leen el audio.
- Latido de la etiqueta mientras suena; durante un microcorte cambia a un latido lento en ámbar.
- No se han copiado las imágenes de referencia. El diseño está hecho desde cero.

### Motivo
Antes de tocar la web real, se quiere ver el aspecto y el manejo del modo compacto para decidir si merece la pena.

### Validaciones
- Vista local en el navegador: la página carga sin errores de consola.
- Encender: la etiqueta muestra "Los 40 Classic", el estado "EN DIRECTO" y las bobinas giran.
- Lista de emisoras y estilos: se abre y el botón ESTILO lleva a la pestaña de estilos.
- Microcorte: durante 3,2 s muestra "RECONECTANDO…" con las bobinas a tirones; después vuelve a "EN DIRECTO".
- No se han probado diales con el dedo en un móvil real ni con emisoras reales.

### Riesgos o pendientes
- Los vúmetros son decorativos. Si se quieren reales, hay que analizar el audio, lo que solo funciona si el stream permite acceso desde otra web (CORS).
- Las fuentes VT323 y Rajdhani se cargan de Google Fonts; sin conexión se ve una fuente de reserva.
- Pendiente decidir si el modo compacto sustituye a la vista actual o es un interruptor.

### Cómo revertir
1. Borrar la carpeta `prototipos/` (contiene solo `modo-compacto.html`).
2. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 10:30 — Mini reproductor en móvil: canción en dos líneas a todo el ancho

### Objetivo
El título de la canción seguía cortándose en el móvil con puntos suspensivos. Se pide que vaya en una línea propia, a todo el ancho, encima de los controles.

### Archivos afectados
- `styles.css`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- En móvil (480 px o menos), el título de la canción ocupa su propia fila a todo el ancho y puede usar hasta dos líneas, en vez de cortarse con puntos suspensivos en una sola.
- El nombre de la emisora queda debajo y los controles en la fila inferior, como en la versión anterior.
- Se sube la versión de caché del servicio de la web a `v33`.

### Motivo
En la versión anterior el título ya ocupaba todo el ancho en el navegador, pero los títulos largos se cortaban. Permitir dos líneas muestra el texto completo sin quitar la fila de controles.

### Validaciones
- Vista previa local (`http://localhost:8080/`) con el navegador en tamaño móvil 375×812: el título ocupa 351 px de ancho, en dos líneas, y los controles quedan en su fila debajo.
- Comprobación de que el estilo se aplica: `-webkit-line-clamp` vale 2 y `white-space` vale `normal` en el título.
- No se ha probado en un móvil real. Los datos eran de prueba, no de una emisora en directo.

### Riesgos o pendientes
- Si el móvil sigue mostrando la versión antigua, hay que recargar la web o cerrar y abrir la app instalada para que cargue la caché `v33`.
- Comprobar en un móvil real con una emisora en directo.

### Cómo revertir
1. En `styles.css`, en el bloque final "Mini reproductor en móvil", en la regla `.mini-player-status` del móvil, borrar las líneas añadidas: `white-space: normal;`, `display: -webkit-box;`, `-webkit-line-clamp: 2;`, `-webkit-box-orient: vertical;`, `line-height: 1.25;`, `overflow: hidden;` y `text-overflow: clip;`.
2. En `sw.js`, volver a poner `var CACHE_VERSION = 'v32';`.
3. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 10:05 — Mini reproductor en móvil: título de canción a ancho completo

### Objetivo
En el móvil, el título de la canción se cortaba: la línea estaba limitada por el espacio que dejaban los iconos de la derecha, en vez de ocupar toda la anchura del mini reproductor.

### Archivos afectados
- `styles.css`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- En móvil (480 px o menos), el mini reproductor pasa a dos filas: arriba, el título de la canción con el nombre de la emisora, a todo el ancho; abajo, el logo y los iconos (temporizador, canciones, pausa y volumen).
- Se sube la versión de caché del servicio de la web a `v32` para que los móviles carguen el cambio.

### Motivo
El bloque de texto compartía fila con los botones y el control de volumen, así que se quedaba con un ancho pequeño. Al ocupar una fila entera, el título tiene todo el ancho disponible.

### Validaciones
- Revisión del código de `styles.css` y de la versión de caché en `sw.js`.
- No se ha ejecutado la web ni se ha probado en un navegador de móvil. El usuario confirmó la versión anterior en su móvil; esta nueva disposición aún no está comprobada.

### Riesgos o pendientes
- Comprobar en el móvil que los iconos de la segunda fila caben bien en pantallas estrechas (360 px).
- En el modo dormir el logo ya estaba oculto y no cambia.

### Cómo revertir
1. En `styles.css`, en el bloque final "Mini reproductor en móvil", borrar la regla `.mini-player` con `flex-wrap: wrap` y volver a `.mini-player-info` solo con `display: flex; flex-direction: column; gap: 0.15rem;`.
2. En `sw.js`, volver a poner `var CACHE_VERSION = 'v31';`.
3. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-09 09:35 — Mini reproductor en móvil: canción arriba y pausa sin icono naranja

### Objetivo
En el móvil, los títulos de las canciones se leían pequeños y cortados; los nombres de emisora y afinación se veían mal al estar en una sola línea; y al pasar de "en directo" a "pausa" aparecía un icono naranja de pausa que desentonaba.

### Archivos afectados
- `app.js`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- En móvil (pantallas de 480 px o menos), el mini reproductor de abajo muestra arriba la canción en una sola línea, más grande y en negrita, y debajo el nombre de la emisora con su afinación en hasta dos líneas.
- Los textos de estado "SINTONIZANDO…" y "EN PAUSA" ya no llevan el símbolo ▶︎ / ⏸︎. En muchos móviles ese símbolo se dibuja como un emoji de color naranja; ahora el estado se muestra solo como texto.
- Se sube la versión de caché del servicio de la web a `v31` para que los móviles carguen el cambio.

### Motivo
- Los textos del mini reproductor en móvil eran pequeños y se cortaban con puntos suspensivos. Se amplía la canción y se coloca arriba, donde se lee primero.
- El símbolo ⏸︎ era un carácter de texto que el sistema operativo sustituía por un emoji naranja. Quitarlo evita ese icono.
- La versión de caché cambia para que la PWA instalada no siga usando los archivos antiguos.

### Validaciones
- Revisión del código de `app.js`, `styles.css` y `sw.js` y de las diferencias con `git diff`.
- Pendiente: no se ha probado en un móvil real ni en el navegador de móvil. No se ha ejecutado la web.

### Riesgos o pendientes
- Hay que comprobar en un móvil real que el título de la canción cabe en una línea con nombres largos (se recorta con puntos suspensivos si no cabe).
- El "🔴 EN DIRECTO" de la tarjeta sigue usando un emoji; no era el icono que molestaba, pero conviene revisarlo.
- Interpretación: se entendió "estilos" como el nombre de la emisora con su afinación. Si se refería a otro texto, indicarlo.

### Cómo revertir
1. En `app.js`, en el objeto `STATUS_LABEL`, volver a poner `tuning: '▶︎ SINTONIZANDO…'` y `paused: '⏸︎ EN PAUSA'`.
2. En `styles.css`, borrar el bloque que empieza por el comentario "Mini reproductor en móvil: canción arriba" (al final del archivo).
3. En `sw.js`, volver a poner `var CACHE_VERSION = 'v30';`.
4. Quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-11-06 17:43 — Nueva temática "Electrónica" con Daft Punk y similares

### Objetivo
Buscar emisoras de Daft Punk o parecidas, crear una temática nueva para ellas y poner primero la de Daft Punk.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Nueva temática **Electrónica** en Music Time, colocada después de "Indie y alternativo".
- Siete emisoras, en este orden:
  1. **Exclusively Daft Punk**: solo Daft Punk.
  2. **Technolovers Funky House**: house funky y nu disco.
  3. **Radio Record Disco Funk**: house con aire de disco y funk.
  4. **Hed Kandi Club** (laut.fm): disco house.
  5. **M Radio French Touch**: electrónica francesa.
  6. **Nightride FM**: synthwave.
  7. **Nightride Chillsynth**: synthwave tranquilo.
- `CACHE_VERSION` sube a `v30`.
- El README incluye `electronica` en la lista de temáticas válidas.

### Motivo
- Music Time no tenía ninguna temática de electrónica.
- Exclusively Daft Punk es la única emisora dedicada a Daft Punk que se encontró (radio-browser.info). No hay emisoras de Justice, Cassius o Air en radio-browser, laut.fm ni PCRadio. Las de house funky y disco son lo más parecido a la etapa "Discovery", y las de synthwave, a la banda sonora de "Tron: Legacy".
- Nightride FM ya tenía su canal Horrorsynth en Buggy Time, pero no el principal ni Chillsynth.
- Las emisoras aparecen en el orden del JSON, por eso Daft Punk va la primera del bloque.

### Validaciones
- Petición a los 7 streams, leyendo las URLs del JSON: los 7 responden 200 con audio (`audio/mpeg` o `audio/aac`).
- En Hed Kandi Club se miraron las últimas canciones (Freeez, Dubby Disco Boyz...) para confirmar el estilo.
- `emisoras-modos.json` carga sin errores con Node y `node --check app.js` no da errores.
- Ningún nombre ni URL nueva repite uno existente.
- No se ha probado en el navegador.

### Riesgos o pendientes
- No se ha comprobado qué pone M Radio French Touch; el estilo se supone por el nombre.
- Si alguien ya tenía un orden guardado en Music Time, las emisoras nuevas pueden aparecer en otra posición dentro de la temática.
- Hay que abrir Music Time y escucharlas. No tienen logo propio.

### Cómo revertir
- En `emisoras-modos.json`, borrar las 7 entradas con `"categoria": "electronica"`.
- En `app.js`, quitar `'electronica'` de `MUSIC_CATEGORY_ORDER` y la línea `electronica: { icon: '🎛️', label: 'Electrónica' },` de `MUSIC_CATEGORY_META`.
- En `README.md`, quitar `electronica` de la lista de temáticas.
- En `sw.js`, subir `CACHE_VERSION` a `v31` (no volver a `v29`).

---

## 2026-11-06 17:23 — Siete emisoras más en "Fantasía"

### Objetivo
Ampliar la temática "Fantasía" con emisoras de metal sinfónico (Nightwish, Edenbridge, Within Temptation) y bandas sonoras de películas de fantasía o medievales.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
Siete emisoras nuevas en la temática "Fantasía" de Music Time, que pasa de 4 a 11:
- **Nightwish Radio** (laut.fm): metal sinfónico variado (Nightwish, Within Temptation, Epica, Xandria, Leaves' Eyes...).
- **PCRadio Nightwish**: solo Nightwish.
- **PCRadio Within Temptation**: solo Within Temptation.
- **Medieval Fantasy** (laut.fm): folk medieval y de fantasía (Faun, Ratatosk, Waldkauz...).
- **Arcano Mundo** (laut.fm): bandas sonoras de fantasía, series y videojuegos (Ramin Djawadi, Assassin's Creed...).
- **Score Radio** (laut.fm): bandas sonoras épicas de cine (Gladiator, Vangelis, Hans Zimmer...).
- **Epic Sounds FM** (laut.fm): música épica de tráiler (Two Steps from Hell, Mark Petrie...).

`CACHE_VERSION` sube a `v29`.

### Motivo
- Se eligieron después de mirar en la API de laut.fm las últimas canciones que había puesto cada emisora, para confirmar que el estilo coincide con lo que anuncia.
- Edenbridge no tiene emisora propia en radio-browser.info ni en laut.fm. Este tipo de grupos suena en Nightwish Radio.
- Descartadas: Soundtracks FM y laut.fm Soundtrack (bandas sonoras genéricas, ya cubiertas por "Soundtracks"); Radio Metalkultur (más death y black metal que sinfónico); Drachenfeuer y Radio AENA (rock medieval, parecido a lo que ya hay en "Folk metal"); laut.fm "epic" (no es música épica).

### Validaciones
- Petición a las 11 emisoras de "Fantasía", leyendo las URLs directamente del JSON: las 11 responden 200 con audio (`audio/mpeg` o `audio/aac`).
- `emisoras-modos.json` se carga sin errores con Node.
- Se comprobó que ningún nombre ni URL nueva repite uno existente.
- No se ha probado en el navegador.

### Riesgos o pendientes
- Hay que abrir Music Time y escuchar las emisoras nuevas.
- Las emisoras nuevas no tienen logo propio.
- La entrada anterior (17:13) dice que, para revertirla, se suba `CACHE_VERSION` a `v29`. Como ese número ya está usado, ahora habría que subir a `v30`.

### Cómo revertir
- En `emisoras-modos.json`, borrar las entradas "Nightwish Radio", "PCRadio Nightwish", "PCRadio Within Temptation", "Medieval Fantasy", "Arcano Mundo", "Score Radio" y "Epic Sounds FM".
- En `sw.js`, subir `CACHE_VERSION` a `v30` (no volver a `v28`).

---

## 2026-11-06 17:13 — Nueva temática "Fantasía" y una emisora más en Folk metal

### Objetivo
Buscar emisoras parecidas a la música de Elder Scrolls (Skyrim), El Señor de los Anillos y las versiones metal de Peyton Parrish, y añadir las que valgan: las de metal en "Folk metal" y el resto en una temática nueva de fantasía.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Nueva temática **Fantasía** (icono de dragón) en Music Time, colocada justo después de "Soundtracks".
- Cuatro emisoras nuevas en Fantasía:
  - Radio Rivendell (Suecia): música de fantasía y bandas sonoras épicas. Es lo más parecido a Skyrim y El Señor de los Anillos.
  - laut.fm Fantasyradio (Alemania): fantasía épica, folk y sinfónico.
  - Explorers Emporium Radio (EE. UU.): bandas sonoras de fantasía con aire medieval.
  - Chromatique-Sky (Alemania): bandas sonoras épicas.
- Una emisora nueva en Folk metal: Rock Antenne Coversongs (versiones en clave rock y metal, lo más cercano a las versiones metal de Disney).
- `CACHE_VERSION` sube a `v28` para que la PWA ya instalada descargue la lista y el código nuevos.
- El README lista todas las temáticas válidas de Music Time, incluida `fantasia`.

### Motivo
- No existe ninguna emisora dedicada a Elder Scrolls, a El Señor de los Anillos ni a Peyton Parrish: se buscó en radio-browser.info (nombres y etiquetas "skyrim", "elder scrolls", "tolkien", "lord of the rings", "hobbit", "peyton", "disney"...) y en la web. Middle-earth Radio, una radio de fans de Tolkien, no tiene ningún stream activo localizable (su web devuelve error 403). Por eso se eligieron emisoras de estilo parecido.
- Radio Bob! Symphonic Metal también encajaba, pero ya estaba en la lista (temática "Metal melódico", por HTTPS), así que no se duplicó.
- Se descartaron las emisoras de Radio Caprice (Viking Metal, Folk Metal, Dungeon Synth) porque solo funcionan por HTTP, y otras que repetían estilos ya cubiertos.

### Validaciones
- Petición a cada uno de los 5 streams nuevos, leyendo la URL directamente del JSON: los 5 responden 200 con audio (`audio/mpeg` o `audio/aac`).
- `emisoras-modos.json` se carga sin errores con Node (`require`).
- `node --check app.js`: sin errores de sintaxis.
- Se comprobó que ningún nombre nuevo repite uno existente.
- No se ha probado la app en el navegador: no se ha comprobado visualmente que el filtro "Fantasía" aparezca y reproduzca.

### Riesgos o pendientes
- Hay que abrir Music Time y comprobar que el filtro "Fantasía" se ve y que las cuatro emisoras suenan.
- Las emisoras nuevas no tienen logo propio en `logos/`; se mostrará el logo por defecto que use la app.

### Cómo revertir
- En `emisoras-modos.json`, borrar las entradas "Radio Rivendell", "laut.fm Fantasyradio", "Explorers Emporium Radio", "Chromatique-Sky" y "Rock Antenne Coversongs".
- En `app.js`, quitar `'fantasia'` de `MUSIC_CATEGORY_ORDER` y la línea `fantasia: { icon: '🐉', label: 'Fantasía' },` de `MUSIC_CATEGORY_META`.
- En `README.md`, quitar `fantasia` de la lista de temáticas.
- En `sw.js`, subir `CACHE_VERSION` otra vez (a `v29`), no volver a `v27`, para que la PWA recoja la vuelta atrás.

---

## 2026-11-06 15:59 — Tarjetas de escritorio menos apretadas

### Objetivo
En escritorio, aprovechar el hueco libre debajo de los iconos de favorito y arrastrar para el nombre de la emisora, porque las tarjetas con nombres largos quedaban muy compactas.

### Archivos afectados
- `styles.css`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- El nombre ya no reserva a la derecha el ancho de los iconos en todas sus líneas. Un hueco invisible del tamaño de la estrella y el asa ocupa solo la esquina de arriba. Desde la segunda línea, el texto usa todo el ancho de la tarjeta, también por debajo de los iconos. En pantallas táctiles el hueco es algo mayor, porque los iconos también lo son.
- El logo y el texto se alinean arriba en vez de al centro, para que la primera línea quede a la altura de los iconos.
- La cuadrícula pide un mínimo de 240 px por columna (antes, 190 px). En una pantalla de 1280 px salen 4 columnas en vez de 5, y el texto tiene sitio al lado del logo.
- En el móvil no cambia nada: el texto ya iba debajo del logo, lejos de los iconos. En el podio del móvil, donde el texto va al lado del logo, el hueco se mantiene.
- `CACHE_VERSION` sube a `v27`.

### Motivo
Con el logo a la izquierda, cada tarjeta dejaba unos 100 px para el texto, menos los 50 px reservados para los iconos en todas las líneas. Nombres como "Cadena SER (Sevilla)" se partían en tres o cuatro líneas y dejaban mucho hueco vacío debajo de los iconos.

### Validaciones
- Captura en Chrome sin interfaz a 1280 px, antes y después:
  - Antes: "Cadena SER (Sevilla)" en 3 líneas; "Catalunya Radio (Barcelona)" y "Canal Sur Radio Andalucía" en 3 o 4.
  - Después: 4 columnas. "Los 40 Classic", "Cadena 100" y "Canal Fiesta" en una línea; los nombres largos en dos, usando el ancho bajo los iconos.
- Generada también la captura a 900 px, pero no se ha revisado.
- Sin probar: un móvil físico ni el modo táctil en escritorio.

### Riesgos o pendientes
- Con 4 columnas en vez de 5, la cuadrícula plegada ("Ver más") enseña menos emisoras de golpe.

### Cómo revertir
En `styles.css`, volver `minmax(240px, 1fr)` a `minmax(190px, 1fr)` en `.stations-grid` y borrar el bloque final "Texto de la tarjeta: solo la primera línea esquiva los iconos". Si ya estaba publicado, subir `CACHE_VERSION` a `v28`.

---

## 2026-11-06 15:55 — Lista de pendientes para más adelante

### Objetivo
Dejar anotada la propuesta de partir `app.js` en módulos, con la explicación de sus riesgos y de cómo hacerlo con seguridad, para retomarla más adelante sin perder la información.

### Archivos afectados
- `PENDIENTES.md`: creado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
Nuevo archivo `PENDIENTES.md` con:
- La propuesta de partir `app.js`: motivo, riesgos, orden recomendado de los módulos, pruebas previas, lo que hay que tocar en el service worker y un commit por módulo.
- Las sugerencias de mejora comentadas que aún no se han hecho, tanto de usabilidad como para un nivel profesional.
- Detalles sueltos detectados durante el trabajo: el espacio del nombre en el reproductor del móvil, las emisoras sin logo y la revisión de la hoja de logos.

### Motivo
Que las ideas aplazadas no se pierdan entre conversaciones y estén junto al código.

### Validaciones
- Solo documentación; no se ha tocado código. No hay pruebas que ejecutar.

### Riesgos o pendientes
- Ninguno detectado.

### Cómo revertir
Borrar `PENDIENTES.md` y esta entrada.

---

## 2026-11-06 15:49 — Carátulas de las emisoras y sin votos en el modo dormir

### Objetivo
Poner el logo de cada emisora según la maqueta aprobada: en el móvil, el diseño de la maqueta (logo arriba); en escritorio, la variante B (logo a la izquierda) con la C (iniciales cuando no hay logo). Además, quitar los votos de las tarjetas del modo dormir.

### Archivos afectados
- `scripts/fetch-logos.py`: creado.
- `logos/`: creada, con 155 imágenes `.webp`, `index.json` y `excluidos.json`.
- `app.js`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado.
- `.gitignore`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- **Script de logos.** `scripts/fetch-logos.py` busca el logo de cada emisora, por este orden:
  1. En radio-browser.info, por la URL del stream.
  2. En radio-browser.info, por el nombre exacto.
  3. En el icono de la web oficial de la emisora.

  Descarta las imágenes de menos de 48 px y guarda cada logo a 128×128 sobre fondo blanco en `logos/<slug>.webp`. Genera `logos/index.json` con los logos que existen y una hoja de contacto para revisarlos. Respeta `logos/excluidos.json`.
- **Revisión de los logos.** Encontró 174. Tras revisar la hoja de contacto se excluyeron 19 que no correspondían:
  - Dos logos de otra marca: WIX en Gametation y Joomla en Radio Art Acoustic Blues.
  - Un icono genérico de "play" en cinco emisoras Exclusively.
  - Logos en blanco en Radio 432 y Shoot'em Up Radio.
  - Uno ilegible en Scotlander Radio.
  - La misma foto borrosa en las 9 de SomaFM.

  Quedan 155 logos, unos 657 KB en total.
- **Tarjetas.** El botón de cada tarjeta lleva el logo y un bloque de texto:
  - En escritorio, el logo va a la izquierda (3,25 rem).
  - En el móvil (≤480 px), el logo va arriba, con la estrella y el asa a su derecha, y el texto debajo.
  - En el podio, el logo es algo más grande.
  - Sin logo, se muestran las iniciales de la emisora con el color del modo y borde discontinuo.
  - En el modo dormir, los logos se atenúan un poco para que el blanco no deslumbre.
- **Reproductor de abajo.** Muestra el logo de la emisora que suena. En el móvil y en el modo dormir el logo se oculta y los botones grandes se reducen un poco, para que se pueda leer el nombre.
- **Carga de los logos.** La web lee `logos/index.json` al arrancar y solo pide los logos que existen. Si un archivo falla, vuelve a las iniciales.
- **Modo dormir.** Las tarjetas ya no muestran "N votos"; solo la calidad en kbps. Los votos se siguen usando por dentro para ordenar las emisoras y elegir una de reserva.
- **Caché.** `CACHE_VERSION` sube a `v26`.

### Motivo
Los logos permiten reconocer las emisoras de un vistazo. Se guardan dentro del proyecto, en vez de enlazarlos a sus webs, para que carguen rápido, funcionen sin conexión y no dependan de servidores ajenos. El usuario pidió quitar los votos porque no aportan nada.

### Validaciones
- `node --check app.js`: sin errores.
- Revisión visual de la hoja de contacto con los 174 logos encontrados. 19 excluidos a mano.
- Capturas en Chrome sin interfaz, con un servidor local:
  - Móvil, 390 px, modo normal: igual que la maqueta. Logo arriba, iniciales en las emisoras sin logo y logo en el reproductor.
  - Escritorio, 1280 px: logo a la izquierda en todas las tarjetas, iniciales en las que no tienen y logo en el reproductor.
  - Modo dormir, 390 px: antes de los ajustes el nombre del reproductor medía 66 px; después, 114 px y se lee bien.
- Comprobado por código en el modo dormir: las tarjetas muestran "128 kbps" o "160 kbps" y ninguna contiene "votos". Hay 40 logos y 22 tarjetas con iniciales.
- Sin probar: un móvil físico, ni la web publicada en Vercel.

### Riesgos o pendientes
- Algunos logos vienen de terceros y podrían no ser los oficiales actuales. Conviene echar un vistazo a `logos/hoja-de-contacto.png`; para quitar uno, se añade a `excluidos.json`.
- 107 emisoras no tienen logo (las de Fallout, SomaFM, Los 40 Classic…) y muestran iniciales.
- En el modo normal del móvil, con el logo y el botón del temporizador, el nombre del reproductor mide unos 70 px. Se lee el nombre corto, pero la canción queda recortada.
- Los logos son marcas de cada emisora. Para uso personal no hay problema; si la web se hace pública conviene revisarlo.

### Cómo revertir
Borrar `logos/` y `scripts/fetch-logos.py`. Deshacer los cambios de este commit en `app.js`, `index.html`, `styles.css`, `sw.js`, `.gitignore` y `README.md`, por ejemplo con `git checkout <commit-anterior> -- app.js index.html styles.css sw.js .gitignore README.md`. Si ya estaba publicado, subir `CACHE_VERSION` a `v27`.

---

## 2026-11-06 15:24 — Controles de pantalla de bloqueo y temporizador de apagado en todos los modos

### Objetivo
- Que la pantalla de bloqueo, los auriculares y el coche controlen la radio en todos los modos, con "siguiente / anterior" para cambiar entre las emisoras del TOP 3.
- Que el temporizador de apagado esté disponible en todos los modos, no solo en el modo dormir.
- Que en la pantalla de bloqueo salga el icono de la web como imagen.

### Archivos afectados
- `app.js`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Antes, la pantalla de bloqueo solo recibía el nombre de la emisora y los controles en el modo dormir. Ahora lo hace en todos los modos:
  - Debajo del nombre aparece la temática (en dormir, Music Time y Buggy Time) o la frecuencia (en el modo normal). Si se conoce la canción, sale la canción.
  - Como imagen sale el icono de la web, o la carátula del disco cuando la emisora la da.
  - Play y pausa funcionan bien aunque se pulse dos veces seguidas: antes cada pulsación alternaba el estado. También desbloquean el audio si el navegador lo había bloqueado.
  - "Siguiente" y "anterior" recorren el TOP 3. Si no hay favoritas en el podio, o la única es la que ya suena, recorren todas las emisoras del modo en el orden de la pantalla. Si la emisora que suena no es favorita, "siguiente" va a la 1ª del podio y "anterior" a la última.
  - El móvil recibe si la radio está sonando o en pausa, para mostrar el botón correcto.
  - Al cambiar de modo se borra la información de la pantalla de bloqueo.
- El botón del temporizador se ve en el reproductor de abajo en todos los modos. Se oculta solo con la zumbadora de YouTube, porque ahí no tiene efecto.
- Al cambiar de modo, el temporizador del modo dormir se conserva, como antes. El de los demás modos se cancela, porque la radio se detiene.
- Al volver a la pestaña, la cuenta atrás se actualiza en cualquier modo.
- El icono ⏱ del temporizador pasa a ser un dibujo SVG, por el mismo motivo que el play/pausa: en el móvil salía como emoji. Fuera del modo dormir, el botón tiene el mismo aspecto que el de canciones; en el modo dormir conserva el tono cálido y su tamaño.
- `CACHE_VERSION` sube a `v25`.

### Motivo
Con el móvil bloqueado o en el bolsillo, el único control disponible es el del sistema. Antes solo funcionaba en el modo dormir y sin cambio de emisora. El temporizador también es útil para dormirse con música de otros modos.

### Validaciones
- `node --check app.js`: sin errores.
- Prueba en Chrome sin interfaz, con pantalla de 360 px y un servidor local que imita Vercel. Los botones de la pantalla de bloqueo se simularon capturando los que registra la página.
  - Se registran play, pause, stop, nexttrack y previoustrack.
  - Con Cadena 100 sonando y el podio vacío, "siguiente" pasa a Aragón Radio y "anterior" vuelve a Cadena 100.
  - Pausa pone el estado en pausa; una segunda pausa no reanuda. Play reanuda.
  - En la pantalla de bloqueo sale "Insoportable / El canto del loco · Cadena 100", con `icon-192.png` y `icon-512.png` como imagen.
  - El temporizador de 15 min en el modo normal muestra la cuenta atrás (14:58). Al pasar a Music Time se cancela y se borra la información de la pantalla de bloqueo.
  - No hubo errores de JavaScript.
- Revisión visual a 360 px: el reproductor con cuenta atrás, reloj, lista, play/pausa y volumen cabe. El nombre de la canción queda más recortado.
- Sin probar: un móvil físico (Android o iPhone), los botones de auriculares o coche y el corte real del temporizador al acabar.

### Riesgos o pendientes
- iPhone no deja cambiar el volumen de una web: ahí el temporizador no baja el volumen poco a poco y la radio se pausa de golpe al final. Es lo mismo que ya pasaba en el modo dormir.
- Algunos navegadores no muestran "siguiente / anterior" en la pantalla de bloqueo con radio en directo. Si no aparecen, el resto sigue funcionando.
- En pantallas muy estrechas, con la cuenta atrás activa queda poco sitio para el nombre de la emisora.

### Cómo revertir
Deshacer los cambios de este commit en `app.js`, `index.html`, `styles.css`, `sw.js` y `README.md`, por ejemplo con `git checkout <commit-anterior> -- app.js index.html styles.css sw.js README.md`. Si ya estaba publicado, dejar `CACHE_VERSION` en un número mayor (`v26`).

---

## 2026-11-06 15:13 — Canción en curso, anteriores y próximas; iconos de play/pausa iguales en móvil y ordenador

### Objetivo
Mostrar en tiempo real la canción que suena, con un botón en el reproductor inferior (junto a play/pausa) que abra una ventana con las canciones anteriores y las próximas, en las emisoras donde sea posible. Además, explicar y corregir por qué el botón play/pausa se veía distinto en el móvil que en el navegador del ordenador.

### Archivos afectados
- `api/now-playing.js`: creado.
- `app.js`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Nueva función de servidor (Vercel) `api/now-playing.js`. Recibe la dirección del stream y devuelve la canción actual y, cuando el proveedor lo publica, la lista de anteriores y de próximas. Consulta primero la API de cada proveedor (Triton/StreamTheWorld para Los 40, Dial, Radiolé…; SomaFM; laut.fm; Radio.co; RadioKing; Rainwave; Zeno). Si no hay API, lee el título que va dentro del propio stream (metadatos ICY) o la página de estado de Icecast. Solo atiende streams que están en las listas de emisoras del proyecto.
- En el reproductor inferior, cuando la emisora está en directo y se conoce la canción, la segunda línea muestra "♪ Artista — Título" en lugar de "EN DIRECTO".
- Nuevo botón de lista junto a play/pausa. Abre una ventana con "Sonando ahora", "Próximas" (solo si la emisora las anuncia) y "Anteriores" con su hora. Se cierra con la X, con Escape o tocando fuera. Si la emisora no da historial, se muestran las canciones que han sonado mientras escuchabas, guardadas en el navegador (máximo 20 por emisora y 40 emisoras).
- La página consulta la canción cada 20 s (45 s con la pestaña en segundo plano) y solo mientras suena. Si una emisora no da título en 3 intentos seguidos, deja de preguntar.
- En la pantalla de bloqueo y en las notificaciones del móvil aparece la canción, con la carátula cuando la hay.
- El botón play/pausa usa ahora iconos dibujados (SVG) en vez de los caracteres ▶ y ⏸. A los textos de estado "SINTONIZANDO", "EN PAUSA" y "Continuar" se les añade un marcador invisible (U+FE0E) que pide mostrarlos como símbolo y no como emoji.
- El service worker no guarda en caché las respuestas de `/api/`. `CACHE_VERSION` sube a `v24`.

### Motivo
- El navegador no puede leer el título desde la propia emisora: los metadatos ICY no son accesibles desde un `<audio>` y casi todos los servidores bloquean la lectura desde otra web (CORS). Por eso se lee desde el servidor de Vercel.
- La lista blanca de streams evita que la función se use como proxy abierto hacia cualquier dirección.
- Botón distinto en móvil: los caracteres ▶ y ⏸ tienen versión emoji. Android e iOS los pintan como emoji (cuadradito de color) y Windows como símbolo de texto, así que el aspecto dependía del sistema. Con SVG se ven igual en todas partes.

### Validaciones
- Prueba de la función contra las 262 URLs de stream del proyecto, ejecutada con Node desde el equipo local. Resultado: 183 devuelven canción (136 por ICY, 9 SomaFM, 10 laut.fm, 6 Radio.co, 6 Triton, 5 Zeno, 7 Icecast, 3 Rainwave, 1 RadioKing). 23 traen historial y 4 traen próximas. 79 no devuelven nada: cadenas habladas (SER, RNE, COPE, Onda Cero), streams HLS, Radio Bob, Klassik Radio y GTA Radio, entre otras.
- Una URL que no está en las listas devuelve el error 400 "Emisora desconocida".
- Prueba en Chrome sin interfaz con un servidor local que imita Vercel:
  - Los 40 Classic en móvil (390 px): título en el reproductor y ventana con 10 anteriores y su hora.
  - Radio 432 (Big Calm) en escritorio (1280 px): ventana con "Próximas".
  - Cadena SER: el botón de lista no aparece.
  - El icono cambia bien entre pausa y play.
  - No hubo errores de JavaScript en la consola.
- `node --check` sin errores de sintaxis en `app.js` y `api/now-playing.js`.
- Sin probar: el despliegue real en Vercel, un móvil físico y el modo dormir con la ventana abierta.

### Riesgos o pendientes
- Cada consulta sin API propia abre un momento el stream desde Vercel para leer el título (unos pocos KB). La CDN guarda cada respuesta 15 s, pero cuenta en el uso de funciones del plan de Vercel.
- Algunas emisoras meten anuncios o textos promocionales como título ("Download our free mobile application"). Se filtran los identificadores de cuña más obvios, pero no todos.
- Si un proveedor cambia su API, esa emisora pasa a usar ICY o deja de mostrar la canción. No rompe la reproducción.
- En Rainwave, "Próximas" muestra la primera canción de cada votación pendiente. La que suena al final puede ser otra.
- Comprobar tras publicar que Vercel incluye las listas JSON en la función (se cargan con `require`, que Vercel detecta).

### Cómo revertir
Borrar la carpeta `api/` y deshacer los cambios de este commit en `app.js`, `index.html`, `styles.css`, `sw.js` y `README.md`. Por ejemplo, `git checkout <commit-anterior> -- app.js index.html styles.css sw.js README.md` y `git rm -r api`. Dejar `CACHE_VERSION` en un número mayor que el publicado (por ejemplo `v25`) para que las PWA instaladas se actualicen.

---

## 2026-11-06 12:03 — Fallout y GTA no salían en Buggy Time tras publicar

### Objetivo
El usuario avisó de que en Buggy Time no aparecían los filtros Fallout y GTA y que en Games solo salían unas pocas emisoras.

### Archivos afectados
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- La web publicada en Vercel ya tenía el código nuevo. El fallo estaba en el service worker del navegador o del móvil: servía el `app.js` desde su copia guardada ("caché primero"), pero la lista de emisoras la pedía nueva a la red. En la primera carga tras publicar se juntaban el `app.js` viejo, que no conocía las categorías Fallout y GTA, con la lista nueva. Por eso esos dos filtros no salían y Games solo enseñaba sus 9 emisoras.
- Ahora el service worker pide todo a la red primero (HTML, JS, CSS y listas) y solo usa la copia guardada si no hay conexión. Así el código y las listas siempre llegan de la misma versión.
- Al instalarse, el service worker descarga los archivos saltándose la caché del navegador (`cache: 'reload'`), para no guardar una copia vieja.
- Versión de caché de v22 a v23. `README.md` describe el nuevo comportamiento.

### Motivo
Con "caché primero" cada publicación se ve con una carga de retraso, y si en esa publicación cambian a la vez el código y la lista de emisoras, la app se ve mal durante esa carga. "Red primero" lo evita a cambio de esperar a la red en cada carga, algo que en Vercel apenas se nota.

### Validaciones
- `node --check sw.js`: sin errores.
- Comprobado que https://radio-micro.vercel.app ya servía el `app.js` con Fallout y GTA y el `sw.js` v22.
- Prueba en Chrome sin ventana con un servidor local: primero se carga la versión anterior a Fallout y GTA y después se publica la nueva.
  - Con la versión publicada (v22), la primera recarga mostró Sci-fi 3, Oldies 4, Games 9 y Buggy 9, sin Fallout ni GTA, igual que vio el usuario. La segunda recarga ya mostró los seis filtros.
  - Con el arreglo (v23) instalado, se publicó una versión de prueba con los nombres de los filtros cambiados y se vio a la primera recarga.
  - Sin conexión (simulado en Chrome), la app con v23 abre y muestra Buggy Time con sus seis filtros.
  - Sin errores de JavaScript en ninguna prueba.
- No probado: un móvil físico ni la app instalada como PWA.

### Riesgos o pendientes
- Quien tenga el service worker v22 o anterior en el móvil verá la versión vieja una vez más cuando se publique este cambio, porque esa carga aún la sirve el service worker antiguo. Basta con recargar o cerrar y abrir la app otra vez. Desde v23 los cambios se ven a la primera.
- Con poca cobertura, la app tarda algo más en abrir que antes, porque espera a la red antes de usar la copia guardada.

### Cómo revertir
En `sw.js`, poner `CACHE_VERSION` a un número nuevo (no reutilizar v22), volver a `cache.addAll(APP_SHELL)` sin el `map` con `cache: 'reload'`, y recuperar el bloque anterior del evento `fetch` (red primero solo para los `.json`, caché primero para el resto) con `git show efcfc02:sw.js`. Recuperar la línea de `sw.js` de `README.md` con `git show efcfc02:README.md`.

---

## 2026-11-06 11:56 — Filtros Fallout y GTA en Buggy Time

### Objetivo
El usuario pidió separar dentro de Games las emisoras de Fallout y de GTA, dejando el resto en Games. Se eligió hacerlo con filtros al mismo nivel que los demás, en lugar de una segunda fila de filtros.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Buggy Time tiene ahora seis filtros: 🛸 Sci-fi, 📻 Oldies, ☢️ Fallout, 🚗 GTA, 🎮 Games y 🐞 Buggy.
- Fallout (9): Diamond City Radio, Galaxy News Radio y los 7 canales de Fallout.fm.
- GTA (8): Flash FM (Vice City), NTS The Sound of GTA y las 6 radios de GTA IV.
- Games se queda con las 9 restantes (Rainwave, Pixel & Plot, SpriteLayer, Gametation, Fluffylandrpg, 80s80s Games y Shoot'em Up Radio).
- `sw.js`: la versión de caché sube de v21 a v22. `README.md`: se actualiza la lista de categorías de Buggy Time.

### Motivo
Añadir dos categorías reutiliza el sistema de filtros que ya existe, sin programar una segunda fila de filtros que solo usaría este modo.

### Validaciones
- `node --check app.js`: sin errores. `emisoras-modos.json` se lee como JSON válido.
- App real servida en local, en Chrome sin ventana: Buggy Time muestra 42 emisoras y los seis filtros, con Sci-fi 3, Oldies 4, Fallout 9, GTA 8, Games 9 y Buggy 9. Se pulsó una emisora de Fallout, una de GTA y una de Games, y las tres llegaron a "EN DIRECTO". Sin errores de JavaScript.
- No probado: un móvil físico ni la app instalada.

### Riesgos o pendientes
- Ninguno detectado.

### Cómo revertir
En `emisoras-modos.json`, cambiar `"categoria": "fallout"` y `"categoria": "gta"` por `"categoria": "games"`. En `app.js`, quitar `'fallout'` y `'gta'` de `BUGGY_CATEGORY_ORDER` y sus líneas de `BUGGY_CATEGORY_META`. Subir la versión de caché en `sw.js` y volver a dejar en `README.md` la lista de categorías anterior.

---

## 2026-11-06 11:46 — Categoría Clásica y musicales en Soundtracks (Music Time)

### Objetivo
El usuario pidió buscar emisoras dedicadas a Wagner, música medieval, música sacra, Berlioz y Mozart, y meterlas en una categoría nueva "Clásica" de Music Time. También pidió emisoras de musicales de Broadway y de Andrew Lloyd Webber para la categoría Soundtracks (no en Clásica).

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Music Time pasa de 103 a 111 emisoras.
- Filtro nuevo 🎻 "Clásica" con 5 emisoras: Classical Radio - Wagner (solo Wagner), Klassik Radio Pure Mozart (solo Mozart), Ancient FM (medieval y renacentista), Radio Art - Gregorian Chants (canto gregoriano) y Classical Catholic Radio (música sacra coral y litúrgica).
- Soundtracks pasa de 8 a 11 emisoras con 3 de musicales: Sounds of Broadway, Heart Musicals y Box Office Radio (West End y Broadway).
- `sw.js`: la versión de caché sube de v20 a v21.

### Motivo
- No se encontró ninguna emisora dedicada a Berlioz ni a Andrew Lloyd Webber. La única con "Lloyd Webber" en el nombre es de Julian Lloyd Webber, violonchelista clásico, así que no encaja con musicales. Las emisoras de musicales del West End (Heart Musicals, Box Office Radio) ponen mucho a Andrew Lloyd Webber.
- Solo se añadieron emisoras que funcionan con HTTPS. Se descartaron CEU Medieval Radio y Concertzender Oude Muziek porque solo funcionan sin cifrar, y el navegador las bloquearía.

### Validaciones
- `node --check app.js`: sin errores. `emisoras-modos.json` se lee como JSON válido.
- Las 8 direcciones de audio respondieron con audio por HTTPS desde la línea de comandos.
- App real servida en local, en Chrome sin ventana y con el audio silenciado: el filtro "Clásica" muestra 5 emisoras y Soundtracks 11. Se pulsaron las 8 tarjetas nuevas y las 8 llegaron a "EN DIRECTO" en menos de 10 segundos. Sin errores de JavaScript.
- La web de Sounds of Broadway devolvió error 511 a la comprobación automática (probablemente un bloqueo a programas, no una caída). No se ha comprobado desde un navegador normal.
- No probado: escucha humana, un móvil físico ni la app instalada.

### Riesgos o pendientes
- Classical Catholic Radio puede incluir alguna locución además de música; las descripciones salen de las fichas de cada emisora, no de haberlas escuchado.
- Heart Musicals es de una cadena británica: hoy funciona desde España, pero podría tener restricción geográfica en algún momento.

### Cómo revertir
En `emisoras-modos.json`, borrar de `modos.music.emisoras` las 8 emisoras indicadas. En `app.js`, quitar `'clasica'` de `MUSIC_CATEGORY_ORDER` y su línea de `MUSIC_CATEGORY_META`. Subir de nuevo la versión de caché en `sw.js`.

---

## 2026-11-06 11:40 — Categorías en Buggy Time, emisoras de videojuegos y categoría Sky y The Expanse

### Objetivo
El usuario pidió crear categorías en Buggy Time (Sci-fi, Oldies, Games y Buggy para las que no encajan), repartir allí las emisoras que ya había, añadir a Games las emisoras de videojuegos que eligió de la lista propuesta y crear en Music Time una categoría propia para las emisoras con ambiente de Sky: Children of the Light y The Expanse.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Buggy Time tiene ahora cuatro filtros, como Music Time y el modo dormir: 🛸 Sci-fi, 📻 Oldies, 🎮 Games y 🐞 Buggy. Pasa de 19 a 42 emisoras.
  - Sci-fi (3): SomaFM Mission Control, Strange Radio (Pumpkin FM) y 50's Science Fiction KOTR.
  - Oldies (4): 1940s Radio HS, 1940s Light Programme, Fogpoint Radio (años 30 a 50) y Radio Aurora (oldies italianos).
  - Games (26): las dos de Fallout y Flash FM que ya estaban, más 23 nuevas: Rainwave Game, Rainwave Covers, Rainwave Chill, Pixel & Plot (YourClassical), SpriteLayer Video Game Radio, Gametation, Fluffylandrpg, 80s80s Games, Shoot'em Up Radio, NTS The Sound of GTA, seis radios de GTA IV (Liberty Rock, The Vibe, K109, Fusion FM, Massive B e International Funk) y siete canales de Fallout.fm (principal, Fallout 1 OST, Fallout 2 OST, New Vegas, Fallout 4 Classical, Fallout 76 General y Fallout 76 Classical).
  - Buggy (9): Shirley & Spinoza, Radio Aporee, Datafruits, Substrate Radio, Nightwave Plaza, Birdsong Radio, Nightride FM Horrorsynth, Radio M00 Dark Ambient y Kobold.FM.
- Music Time pasa de 100 a 103 emisoras, con el filtro nuevo 🌠 "Sky y The Expanse": Rainwave Chill, Klassik Radio Games y Thermocline Radio.
- `sw.js`: la versión de caché sube de v19 a v20.
- `README.md`: se explica el campo `categoria` y las categorías de Buggy Time.

### Motivo
- No existe ninguna emisora dedicada a Sky: Children of the Light ni a The Expanse; se eligieron tres con un ambiente parecido (música de videojuegos tranquila, orquestal y cinematográfica).
- Las emisoras de Fallout.fm usan el puerto 8444, que funciona con HTTPS, igual que las dos que ya estaban; el que figura en el directorio público solo funciona sin cifrar y el navegador lo bloquearía.
- Rainwave se añade en su versión MP3 en lugar de OGG, que no todos los navegadores reproducen. Fallout.fm solo emite en OGG.
- Rainwave Chill está en los dos modos porque el usuario la eligió para ambos.

### Validaciones
- `node --check app.js`: sin errores. `emisoras-modos.json` se lee como JSON válido y no tiene nombres repetidos dentro de un mismo modo.
- Todas las direcciones nuevas respondieron con audio por HTTPS desde la línea de comandos.
- App real servida en local, en Chrome sin ventana y con el audio silenciado: Buggy Time muestra 42 emisoras y los filtros Sci-fi 3, Oldies 4, Games 26 y Buggy 9. Music Time muestra 103 emisoras, y el filtro "Sky y The Expanse" tiene 3.
- Se pulsaron las 26 tarjetas nuevas (23 de Buggy Time y 3 de Music Time) y las 26 llegaron a "EN DIRECTO" en menos de 10 segundos. Sin errores de JavaScript.
- No probado: escucha humana, un móvil físico ni la app instalada. Las emisoras OGG de Fallout.fm pueden no sonar en Safari de iPhone antiguos (ya pasaba con las dos que había). Tampoco se ejecutó `scripts/check-streams.mjs`.

### Riesgos o pendientes
- Buggy Time abre por defecto en el primer filtro (Sci-fi), igual que los otros modos con filtros.
- El reparto entre Sci-fi y Buggy es una propuesta: Nightride FM Horrorsynth y Radio M00 Dark Ambient podrían ir en Sci-fi si el usuario lo prefiere.

### Cómo revertir
En `app.js`, borrar `BUGGY_CATEGORY_ORDER`, `BUGGY_CATEGORY_META` y la línea `buggy` de `MODE_CATEGORIES`, y quitar `'cielos'` de `MUSIC_CATEGORY_ORDER` y su línea de `MUSIC_CATEGORY_META`. En `emisoras-modos.json`, borrar las 23 emisoras nuevas de `modos.buggy.emisoras`, las 3 últimas de `modos.music.emisoras` y el campo `categoria` de las emisoras de Buggy Time. Subir de nuevo la versión de caché en `sw.js` y quitar la línea de `categoria` de `README.md`.

---

## 2026-11-06 11:20 — Ocultar emisoras que fallan mucho y quitar Europa FM

### Objetivo
El usuario pidió que las emisoras que acumulan fallos en la comprobación automática de los lunes se oculten solas en la app, y quitar Europa FM.

### Archivos afectados
- `app.js`: modificado.
- `sw.js`: modificado.
- `stations.json`: modificado.
- `scripts/check-streams.mjs`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- La app lee ahora `stream-health.json`, el historial que guarda cada lunes la comprobación automática, y no muestra las emisoras que llevan 3 o más comprobaciones seguidas fallando. No se borran de las listas: en cuanto una comprobación sale bien, el contador vuelve a cero y la emisora reaparece sola. Funciona en todos los modos (normal, dormir, Big Calm, Music Time y Buggy Time).
- Las emisoras marcadas con `"geoRestricted": true` no se ocultan nunca. Si el historial no se puede leer, se muestran todas.
- `sw.js`: el historial se pide siempre primero a internet (como las listas de emisoras), para no usar una copia antigua. La versión de caché sube de v18 a v19.
- `stations.json`: se quita Europa FM (la lista normal pasa de 45 a 44 emisoras).
- `scripts/check-streams.mjs`: el aviso de "CRÓNICA" ahora indica que la app oculta la emisora a partir de 3 fallos seguidos.
- `README.md`: se explica el ocultado automático.

### Motivo
- Ocultar en vez de borrar evita perder emisoras por caídas temporales del servidor.
- El umbral de 3 fallos seguidos equivale a tres lunes sin responder; un fallo suelto no oculta nada.
- La excepción de `geoRestricted` existe porque la comprobación se hace desde servidores de GitHub fuera de España, y una emisora con restricción geográfica falla allí aunque en España funcione. Era el caso de Europa FM, que fallaba con error 403 desde hacía 5 lunes seguidos y el usuario pidió quitarla.

### Validaciones
- `node --check` de `app.js`, `sw.js` y `scripts/check-streams.mjs`: sin errores. `stations.json` se lee como JSON válido, con 44 emisoras y sin Europa FM.
- App real servida en local desde una copia, en Chrome sin ventana, con un historial simulado: Cadena 100 (3 fallos seguidos) y KEXP 90.3 Seattle (3) quedaron ocultas, y Radio Aurora (2) siguió visible. Modo normal: 43 de 44; Music Time: 99 de 100; Buggy Time: 19 de 19. Sin errores de JavaScript.
- Misma prueba sin `stream-health.json`: se muestran todas (44, 100 y 19). Sin errores de JavaScript.
- No probado: la app instalada en un móvil ni el paso del service worker de la versión v18 a la v19.

### Riesgos o pendientes
- Con el historial actual (actualizado por GitHub el lunes) ninguna emisora llega a 3 fallos seguidos, así que hoy no se oculta ninguna.
- `stream-health.json` lo actualiza el bot de GitHub cada lunes: conviene hacer `git pull` antes de subir cambios para no pisarlo.
- Una emisora con restricción geográfica sin la marca `geoRestricted` podría ocultarse aunque funcione en España.

### Cómo revertir
En `app.js`, borrar el bloque "Emisoras ocultas por fallos" (`HIDE_AFTER_CONSECUTIVE_FAILURES`, `loadHiddenStations` y `withoutFailingStations`) y sus tres llamadas en `initNormalMode`, `initSleepMode` e `initExtraMode`. En `sw.js`, quitar `stream-health.json` de la condición de red primero y subir la versión de caché. Para recuperar Europa FM, restaurar su línea en `stations.json` con `git checkout 3d85320 -- stations.json` (eso deshace solo los cambios de ese archivo). Revertir también los textos de `scripts/check-streams.mjs` y `README.md`.

---

## 2026-11-06 11:05 — Emisoras con música de AURORA y Radio Aurora en Buggy Time

### Objetivo
El usuario pidió buscar emisoras que pongan música de la artista AURORA para añadirlas a Music Time, y poner en Buggy Time (la sección de rarezas) una emisora italiana de oldies llamada Radio Aurora que salió en la búsqueda.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Music Time pasa de 98 a 100 emisoras. Se añaden KEXP 90.3 Seattle y NRK P1 (Noruega), las dos en una categoría nueva, "Indie y alternativo" (🌌), que aparece como un filtro más al final de la lista.
- Buggy Time pasa de 18 a 19 emisoras: se añade Radio Aurora (Italia, oldies de los 60 a los 90).
- `sw.js`: la versión de caché sube de v17 a v18 para que quien tenga la app instalada reciba el `app.js` nuevo.

### Motivo
- No existe ninguna emisora dedicada a AURORA, y en el directorio radio-browser nadie la tiene como etiqueta. Por eso se buscaron emisoras que la pongan de verdad, mirando sus listas de canciones emitidas: KEXP la puso varias veces entre septiembre y octubre de 2026 ("The Blade" y su colaboración con TOMORA), y NRK P1 puso "Morning Shall Come" el 6 de noviembre de 2026.
- Se miraron también NRK P3, NRK mP3 y SomaFM Indie Pop Rocks, pero en sus listas recientes no aparecía AURORA y no se añadieron.
- Ninguna categoría existente (blues, rock, metal...) encajaba con este estilo, de ahí la categoría nueva.
- Radio Aurora solo figuraba en el directorio con una dirección sin cifrar (HTTP), que el navegador bloquea en una web segura. Se usa la dirección HTTPS que aparece en el reproductor de su propia web.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores. `emisoras-modos.json` se lee como JSON válido.
- Las tres direcciones de audio respondieron con audio (audio/mpeg) desde la línea de comandos, y sus webs oficiales respondieron con código 200.
- App real servida en local, en Chrome sin ventana y con el audio silenciado: Music Time muestra 100 emisoras y el filtro "Indie y alternativo"; Buggy Time muestra 19. Se pulsaron las tres tarjetas nuevas y las tres quedaron en "EN DIRECTO" con el tiempo avanzando. Sin errores de JavaScript.
- No probado: escucha humana, un móvil físico ni la app instalada. Tampoco se ejecutó `scripts/check-streams.mjs`, para no alterar `stream-health.json`.

### Riesgos o pendientes
- NRK P1 es una radio generalista: tiene mucha charla en noruego, no solo música. AURORA está en su rotación, pero no suena a todas horas.
- KEXP mezcla muchos estilos y pone a AURORA de vez en cuando, no de forma continua.
- El subtítulo de Music Time sigue diciendo "BLUES, ROCK Y METAL"; no se ha cambiado.

### Cómo revertir
En `emisoras-modos.json`, borrar "KEXP 90.3 Seattle" y "NRK P1" de `modos.music.emisoras` y "Radio Aurora" de `modos.buggy.emisoras`. En `app.js`, quitar `'indie'` de `MUSIC_CATEGORY_ORDER` y la línea `indie` de `MUSIC_CATEGORY_META`. En `sw.js`, volver a subir la versión de caché (por ejemplo, a v19) para que los usuarios reciban el cambio.

---

## 2026-10-30 11:04 — Seis emisoras más para Buggy Time

### Objetivo
De las ideas propuestas, el usuario pidió añadir a Buggy Time SomaFM Mission Control y el grupo de terror y ciencia ficción, y dejar fuera lo que se había descartado.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
Buggy Time pasa de 7 a 13 emisoras. Se añaden SomaFM Mission Control, Strange Radio (Pumpkin FM), 50's Science Fiction KOTR, Nightride FM Horrorsynth, Radio M00 Dark Ambient y Kobold.FM. Big Calm no cambia.

### Motivo
Son las emisoras que eligió el usuario. Todas usan HTTPS para que el navegador no las bloquee.

### Validaciones
- Las 6 webs de las fichas respondieron correctamente.
- App real en una copia servida en local, con Chrome sin ventana y audio silenciado: se pulsaron las 18 tarjetas, sin errores de JavaScript. Big Calm muestra 5 y Buggy Time 13, y ninguna tarjeta de Buggy Time lleva etiqueta de afinación.
- 16 quedaron en "EN DIRECTO" a la primera, con el tiempo avanzando. Mission Control y Radio M00 quedaron en "RECONECTANDO" a los 6 segundos.
- Radio M00 solo tarda en arrancar: entró en directo antes de 10 segundos y siguió estable durante 30 segundos más.
- Mission Control dio error 403 porque SomaFM rechaza el identificador "HeadlessChrome" del navegador de prueba. Con un identificador de Chrome normal sonó en directo durante 15 segundos.
- No probado: escucha humana de las emisoras, un móvil físico y la app instalada. Tampoco se ejecutó `scripts/check-streams.mjs`, para no alterar `stream-health.json`.

### Riesgos o pendientes
- Las descripciones salen de las fichas y etiquetas de cada emisora, no de haberlas escuchado.
- Radio M00 tarda unos segundos en arrancar, así que puede mostrar "RECONECTANDO" al principio.

### Cómo revertir
En `emisoras-modos.json`, borrar de `modos.buggy.emisoras` las 6 emisoras indicadas. Este archivo aún no está en git, así que `git checkout` no sirve para restaurarlo.

---

## 2026-10-30 10:43 — Listas de emisoras para Big Calm y Buggy Time

### Objetivo
El usuario pidió dos listas para los modos nuevos. Una con emisoras online que lleven 432 Hz o 528 Hz en el título. La otra, para Buggy Time, a partir de un documento de texto con unas 20 emisoras raras y un enlace a un hilo de Reddit.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Big Calm pasa de 1 a 5 emisoras: se añaden Positively Rejuvenate 528 Hz, 432Hz Radio, Radio 432 y Musica a 432 Hz (Musicavera).
- Buggy Time pasa de 0 a 7 emisoras: Shirley & Spinoza, Radio Aporee, Datafruits, Substrate Radio, Fogpoint Radio, Nightwave Plaza y Birdsong Radio.
- Solo Positively Peaceful 432Hz conserva la etiqueta de afinación. Las emisoras nuevas no la llevan porque ninguna la ha confirmado en la medición.
- Las descripciones del documento se han corregido cuando no coincidían con lo comprobado. Substrate Radio es de Alabama, no de Atlanta, y en lo consultado Fogpoint no consta como emisora ficticia.

### Motivo
- La lista de Big Calm se eligió por el título, como pidió el usuario. El README exige que la etiqueta solo se ponga si la afinación se ha medido.
- Todas las direcciones son HTTPS, porque el navegador bloquea un stream `http://` dentro de una web HTTPS.
- Quedan fuera de Buggy Time:
  - SLAY Radio y White Noise Radio: solo funcionan por `http://`.
  - UVB-76: no se encontró stream directo. Sigue en la web como detalle oculto, por YouTube.
  - WebSDR: es un receptor, no una emisora.
  - Pink Unicorn, Screaming Duck, Hellscream, Psychedelia Online, Lofi Rain, The Ghost Station, The Pip, The Squeaky Wheel y Space Weather Audio: no se encontró emisora ni stream con esos nombres.
- "Vaporwave Radio" no se identificó como una emisora concreta. Se usa en su lugar Nightwave Plaza, que está dedicada a ese género.

### Validaciones
- Búsqueda de candidatas en radio-browser, Shoutcast, directorio Icecast, laut.fm, internet-radio.com y buscadores web. Para 528 Hz solo apareció una emisora en activo. Las entradas de Shoutcast con 432 o 528 en el nombre apuntan a Radionomy o no conectaron.
- Lectura de audio real durante 8 segundos con Node: las 12 emisoras entregaron datos de audio.
- App real en una copia servida en local, con Chrome sin ventana y audio silenciado: se pulsaron las 12 tarjetas. Las 12 quedaron en "EN DIRECTO" con el tiempo de reproducción avanzando y sin errores de JavaScript. Big Calm muestra 5 tarjetas y 1 etiqueta de afinación; Buggy Time, 7 tarjetas y ninguna.
- Afinación medida con dos tomas de unos 45 s separadas 4 minutos, analizando la desviación de los picos del sonido. El método acertó con tonos de prueba a 432, 440 y 444 Hz. Resultado de cada emisora (La de referencia):
  - Positively Peaceful 432Hz: 432,6 y 432,6 Hz. Confirmada; coincide con la medición anterior.
  - Positively Rejuvenate 528 Hz: 432,1 y 445,9 Hz. Sin confirmar (528 Hz equivaldría a un La de unos 444 Hz).
  - Radio 432: 438,0 y 431,4 Hz. Sin confirmar.
  - 432Hz Radio: 444,6 y 447,4 Hz. No coincide con 432 Hz.
  - Musica a 432 Hz (Musicavera): 448,4 y 449,9 Hz. No coincide con 432 Hz.
- No probado: escucha humana de cada emisora, un móvil físico, la app instalada y la revisión semanal `scripts/check-streams.mjs`, que no se ejecutó para no alterar `stream-health.json`.
- No se pudo leer el hilo de Reddit: Reddit bloqueó el acceso (error 403).

### Riesgos o pendientes
- En `app.js`, Big Calm sigue diciendo "AFINADA A 432 HZ" y "Solo emisoras con la afinación comprobada". Ya no es cierto con esta lista. El texto no se ha cambiado.
- 432Hz Radio y Musica a 432 Hz emiten música variada; en Musicavera apareció Fatboy Slim. Puede no encajar con un modo de calma.
- Dos tomas cortas son una muestra pequeña. Sirven como indicio, no como prueba definitiva de lo que emite cada emisora a lo largo del día.
- Birdsong Radio está también en el modo dormir.
- La web de Radio 432 (`radio432.com`) no respondió, y en la ficha se usa su reproductor de RadioKing. Esa dirección devolvió error 502 en una comprobación automática, así que el enlace "web" de esa tarjeta puede fallar. El stream funciona.
- `pais` no se ha rellenado en tres emisoras de Buggy Time por no estar claro. La web no lo usa.

### Cómo revertir
En `emisoras-modos.json`, borrar las 4 emisoras añadidas en `modos.calm.emisoras` y dejar `modos.buggy.emisoras` como `[]`. Este archivo aún no está en git, así que `git checkout` no sirve para restaurarlo.

---

## 2026-10-30 12:00 — Podio: arrastre con ratón desde toda la tarjeta y estrella reparada

### Objetivo
El usuario pidió revisar cómo se suben las emisoras al podio, porque unas funcionaban y otras no y arrastrarlas costaba. Preguntó si se pueden mover las tarjetas con el ratón, si eso saturaría la web y si convenía otro sistema.

### Archivos afectados
- `styles.css`: modificado.
- `app.js`: modificado.
- `index.html`: modificado (texto de ayuda).
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v16` a `v17`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Los iconos ⠿ y ⭐ vuelven a recibir los clics en Dormir y Music Time.
- Con ratón, la tarjeta se arrastra desde cualquier punto. El arrastre empieza al mover 6 px; un clic sin mover sigue reproduciendo. Soltar una tarjeta arrastrada no la reproduce.
- En móvil se sigue arrastrando desde ⠿, para no impedir el desplazamiento de la página, y sigue disponible la estrella.
- La estrella ahora alterna: sobre una tarjeta del podio la devuelve a la lista.
- Con el podio lleno, la estrella sustituye al 3.º. Antes sustituía al 1.º, la favorita.
- Las tarjetas ocultas por el filtro ya no cuentan como destino al arrastrar.
- Durante el arrastre se desactivan los desenfoques y transiciones de tarjetas y podio, y el hueco solo se mueve si cambia de sitio.
- La tarjeta arrastrada desde el podio sigue al ratón; antes `backdrop-filter` en la plaza alteraba su posición.

### Motivo
- Causa principal: al compactar las tarjetas (entrada "Tarjetas de emisora más pequeñas"), los iconos pasaron a flotar y la etiqueta de temática quedó encima de ellos. Afectaba al 100 % de las tarjetas probadas de Dormir y Music Time, y por eso unos modos funcionaban y otros no. Las pruebas de entonces pulsaban por código y no lo detectaron.
- No hacía falta otro sistema. En la medición, la maquetación más el recálculo de estilos sumaron unos 30-50 ms en cada arrastre de 24 movimientos, repartidos en todo el gesto.

### Validaciones
- Pruebas con eventos de ratón reales mediante el protocolo de Chrome sin ventana, a 1400×900.
- Antes del cambio: ⠿ al podio 4 de 4 en Normal y 0 de 4 en Music Time; arrastrar desde el cuerpo de la tarjeta, 0 de 8.
- Elemento que recibe el clic: antes, 0 de 5 en Dormir y 0 de 10 en Music Time; después, ⠿ y ⭐ correctos en las tarjetas probadas de los cinco modos.
- Después del cambio: ⠿ al podio 8 de 8 y tarjeta entera al podio 8 de 8 en Normal y Music Time, sin reproducir por accidente. Reordenar funciona 6 de 6.
- Clic sin mover: reproduce. Estrella: sube, sustituye al 3.º con el podio lleno y devuelve a la lista.
- Arrastre desde el podio: la tarjeta queda bajo el puntero y pasa a otra plaza. Arrastre en Dormir con filtro: correcto. Cada modo conserva su podio.
- Sin errores de JavaScript.
- No probado: arrastre real en un móvil físico, navegadores distintos de Chrome y la app instalada con `v17`. Las medidas de rendimiento son de Chrome sin ventana, no del móvil.

### Riesgos o pendientes
- En móvil el área de arrastre sigue siendo el icono ⠿, a propósito.
- Los cambios no están confirmados ni subidos a GitHub.

### Cómo revertir
Si no se ha confirmado, ejecutar `git checkout -- styles.css app.js index.html sw.js`. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 11:46 — Sin filtro "Todas" y etiquetas de ranking sin cortar

### Objetivo
El usuario avisó con una captura de que en el modo dormir se cortaba la primera línea de tarjetas. También pidió quitar el filtro "Todas" en Dormir y en Music Time porque salían demasiadas emisoras en pantalla.

### Archivos afectados
- `styles.css`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v14` a `v16`).
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- La cuadrícula deja 10 px de margen interior, compensados para que las tarjetas no se muevan. Las etiquetas de ranking y el brillo ya no se recortan.
- Se quita el filtro "Todas". Dormir abre en Lluvia y Music Time en Blues.
- Las tarjetas del podio se ven siempre, sea cual sea la temática elegida.
- El botón "Continuar" salta a la temática de la emisora que retoma.
- `categoria` pasa a ser obligatoria en Music Time, y el README lo indica.

### Motivo
- La etiqueta de ranking sobresale 8 px y el contenedor recorta lo que sale de sus bordes.
- El filtro también ocultaba las tarjetas del podio. Con "Todas" activo no se notaba, pero sin él las favoritas de otra temática habrían desaparecido.
- Sin "Todas", una emisora sin `categoria` no aparecería en ningún filtro.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores.
- Medición en la app real en Dormir a 1484 y 390 px: 62 etiquetas de ranking, ninguna fuera del área visible; sin desplazamiento horizontal. La captura de esa prueba salió en blanco por un fallo del navegador de prueba, así que el resultado viene de la medición.
- Recorrido a 1484 px, sin errores de JavaScript: ningún modo muestra "Todas"; 11 filtros en Dormir y 11 en Music Time; Music Time abre en Blues con 10 emisoras y Dormir en Lluvia con 5.
- Podio: una emisora de Blues sigue visible al filtrar por Metal, y una emisora desplazada del podio vuelve a su temática.
- "Continuar" retomó una emisora de Piano desde Lluvia y activó el filtro Piano.
- El modo normal sigue mostrando sus 45 emisoras tras salir de Dormir y Music Time.
- No probado: arrastre real de tarjetas, un móvil físico y la app instalada con `v16`.

### Riesgos o pendientes
- Ya no se pueden ver todas las emisoras de un modo a la vez.
- Los cambios no están confirmados ni subidos a GitHub.

### Cómo revertir
Si no se ha confirmado, ejecutar `git checkout -- styles.css app.js sw.js README.md`. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 11:38 — Temática Rock en español en Music Time

### Objetivo
El usuario aceptó crear una temática de rock en español, como alternativa a una emisora propia de Héroes del Silencio.

### Archivos afectados
- `emisoras-modos.json`: modificado (8 emisoras nuevas).
- `app.js`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v13` a `v14`).
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Music Time tiene la temática "🎤 Rock en español", colocada después de Años 80, y pasa a 98 emisoras.
- Añadidas: Mariskal Rock, Rock en Español, Rock En Español Chile, Isla Rock, Pobre Johnny, La Ñ, Solo Rock Nacional y La 100 Rock Nacional.
- Por encima de 768 px, los filtros de Music Time y Dormir pasan a una segunda línea en vez de quedar ocultos a la derecha. En móvil siguen deslizándose.

### Motivo
- Rock En Español Chile y La Ñ aparecían en el directorio con direcciones temporales que caducan. Se ha guardado su dirección estable de zeno.fm.
- Rock en Español y La 100 Rock Nacional usan la dirección de redirección de StreamTheWorld, que sobrevive a cambios de servidor.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores.
- Las 8 emisoras entregaron audio con certificado válido. Durante la prueba sonaban Caifanes en Rock en Español y Los Prisioneros en La Ñ; varias no publican el título.
- App real en una copia temporal con Chrome sin ventana a 1184 px, sin errores de JavaScript: 98 emisoras y 12 filtros, cada uno con su número esperado y la etiqueta correcta. Esta prueba incluye las 3 emisoras de Folk metal que quedaron sin recorrer en la entrada anterior.
- Captura de la fila de filtros a 1200 px revisada.
- No se ha ejecutado `scripts/check-streams.mjs` tras este cambio. No probado: sonido real, un móvil físico y la app instalada con `v14`.

### Riesgos o pendientes
- No hay garantía de que suene Héroes del Silencio. Mariskal Rock, la única emisora española, mezcla rock de varios estilos; tres son de rock argentino.
- Los cambios no están confirmados ni subidos a GitHub.

### Cómo revertir
Si no se ha confirmado, quitar las 8 emisoras con `"categoria": "rockespanol"` de `emisoras-modos.json`, la temática `rockespanol` de `app.js`, su mención en `README.md`, y devolver `CACHE_VERSION` a `v13`. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 11:32 — Temáticas Crooners, Folk metal y New age, y más emisoras en Music Time y Buggy Time

### Objetivo
El usuario pidió emisoras de Elvis, Sinatra, Rat Pack y similares, música de videojuegos estilo BioShock para Buggy Time, música celta y escocesa, Loreena McKennitt, Mike Oldfield, Bear McCreary, Enya, folk metal y viking metal, Faith No More y Héroes del Silencio. También pidió crear las temáticas Folk metal y New age en Music Time.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v12` a `v13`).
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Music Time pasa de 55 a 90 emisoras y añade tres temáticas: Crooners (11), Folk metal (8) y New age (16).
- Crooners incluye las emisoras de Elvis, Sinatra y Dean Martin, y otras de estilo crooner.
- New age incluye también las emisoras celtas, irlandesas y escocesas, porque el usuario pidió meterlas en esta temática o en Folk metal.
- Folk metal incluye rock medieval, folk rock, Radio Skald y dos emisoras generales de metal nórdico y melódico.
- Buggy Time pasa de 13 a 18 emisoras: dos de los años 40, dos de Fallout y Flash FM de GTA Vice City.

### Motivo
- Con 90 emisoras, cada estilo nuevo necesita su filtro.
- No existe una emisora propia de Enya, Loreena McKennitt, Bear McCreary, Faith No More ni Héroes del Silencio, o no se encontró ninguna en servicio. Por eso no se han añadido emisoras a su nombre.
- No hay emisoras alternativas añadidas para Faith No More ni Héroes del Silencio: las encontradas no garantizan que suenen esos grupos, y el rock en español no tiene temática propia.
- No se ha encontrado ninguna emisora solo de viking metal. Radio Skald es la más cercana por su etiqueta.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores.
- Todas las emisoras nuevas se probaron con descarga de audio por HTTPS. El título en emisión se leyó en las que lo publican.
- App real en una copia temporal con Chrome sin ventana a 1184 px, con 87 emisoras en Music Time y sin errores de JavaScript: los 11 filtros muestran su número esperado de emisoras con la etiqueta correcta; Buggy Time muestra 18 tarjetas y ningún filtro.
- Las tres últimas emisoras de Folk metal se añadieron después y se probaron con `curl`, pero no se repitió el recorrido por la app.
- `scripts/check-streams.mjs` sobre una copia, antes de esas tres emisoras: 217 comprobadas y 11 fallos. MegaStar FM da 404, Otsuchi y CyberForest agotan el tiempo, y las 8 emisoras de RADIO BOB! dan "fetch failed".
- `curl` recibió audio de RADIO BOB! en esta sesión; el motivo del fallo solo en el script sigue sin aclararse.
- No probado: sonido real de las emisoras nuevas, un móvil físico, las emisoras OGG de Fallout en iPhone, la captura de la fila de 11 filtros y la app instalada con `v13`.

### Riesgos o pendientes
- Las dos emisoras de Fallout usan formato OGG, que puede no sonar en iPhone.
- Las 8 emisoras de RADIO BOB! pueden provocar avisos en la revisión del lunes si GitHub obtiene el mismo fallo.
- El nombre de la temática New age no refleja que también contiene música celta.
- Los cambios de esta entrada y de la anterior no están confirmados ni subidos a GitHub.

### Cómo revertir
Si no se ha confirmado, ejecutar `git checkout -- app.js emisoras-modos.json sw.js README.md`. Eso también deshace las temáticas de la entrada anterior, porque están en los mismos archivos sin confirmar. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 11:24 — Temáticas en Music Time

### Objetivo
El usuario pidió crear temáticas en el modo Music Time.

### Archivos afectados
- `emisoras-modos.json`: modificado (campo `categoria` en las 55 emisoras de Music Time).
- `app.js`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v11` a `v12`).
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Music Time tiene ahora filtros: Todas, Blues (10), Rock años 70 (8), Rock'n'roll clásico (6), Años 80 (6), Soundtracks (8), Metal (9) y Metal melódico (8).
- Cada tarjeta de Music Time muestra su temática encima del nombre.
- Los filtros reutilizan los del modo dormir, que siguen igual.

### Motivo
- Con 55 emisoras hacía falta poder ir directamente a un género.
- Reutilizar los filtros existentes evita mantener dos versiones. Las temáticas de cada modo se definen en `MODE_CATEGORIES`, y así Big Calm o Buggy Time podrían tener las suyas añadiendo una entrada.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores.
- App real en una copia temporal con Chrome sin ventana a 1184 px, sin errores de JavaScript: cada filtro muestra el número esperado de emisoras, todas con su etiqueta correcta, y "Ver más" se oculta cuando la lista filtrada cabe.
- Una emisora filtrada se reproduce desde su tarjeta; el filtro vuelve a "Todas" al salir y entrar en el modo.
- Normal, Big Calm y Buggy Time no muestran filtros; Dormir conserva sus 12.
- Capturas de Music Time a 1200 y 390 px revisadas.
- El usuario indicó durante el trabajo que lo existente le funciona. No se ha probado el sonido real desde esta sesión ni un móvil físico.

### Riesgos o pendientes
- Algunas emisoras son mixtas y la temática es una decisión aproximada: Classic Vinyl HD va en Rock'n'roll clásico aunque emite sobre todo música de los años 40 y 50.
- Las tarjetas de Music Time son unos 20 px más altas por la etiqueta de temática.
- Los cambios de esta entrada no están confirmados ni subidos a GitHub.

### Cómo revertir
Si no se ha confirmado, ejecutar `git checkout -- app.js emisoras-modos.json sw.js README.md`. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 11:18 — 52 emisoras en Music Time, selector desplegable y arranque en modo normal

### Objetivo
El usuario pidió añadir las emisoras de la lista a Music Time, cambiar la fila de botones por un selector desplegable arriba a la derecha y que la web entre por defecto en el modo normal.

### Archivos afectados
- `emisoras-modos.json`: modificado (52 emisoras nuevas en `modos.music.emisoras`).
- `index.html`: modificado.
- `app.js`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v10` a `v11`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Music Time pasa de 3 a 55 emisoras, ordenadas por género: blues, rock de los 70, rock'n'roll, años 80, bandas sonoras, metal y metal melódico.
- Los cinco botones se sustituyen por un desplegable arriba a la derecha con los cinco modos. Usa la lista nativa del navegador o del móvil.
- Por debajo de 1000 px de ancho, el selector va centrado encima del título.
- La web arranca siempre en el modo normal. Ya no recuerda el último modo; orden y podio de cada modo sí se conservan.
- La cabecera recupera su margen superior original.

### Motivo
- A 700 px el selector tapaba parte del título, por eso se coloca a la derecha solo cuando hay sitio.
- El texto del selector mide 1rem porque, con menos, iOS amplía la página al tocarlo.
- Si no se recuerda el modo, las claves `radioMicroMode` y `radioMicroSleepMode` que queden en un navegador se ignoran sin causar problemas.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores.
- App real en una copia temporal con Chrome sin ventana a 1184 px, con `radioMicroMode` en `calm` y el modo dormir antiguo activados a propósito: la web entró en el modo normal, con el selector en esa opción.
- Selector probado en los cinco modos, sin errores de JavaScript: 45, 55, 5, 13 y 62 tarjetas, sin nombres repetidos. El reproductor se cierra al cambiar de modo.
- Capturas a 390, 700, 1010 y 1200 px revisadas: el selector no tapa el título.
- `scripts/check-streams.mjs` sobre una copia: 180 emisoras comprobadas y 8 fallos. MegaStar FM da 404 (ya conocido), CyberForest Fuji agota el tiempo (ya conocido) y las 6 emisoras de RADIO BOB! dan "fetch failed".
- `curl` recibió audio con certificado válido de RADIO BOB! Blues, RADIO BOB! Rockabilly y Epic Rock Radio. El resto de emisoras de RADIO BOB! dieron audio en la prueba de la búsqueda.
- La lista desplegable abierta no se ha podido ver en capturas. No probado: sonido real, un móvil físico y la app instalada con `v11`.

### Riesgos o pendientes
- Las 6 emisoras de RADIO BOB! pueden provocar avisos en la revisión del lunes si GitHub obtiene el mismo fallo que este equipo. El 26 de octubre RADIO BOB! Blues funcionó desde GitHub. No se ha averiguado por qué falla solo con el script.
- MegaStar FM sigue dando 404 y puede generar aviso.
- Los cambios de esta entrada y el ajuste de "Ver más" de la anterior no están confirmados ni subidos a GitHub.

### Cómo revertir
Si no se ha confirmado, ejecutar `git checkout -- emisoras-modos.json index.html styles.css sw.js app.js`. Eso también deshace el ajuste de "Ver más" de la entrada anterior, que está sin confirmar en `app.js`. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 11:08 — Modo Music Time con las emisoras de blues

### Objetivo
El usuario pidió crear el modo Music Time, buscar una lista de emisoras de varios géneros (de momento solo la lista) y pasar a ese modo las emisoras de blues que ya existían.

### Archivos afectados
- `emisoras-modos.json`: modificado.
- `stations.json`: modificado (salen las tres emisoras de blues).
- `app.js`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v9` a `v10`).
- `scripts/check-streams.mjs`: modificado (solo el comentario inicial).
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Se añade un quinto botón, "🎸 Music Time", con colores ámbar y rojo y su propio orden y podio.
- RADIO BOB! Blues, JZR Blues y Carbon Radio (Psych Blues) pasan de `stations.json` a `modos.music.emisoras`. El modo normal se queda con 45 emisoras.
- Se quitan los estilos del bloque "Blues internacional", que ya no se usan.
- "Ver más" se calcula en el momento, sin esperar al siguiente fotograma.
- La lista de emisoras de la búsqueda no se ha añadido a la web: solo se ha entregado al usuario.
- El subtítulo "Blues, rock y metal" y la frase "Sube el volumen." son textos provisionales propuestos por la IA.

### Motivo
- Mover las emisoras exigía que el modo existiera, aunque el resto de la búsqueda quedara pendiente.
- Al leer el alto de la cuadrícula el navegador ya lo calcula, así que esperar un fotograma no aportaba nada y dejaba el botón con un valor antiguo en las pruebas.

### Validaciones
- `node --check` de `app.js` y `sw.js`: sin errores. Listas leídas: 45 en normal, 5 en Big Calm, 3 en Music Time y 13 en Buggy Time.
- App real en una copia temporal con Chrome sin ventana a 1184 px: sin errores de JavaScript; las tres emisoras salen en Music Time y no en el modo normal; la primera abre el reproductor; orden y podio se guardan aparte.
- Podio antiguo con una emisora movida: la web la ignora sin fallar y conserva el resto.
- "Ver más": visible en Normal y Dormir, oculto en Big Calm, Music Time y Buggy Time, y también al filtrar por Meditación. Esto resuelve la comprobación que quedó pendiente en la entrada anterior.
- Captura de Music Time a 1200 px revisada.
- `scripts/check-streams.mjs` sobre una copia: 128 emisoras comprobadas. JZR Blues y Carbon Radio responden. RADIO BOB! Blues da "fetch failed" en ese script desde este equipo, como en revisiones anteriores, pero `curl` recibió audio de ella con certificado válido.
- Búsqueda: emisoras probadas con descarga real de audio por HTTPS y lectura del título en emisión cuando la emisora lo publica.
- No probado: sonido real, un móvil físico, la fila de cinco botones a 390 px y la app instalada con `v10`.

### Riesgos o pendientes
- Al salir de `stations.json`, las tres emisoras empezarán un historial nuevo en `stream-health.json`.
- Quien tuviera alguna de las tres en el podio del modo normal deberá añadirla al podio de Music Time.
- El usuario subió el commit `37ebd6c` durante este trabajo. Queda sin confirmar el ajuste de "Ver más" en `app.js`, junto con esta entrada del registro.

### Cómo revertir
Si no se ha confirmado, devolver las tres líneas de blues al principio de `stations.json`, quitar el bloque `music` de `emisoras-modos.json`, el botón de `index.html`, las entradas `music` de `app.js` y los estilos `music-mode` de `styles.css`, y restaurar los estilos `category-blues-internacional` y el `requestAnimationFrame` de `updateGridToggleVisibility` desde esta entrada o desde `git diff`. No conviene usar `git checkout`, porque desharía también las entradas anteriores aún sin confirmar. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 10:34 — Modos Big Calm y Buggy Time

### Objetivo
El usuario pidió dos modos nuevos: Big Calm, para las emisoras confirmadas a 432 Hz y con una marca visible, y un segundo modo que primero llamó Freak Time y luego renombró Buggy Time. Más adelante aportará más emisoras para ambos.

### Archivos afectados
- `emisoras-modos.json`: creado.
- `app.js`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v8` a `v9`).
- `scripts/check-streams.mjs`: modificado.
- `README.md`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- El botón único "Modo dormir" se sustituye por cuatro botones: Normal, Dormir, Big Calm y Buggy Time.
- Cada modo nuevo tiene sus colores, títulos, orden y podio propios. La web recuerda el último modo usado, y quien tuviera activo el modo dormir sigue entrando en él.
- Las listas de los dos modos están en `emisoras-modos.json`, un único archivo fácil de ampliar.
- Big Calm tiene una emisora: Positively Peaceful 432Hz. Es la única que dio cerca de 432 Hz en la medición de esta sesión (unos 433 Hz en dos tomas).
- Las emisoras con el campo `afinacion` muestran una etiqueta "🎵 432 Hz" y un borde destacado en la tarjeta, y el dato también aparece en el reproductor.
- Buggy Time empieza vacío: muestra un aviso y oculta el podio. Su texto de cabecera ("Sin parches" y la frase inferior) es provisional, porque el usuario no lo indicó.
- La revisión semanal de emisoras también comprueba `emisoras-modos.json`.
- "Ver más" se oculta cuando no hace falta y el degradado inferior deja de tapar las tarjetas si todo cabe. Al cambiar de modo, la lista vuelve a plegarse.
- La cabecera reduce su margen superior para compensar la fila de botones, y Big Calm no muestra la luna porque tapaba el subtítulo.

### Motivo
- El temporizador, los filtros y la pantalla atenuada siguen siendo exclusivos del modo dormir, porque no se pidieron para los modos nuevos.
- La etiqueta depende de un campo de datos y no del nombre, porque 432hz Radio y Radio 432hz llevan "432" en el nombre y midieron unos 444-445 Hz.
- "Ver más" nunca se ocultaba por un fallo anterior: su `display: block` anulaba el atributo `hidden`. Con listas cortas se notaba mucho.
- Las pruebas revelaron que, al cambiar de modo muy deprisa, el orden de un modo se guardaba como si fuera el de otro. Ahora solo se guarda el orden del modo que está realmente pintado, y una lista que termina de cargar tarde ya no sustituye a la del modo activo.

### Validaciones
- `node --check` de `app.js`, `sw.js` y `scripts/check-streams.mjs`: sin errores.
- `emisoras-modos.json` se lee correctamente: 1 emisora en Big Calm y 0 en Buggy Time.
- App real en una copia temporal con Chrome sin ventana a 1184 px: recorrido por los cuatro modos, sin errores de JavaScript; 48, 62, 1 y 0 tarjetas en Normal, Dormir, Big Calm y Buggy Time.
- Etiqueta "432 Hz" visible en la tarjeta y en el reproductor; el reproductor se cierra al cambiar de modo.
- Cambio rápido entre modos: el orden guardado de Big Calm solo contiene su emisora y el modo normal conserva sus 48. Antes de la corrección fallaba.
- "Ver más": visible en Normal y Dormir, oculto en Big Calm y Buggy Time, y la lista se pliega al salir de un modo expandido.
- Capturas de Big Calm y Buggy Time a 1200 px revisadas. Big Calm también se vio a 390 px antes de los últimos ajustes visuales.
- `scripts/check-streams.mjs` sobre una copia: Positively Peaceful 432Hz responde 200 y aparece como `[modos]`.
- No probado: sonido real de la emisora, un móvil físico, arrastrar tarjetas en los modos nuevos, la app instalada con `v9`, Buggy Time con emisoras reales y la captura final a 390 px.
- No comprobado: que "Ver más" se oculte al filtrar por temática en el modo dormir. El navegador de prueba no llegó a ejecutar ese fotograma; en un navegador normal debería funcionar.

### Riesgos o pendientes
- La medición de Big Calm se hizo sobre unos 4 minutos de emisión. No garantiza que todo lo que emita esa emisora esté a 432 Hz.
- Las emisoras nuevas para Big Calm conviene medirlas antes de ponerles la etiqueta.
- El historial de `stream-health.json` empezará a incluir la emisora nueva en la próxima revisión.
- Los cambios no se han subido a GitHub, así que aún no están publicados en Vercel.

### Cómo revertir
Si no se ha confirmado, ejecutar `git checkout -- app.js index.html styles.css sw.js scripts/check-streams.mjs README.md` y borrar `emisoras-modos.json`. Ese comando también deshace las tarjetas compactas de la entrada siguiente, porque aún están sin confirmar en los mismos archivos; para conservarlas, hay que quitar a mano solo los cambios de esta entrada. Si ya se confirmó, usar `git revert` sobre ese commit.

---

## 2026-10-30 10:21 — Tarjetas de emisora más pequeñas (opción A, compacta)

### Objetivo
El usuario pidió reducir el tamaño de las pastillas de las radios. Vio una maqueta con dos opciones y eligió la opción A, la compacta.

### Archivos afectados
- `styles.css`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado (`CACHE_VERSION` pasa de `v7` a `v8`).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- Cada tarjeta muestra la frecuencia una sola vez. Antes salía dos veces seguidas. Mientras suena una emisora, el estado ocupa ese lugar; al pararla, la frecuencia vuelve a aparecer.
- Los iconos de arrastrar y de añadir al podio flotan en la esquina superior derecha, en vez de ocupar una fila entera.
- Se han reducido márgenes, separaciones y el tamaño del nombre, y el ancho mínimo de la tarjeta baja de 230 a 190 px. En escritorio caben 5 columnas en lugar de 4.
- En pantallas táctiles, el botón de la estrella pasa de 44×44 a 40×44 px para dejar espacio al nombre, y el área de toque del icono de arrastre sigue ampliada.
- Se ha quitado el estilo `.station-freq`, que ya no se usa.

### Motivo
- La frecuencia duplicada y la fila de iconos eran lo que más altura gastaba.
- El nombre lleva un hueco a la derecha para no pisar los iconos. El estado no lo lleva, porque va debajo de ellos, y así los textos largos como "TOCA PARA REANUDAR" caben en una línea.
- Hay que subir `CACHE_VERSION` para que quien tenga la app instalada reciba el diseño nuevo.

### Validaciones
- `node --check app.js`: sin errores.
- App real en una copia temporal, con Chrome sin ventana a 1184 px y a 390 px con pantalla táctil simulada: 48 tarjetas y ningún error de JavaScript.
- Resultado a 1184 px: 5 columnas, altura típica de 80 px y lista completa de 869 px. Referencia de la maqueta para el diseño anterior: 137 px y 1821 px.
- Resultado a 390 px: 2 columnas, altura típica de 80 px, lista completa de 2050 px y estrella de 40×44 px. Referencia de la maqueta para el diseño anterior: 145 px y 3849 px.
- En ambos anchos: ningún nombre se solapa con los iconos, pulsar una tarjeta cambia su estado, la estrella la lleva al podio y el modo dormir abre sus 62 emisoras.
- A 1184 px, sin este último ajuste, el estado "TOCA PARA REANUDAR" ocupaba dos líneas. Tras el ajuste no se ha revisado en captura a ese ancho; a 390 px sí cabe en una línea.
- No probado: un móvil físico, el arrastre de tarjetas con el dedo o el ratón, y la actualización de la app instalada con la nueva versión de caché.

### Riesgos o pendientes
- Las emisoras de blues internacional son algo más altas que el resto por su rótulo "Blues internacional", que la maqueta no incluía. En escritorio la tarjeta más alta mide 101 px y en móvil 122 px.
- En el modo dormir las tarjetas siguen siendo más altas (116 px de media) porque llevan temática, votos y kbps.
- El cambio no se ha subido a GitHub, así que aún no está publicado en Vercel.

### Cómo revertir
Ejecutar `git checkout -- app.js styles.css sw.js` si el cambio aún no se ha confirmado. Si ya se confirmó, usar `git revert` sobre ese commit. En ambos casos, borrar esta entrada de `CAMBIOS_IA.md` solo si se quiere dejar el registro como estaba.

---

## 2026-10-30 10:10 — Arreglo de la revisión semanal de emisoras y aviso con la lista de caídas

### Objetivo
La tarea automática de los lunes ("Comprobar streams de emisoras") aparecía siempre en rojo en GitHub. El usuario pidió averiguar el motivo y que el email del error indicara qué emisoras fallan.

### Archivos afectados
- `scripts/check-streams.mjs`: modificado.
- `.github/workflows/check-streams.yml`: modificado.
- `stations.json`: modificado (solo la entrada de Europa FM).
- `README.md`: modificado.

### Cambios realizados
- La comprobación se identifica ahora como un navegador. SomaFM rechazaba (error 403) el identificador por defecto de Node.
- Europa FM lleva un campo nuevo, `geoRestricted: true`, y una nota. Para esa emisora, un 403 ya no cuenta como caída; cualquier otro error sí. La web ignora este campo y Europa FM sigue sonando igual.
- Cuando hay emisoras caídas, el script genera una tabla con emisora, archivo, resultado, semanas seguidas y dirección del stream.
- Un paso nuevo del workflow copia esa tabla al resumen de la ejecución y abre con ella un issue en GitHub, que GitHub envía por email. Se abre un issue por cada ejecución con fallos; no se cierran solos.
- El README explica el campo `geoRestricted`.

### Motivo
- El rojo no era una avería de la tarea: falla a propósito si cae alguna emisora marcada como fiable. Según el historial, Europa FM dio 403 en todas las ejecuciones desde el 5 de octubre y SomaFM el 26 de octubre.
- `reliable: false` no servía para Europa FM porque la app trata esas emisoras como si no tuvieran stream y dejaría de reproducirse.
- El email automático de GitHub no se puede personalizar. El issue permite incluir la lista sin guardar contraseñas de correo en el repositorio.

### Validaciones
- Comprobación de SomaFM con y sin identificador de navegador: 403 sin él y 206 con él.
- Comprobación de Europa FM desde este equipo (España): 206. No se ha podido probar desde los servidores de GitHub; que sea un bloqueo geográfico es una deducción.
- Script corregido sobre una copia con todas las emisoras: 105 correctas y 5 fallos, ninguno de SomaFM ni Europa FM, con el informe generado.
- Fallo forzado sobre una copia: un 404 aparece en el informe y un 403 con `geoRestricted` queda fuera de él.
- `stations.json` y el YAML del workflow se leen sin errores.
- No probado: el paso del issue y el email, porque solo funcionan en GitHub tras subir el cambio.

### Riesgos o pendientes
- MegaStar FM da 404 desde este equipo (`stations.json`), repetido en dos comprobaciones más; el 26 de octubre funcionaba. Si sigue así, el lunes habrá aviso. No se ha cambiado su dirección.
- RADIO BOB! Blues, Radio María, Otsuchi y CyberForest Fuji fallan desde este equipo, pero funcionaron desde GitHub el 26 de octubre.
- La tarea puede seguir en rojo por caídas puntuales: pasó el 19 de octubre con myNoise Pure Nature y Enigmatic Immersion.
- Si Europa FM dejara de funcionar con un 403 de verdad, no habría aviso.
- El aviso `Node.js 20 is deprecated` no se ha tocado; no causa el fallo.

### Cómo revertir
Ejecutar `git checkout -- scripts/check-streams.mjs .github/workflows/check-streams.yml stations.json README.md` si no se ha hecho commit, o `git revert` del commit correspondiente si ya se ha hecho. Después, quitar esta entrada de `CAMBIOS_IA.md`.

---

## 2026-09-25 11:30 — Historial de fallos de streams para el cron de revisión

### Objetivo
Llevar un registro de las emisoras que más fallan al conectar para que la revisión semanal lo tenga en cuenta.

### Archivos afectados
- `scripts/check-streams.mjs`: modificado.
- `.github/workflows/check-streams.yml`: modificado.
- `stream-health.json`: creado (lo genera el script).
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
El script guarda en `stream-health.json`, por cada emisora, cuántas veces se ha comprobado, cuántas ha fallado, cuántos fallos seguidos lleva y cuándo fue el último fallo/acierto. Al final muestra las 10 con más fallos y marca como "CRÓNICA" las que llevan 2 o más semanas seguidas caídas, sugiriendo quitarlas o marcarlas `reliable:false`. Las emisoras eliminadas de las listas se borran del historial. El workflow, tras la comprobación (incluso si falla), guarda el archivo en el repositorio con un commit automático; para eso se le da permiso `contents: write`.

### Motivo
Un fallo puntual no significa lo mismo que una emisora caída semanas seguidas; el historial permite distinguirlas. Es un sitio estático sin servidor, por lo que no se pueden recoger los fallos de conexión de los navegadores de los usuarios: el registro se basa solo en las comprobaciones del cron.

### Validaciones
- `node --check` del script: sin errores.
- Ejecución real en local: se genera `stream-health.json` y se muestra el ranking. 4 emisoras fallaron en esa ejecución (RADIO BOB! Blues, Radio María, Otsuchi Coastal Soundscape, CyberForest Fuji).
- El workflow de GitHub Actions NO se ha probado (solo se puede ejecutar en GitHub).

### Riesgos o pendientes
- El workflow hace `git push` a la rama por defecto con un commit automático cada lunes que cambie el archivo; si la rama estuviera protegida, el push fallaría.
- El historial local ya contiene 1 comprobación de esta prueba; si se quiere empezar de cero, borrar `stream-health.json` antes de hacer commit.
- El script sigue terminando con error si alguna emisora falla, como antes.

### Cómo revertir
`git checkout <commit-anterior> -- scripts/check-streams.mjs .github/workflows/check-streams.yml` y borrar `stream-health.json`.

---

## 2026-09-25 11:00 — Botón del huevo de pascua a la izquierda

### Objetivo
Mover el botón discreto del huevo de pascua del lado derecho al izquierdo.

### Archivos afectados
- `styles.css`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
El punto `.easter-egg-trigger` pasa de `right: 10px` a `left: 10px`. El mini vídeo que aparece al activarlo sigue abajo a la derecha.

### Motivo
Petición del usuario.

### Validaciones
- No probado en navegador real (cambio de una propiedad CSS).

### Riesgos o pendientes
- Ninguno detectado.

### Cómo revertir
`git checkout <commit-anterior> -- styles.css`.

---

## 2026-09-25 10:40 — Barra de desplazamiento de los chips en el tono de la web

### Objetivo
Que la barra de desplazamiento horizontal de las etiquetas de temática del modo dormir encaje con el estilo de la web.

### Archivos afectados
- `styles.css`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
Se estiliza la barra de `.sleep-chips`: más fina (6 px), pista transparente y control redondeado en el azul violáceo del modo dormir, con `scrollbar-width`/`scrollbar-color` (Firefox) y `::-webkit-scrollbar` (Chrome, Edge, Safari).

### Motivo
La barra por defecto del navegador destacaba en gris claro sobre el fondo nocturno.

### Validaciones
- No probado en navegador real (solo CSS añadido).

### Riesgos o pendientes
- Comprobar el aspecto en el navegador. En móvil las barras suelen ser superpuestas y no se ven.

### Cómo revertir
`git checkout <commit-anterior> -- styles.css`.

---

## 2026-09-25 10:20 — Guardar el podio al cambiar de modo

### Objetivo
Que el podio y el orden de cada modo se guarden al pasar de uno a otro.

### Archivos afectados
- `app.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
Al pulsar el botón de modo, antes de cambiar se guarda el orden y el podio del modo que se deja, en su propia clave de `localStorage`. Solo se guarda si ya hay tarjetas pintadas, para no grabar un estado vacío si la carga anterior no había terminado.

### Motivo
Antes solo se guardaba al arrastrar o pulsar "⭐ Al podio"; guardar también al cambiar de modo lo hace más robusto.

### Validaciones
- `node --check app.js`: sin errores. No probado en navegador real.

### Riesgos o pendientes
- Verificar en el navegador alternando modos con favoritas en ambos podios y recargando. Si había datos mezclados de antes de la corrección anterior, puede hacer falta vaciar las claves `radioMicroState` y `radioMicroSleepState` del almacenamiento del navegador.

### Cómo revertir
`git checkout <commit-anterior> -- app.js`.

---

## 2026-09-25 10:00 — TOP 3 independiente en cada modo

### Objetivo
Que el podio TOP 3 del modo normal y el del modo dormir no se mezclen ni dupliquen tarjetas.

### Archivos afectados
- `app.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
Al cambiar de modo se vacían los tres huecos del podio antes de pintar las tarjetas del modo actual, y después se colocan solo las guardadas para ese modo.

### Motivo
El podio es un único bloque de HTML compartido; las tarjetas del modo anterior se quedaban dentro y las del nuevo modo se añadían encima. Cada modo ya guardaba su podio en su propia clave de `localStorage`; faltaba limpiar el HTML.

### Validaciones
- `node --check app.js`: sin errores. No probado en navegador real.

### Riesgos o pendientes
- Verificar en el navegador alternando modos varias veces con favoritas en ambos podios.

### Cómo revertir
`git checkout <commit-anterior> -- app.js`.

---

## 2026-09-25 09:30 — Correcciones del modo dormir: menú del temporizador y atenuación

### Objetivo
Corregir que el menú del temporizador se veía siempre, y limitar la atenuación de pantalla a móvil.

### Archivos afectados
- `styles.css`: modificado.
- `app.js`: modificado.
- `CAMBIOS_IA.md`: modificado.

### Cambios realizados
- El menú del temporizador (y también el propio temporizador, los chips y el botón "Continuar") ignoraban el atributo `hidden` porque su `display` lo anulaba; se añade una regla para que `hidden` gane. Ahora el menú solo aparece al pulsar ⏱ y se cierra al elegir una opción, al volver a pulsar el botón o al pulsar fuera.
- La capa de atenuación solo se activa en dispositivos táctiles (`pointer: coarse`), no en escritorio.

### Motivo
Un `display: flex` en CSS tiene más prioridad que el atributo `hidden` del navegador.

### Validaciones
- `node --check app.js`: sin errores. No probado en navegador real.

### Riesgos o pendientes
- Verificar visualmente en el navegador. En un escritorio con pantalla táctil la atenuación también se activará.

### Cómo revertir
Restaurar `styles.css` y `app.js` con `git checkout <commit-anterior> -- styles.css app.js`.

---

## 2026-09-24 17:35 — Implementación del "modo dormir"

### Objetivo
Implementar lo descrito en `PROMPT_MODO_DORMIR.md`: un botón en la cabecera que active un "modo dormir" con emisoras de sonidos relajantes (`emisoras-relax.json`), manteniendo la misma estructura de TOP 3 y cuadrícula que el modo normal, más funciones propias para dormir (temporizador con fundido, pantalla encendida, control desde pantalla bloqueada, filtro por temática, continuar donde lo dejé, fundidos de volumen, salto a alternativa de la misma temática si una emisora falla) y ampliar la comprobación automática de streams a las dos listas.

### Archivos afectados
- `index.html`: modificado. Botón "🌙 Modo dormir"/"☀️ Modo normal" en la cabecera, fondo de luna y estrellas (además del sol existente), fila de chips de temática, botón "Continuar", temporizador de apagado dentro del mini-reproductor, aviso ("toast") de cambio de emisora y capa de atenuación de pantalla.
- `app.js`: modificado. Se generaliza la carga de emisoras y el guardado en `localStorage` para trabajar con dos "modos" (normal/dormir) sin duplicar `createCard`, `renderGrid`, `playStation`, la reconexión ni el arrastrar y soltar del podio, que se reutilizan tal cual. Se añaden: aplanado de `emisoras-relax.json` al formato interno de emisora, orden inicial por temática y votos, ranking por votos (chapa `#N` en la tarjeta), botón alternativo "⭐ Al podio" para tocar en vez de arrastrar, filtro por chips de temática, temporizador de apagado con fundido de volumen (basado en marca de tiempo, no en `setInterval` puro, para sobrevivir a pantalla bloqueada), fundidos de volumen al empezar/cambiar de emisora, `Wake Lock` (pantalla encendida) y capa de atenuación tras 20 s sin tocar, integración con `navigator.mediaSession` para controlar play/pausa desde la pantalla de bloqueo, salto a otra emisora de la misma temática (por votos) si la actual falla repetidamente, "continuar donde lo dejé" y guardado del modo elegido y del podio/orden del modo dormir en su propia clave de `localStorage` (`radioMicroSleepState`, `radioMicroSleepMode`, etc.), separada de la del modo normal.
- `styles.css`: modificado. Paleta y fondo específicos del modo dormir (`body.sleep-mode`, variables CSS), luna y estrellas en CSS puro con animaciones lentas (respetando `prefers-reduced-motion` y pausándose con la pestaña oculta), estilos de la chapa de ranking, la etiqueta de temática, los chips, el temporizador, el aviso de cambio de emisora, la capa de atenuación, el botón "Continuar" y el botón "Al podio", todos pensados para móvil (áreas táctiles ≥44 px, botón de play/pausa de 56 px en modo dormir).
- `sw.js`: modificado. Se añade `emisoras-relax.json` a la lista de archivos precacheados y se trata igual que `stations.json` (red primero, caché de respaldo). Se sube `CACHE_VERSION` de `v6` a `v7` para que las instalaciones ya hechas reciban los cambios.
- `scripts/check-streams.mjs`: modificado. Ahora lee `stations.json` **y** `emisoras-relax.json` (aplanando sus categorías), distingue cada emisora con el prefijo `[normal]` o `[dormir]` en la consola, indica en qué archivo revisar cada una que falle, y comprueba en lotes de 10 en paralelo en vez de todas a la vez.

### Motivo
Ofrecer una alternativa de radio pensada para relajarse y dormir, sin duplicar la lógica de reproducción/reconexión ya probada del modo normal (se reutiliza integramente) y sin mezclar sus datos, orden ni podio con los de las emisoras habituales. Las funciones de temporizador, pantalla encendida y control desde bloqueo están pensadas para el uso real: el móvil en la mesilla con la pantalla bloqueada.

### Validaciones
- `node --check app.js` y `node --check scripts/check-streams.mjs`: sin errores de sintaxis.
- `node scripts/check-streams.mjs` ejecutado en local: comprueba 111 emisoras (49 del modo normal + 62 del modo dormir) con prefijos `[normal]`/`[dormir]`; termina con 3 caídas puntuales identificadas con el archivo a revisar en cada caso (`RADIO BOB! Blues` en `stations.json`; `Otsuchi Coastal Soundscape` y `CyberForest Fuji` en `emisoras-relax.json`), sin relación con este cambio de código.
- Comprobación de que todos los `id` usados por `app.js` (`getElementById`) existen en `index.html` (script de verificación ad hoc): sin IDs huérfanos.
- Comprobación de balance de etiquetas HTML abiertas/cerradas en `index.html` (`div`, `header`, `main`, `footer`, `section`, `button`, `audio`): todas balanceadas.
- Servidor estático local (Node) para comprobar que `index.html` y `emisoras-relax.json` se sirven y el JSON es válido: correcto.

### Riesgos o pendientes
- **No se ha podido probar en un navegador real** (ni de escritorio ni móvil, ni en distintos anchos, ni Safari iOS): este entorno no tiene acceso a un navegador gráfico ni a herramientas de captura de pantalla. Falta la verificación visual/interactiva pedida en el prompt (activar y desactivar el modo, reproducir, recargar y comprobar que se recuerda, fundido del temporizador, filtro, capa de atenuación, sin errores de consola, y prueba en vista móvil 360/375 px).
- No se ha podido probar el bloqueo de pantalla real con `Wake Lock` ni el control desde pantalla bloqueada con `mediaSession` (requiere un dispositivo real).
- No se ha probado en Safari iOS ni Chrome Android reales.
- El aplanado de `emisoras-relax.json` asume que `codec` solo vale `MP3` o `AAC` (comprobado por script: es así en las 62 emisoras actuales); si en el futuro se añaden emisoras con otro codec, revisar el mapeo a `streamType`.
- Recomendación antes de dar la función por cerrada: abrir la web en un navegador (escritorio y móvil) y seguir la lista de comprobación del apartado "Al terminar" de `PROMPT_MODO_DORMIR.md`.

### Cómo revertir
Deshacer los cambios en `index.html`, `app.js`, `styles.css`, `sw.js` y `scripts/check-streams.mjs` de este commit (por ejemplo con `git revert` sobre el commit correspondiente, o restaurando estos cinco archivos a su versión anterior con `git checkout <commit-anterior> -- index.html app.js styles.css sw.js scripts/check-streams.mjs`). `emisoras-relax.json` puede conservarse sin efecto si se revierte el resto, ya que solo se usa desde el código revertido.

---

## 2026-09-24 12:00 — Preparación del modo dormir (datos y prompt)

### Objetivo
El usuario quiere añadir un botón de "modo dormir" con emisoras relajantes y pidió un prompt para el agente que programa la web.

### Archivos afectados
- `emisoras-relax.json`: creado.
- `PROMPT_MODO_DORMIR.md`: creado.

### Cambios realizados
Se añadió una lista de 62 emisoras de sonidos relajantes agrupadas en 11 temáticas, con foco en lluvia, mar y bosque (fuente: radio-browser.info, ordenadas por votos de la comunidad). Todas con HTTPS y comprobadas con `curl` el 2026-09-24. Se añadió el prompt con las instrucciones de implementación. No se ha tocado código de la web.

### Motivo
Dar al agente de desarrollo los datos y las instrucciones para implementar el modo dormir.

### Validaciones
- Comprobación de cada stream con `curl` (respuesta 200/206 con audio). Las que no respondieron por HTTPS se descartaron.

### Riesgos o pendientes
- Los streams de terceros pueden cambiar o caer con el tiempo.
- Falta implementar el modo dormir en la web (lo hará el agente con el prompt).

### Cómo revertir
Borrar `emisoras-relax.json` y `PROMPT_MODO_DORMIR.md`.

---

## 2026-09-17 11:10 — Bloque de blues internacional (3 emisoras nuevas)

### Objetivo
El usuario pidió añadir un bloque de tres emisoras de blues internacional al principio de la lista, sin tocar las emisoras españolas ya existentes, con el mismo formato de datos que el resto y distinguidas visualmente como bloque aparte.

### Archivos afectados
- `stations.json`: modificado.
- `app.js`: modificado.
- `styles.css`: modificado.

### Cambios realizados
Se añadieron al principio de `stations.json` (antes de "Aragón Radio (Zaragoza)", que era la primera hasta ahora) estas tres emisoras, todas comprobadas a mano con `curl` antes de incluirlas:
- **RADIO BOB! Blues** (Alemania, red streamABC) — `https://streams.radiobob.de/blues/mp3-192/streams.radiobob.de/`
- **JZR Blues** (Blues/Jazz, hospedada en Infomaniak, Suiza) — `https://jazzblues.ice.infomaniak.ch/jazzblues-high.mp3`
- **Carbon Radio (Psych Blues)** (Psychedelic Blues / Southern Rock / Blues Rock) — `https://radio.carbonradio.live/listen/carbonradio/radio.mp3`

Se descartó buscar una emisora dedicada en exclusiva a Stevie Ray Vaughan: no existe ninguna 24/7 con stream estable y embebible (Pandora, Spotify, Jango y varios agregadores exigen su propio SDK/cuenta o no exponen un endpoint de audio directo), así que se optó por estas tres generalistas de blues.

Cada entrada usa exactamente los mismos campos que ya tenía el resto (`name`, `freq`, `streamUrl`, `streamType`, `officialUrl`, `notes`), y se les añadió un campo nuevo, `category: "blues-internacional"`, que no existía antes en el proyecto (no había ninguna categorización por género/país/color). Este campo es opcional y solo lo llevan estas tres emisoras.

En `app.js` (función `createCard`), cuando una emisora tiene `category`, la tarjeta recibe una clase CSS adicional (`category-<valor>`) — no se ha tocado nada más de la lógica de reproducción, reintentos, reconexión o estados ("en directo"/"reconectando"/etc.), que ya era común a todas las emisoras y se reutiliza tal cual para las tres nuevas.

En `styles.css` se añadió el estilo `.station-card.category-blues-internacional`: borde y fondo en azul (distinto del magenta/amarillo que ya usaba el resto de estados), y una pequeña etiqueta "🎸 Blues internacional ·" delante del nombre de la emisora, para que se note a simple vista que son un bloque aparte.

El orden de renderizado de las tarjetas es el mismo orden del array de `stations.json` (salvo que el usuario haya reordenado manualmente y quede guardado en su navegador), así que al insertarlas al principio del JSON, aparecen las tres primeras.

### Motivo
- Se reutilizó la misma estructura de datos y el mismo pipeline de tarjeta/reproductor para no duplicar lógica, siguiendo el patrón ya establecido en el proyecto.
- El campo `category` es la forma más simple de distinguir visualmente un bloque sin construir un sistema de pestañas/filtros que el proyecto no tenía y no se pidió.
- Las tres URLs se verificaron con `curl -I` antes de incluirlas, exigiendo lo mismo que ya se exigía al resto: devolver `Content-Type: audio/mpeg` y permitir CORS desde el navegador (`Access-Control-Allow-Origin`).

### Validaciones
- `node -e "JSON.parse(...)"` sobre `stations.json`: JSON válido, 48 emisoras en total, las 3 nuevas son las tres primeras del array.
- `curl -I` a las tres URLs de stream: las tres devuelven `Content-Type: audio/mpeg`; RADIO BOB! y JZR Blues devuelven `Access-Control-Allow-Origin: *`, y Carbon Radio lo devuelve de forma dinámica según la cabecera `Origin` enviada (comprobado enviando `Origin: https://example.com` y recibiendo ese mismo valor de vuelta, lo que confirma que no bloquea por CORS).
- Se sirvió el proyecto con un servidor HTTP local (`python -m http.server`) y se comprobó que `stations.json`, tal como lo serviría la web, mantiene las 3 emisoras nuevas en primera posición y con el campo `category` correcto.
- No se ha podido comprobar en un navegador real que suene el audio ni el aspecto visual final de la tarjeta (color, etiqueta) — no había herramienta de navegador disponible en esta sesión. El proyecto no tiene `package.json` ni lint/type-check configurado, así que no aplica ese paso.

### Riesgos o pendientes
- Pendiente de comprobación visual real en navegador (móvil y escritorio) de las tres tarjetas nuevas y de que el audio suene correctamente al pulsarlas.
- El campo `category` es nuevo en el proyecto; si en el futuro se añaden más bloques por género/país, convendría revisar si conviene generalizar el sistema (filtros, pestañas) en vez de ir añadiendo clases CSS sueltas.
- Los streams de terceros pueden cambiar de URL sin aviso, igual que ya ocurre con el resto de emisoras del proyecto.

### Cómo revertir
En `stations.json`, eliminar las tres entradas cuyo `name` es "RADIO BOB! Blues", "JZR Blues" y "Carbon Radio (Psych Blues)" (las tres primeras del array). En `app.js`, deshacer el cambio en `createCard` que añade la clase `category-` (la línea que concatena `station.category ? ' category-' + station.category : ''`). En `styles.css`, eliminar el bloque de reglas `.station-card.category-blues-internacional` (incluye la variante `.is-playing`).

---

## 2026-09-14 18:40 — Nuevas emisoras y cuadrícula colapsable ("Ver más")

### Objetivo
El usuario pidió (1) revisar el fallo del job automático que comprueba los streams (`.github/workflows/check-streams.yml`) y (2) añadir más emisoras españolas que faltaban en la lista, junto con un botón "ver más" o una cuadrícula más optimizada para que la lista de emisoras no sature la pantalla, tanto en móvil como en escritorio.

### Archivos afectados
- `scripts/check-streams.mjs`: modificado.
- `stations.json`: modificado.
- `index.html`: modificado.
- `styles.css`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado (subida de versión de caché a v6).

### Cambios realizados

**1. Fallo del job de comprobación de streams**
El aviso de fallo (14 de 38 emisoras marcadas como caídas) resultó ser un falso positivo: comprobé una a una las 38 URLs a mano y todas respondían correctamente en ese momento, así que no era que las emisoras estuvieran caídas de verdad, sino un corte de red puntual en el servidor donde corre la comprobación automática (GitHub Actions), no en Vercel como parecía sugerir el aviso. Para que no vuelva a pasar, `scripts/check-streams.mjs` ahora reintenta cada emisora hasta 3 veces (esperando 2 segundos entre intento e intento) antes de darla por caída de verdad, en vez de fallar al primer intento fallido.

**2. Emisoras nuevas**
Se han añadido 7 emisoras españolas que faltaban, todas comprobadas a mano (URL de audio real, no solo la página del reproductor):
- Europa FM
- M80 Radio
- Kiss FM
- Radio Euskadi (EITB, en euskera)
- Radio Galega (CRTVG, en gallego)
- IB3 Ràdio (Baleares, en catalán)
- Ràdio 4 (RTVE, en catalán)

Se buscaron también Máxima FM, Onda Madrid y Canal Extremadura Radio, pero no se han añadido: Máxima FM dejó de emitir con ese nombre en 2019 (la sustituyó Los 40 Dance, que ya estaba en la lista), y para Onda Madrid y Canal Extremadura Radio no se encontró ninguna URL de streaming que funcionara de verdad (dominios de streaming dados de baja).

Nota sobre IB3 Ràdio: su único stream localizado es `http://` (sin cifrar), no `https://`. Como el resto de la web sí se sirve por https, algunos navegadores podrían bloquearlo como "contenido mixto". Queda anotado en `stations.json` (campo `notes`) para quien revise el código; si algún usuario ve que esa emisora concreta no suena, tocaría buscarle una URL https alternativa o quitarla.

**3. Cuadrícula colapsable ("Ver más")**
Con 45 emisoras la cuadrícula podía hacerse muy larga, sobre todo en el móvil (2 columnas). Ahora la cuadrícula se muestra con una altura máxima fija (con un ligero degradado al final indicando que hay más contenido) y, solo si de verdad no caben todas las tarjetas, aparece debajo un botón "Ver más ▾" que la despliega entera; al volver a pulsarlo ("Ver menos ▴") se vuelve a colapsar. El botón se calcula dinámicamente comparando el alto real de la cuadrícula con el hueco visible, así que funciona igual de bien en pantallas pequeñas y grandes sin depender de un número fijo de tarjetas por breakpoint. El podio de favoritos (TOP 3) y el arrastrar-para-reordenar no se han tocado y siguen funcionando igual.

### Motivo
- Los reintentos en `check-streams.mjs` evitan que un corte de red puntual (no una emisora realmente caída) tumbe el aviso automático semanal.
- Las emisoras nuevas se limitaron a las que se pudieron verificar de verdad con una petición HTTP real (código 200/206), siguiendo la misma exigencia de fiabilidad que ya tenía el resto del proyecto.
- La cuadrícula colapsable evita que una lista cada vez más larga de emisoras sature la pantalla de entrada, sin perder ninguna emisora ni obligar a hacer scroll infinito para llegar al pie de página.

### Validaciones
- Se ejecutó `node scripts/check-streams.mjs` tras el cambio de reintentos y tras añadir las emisoras nuevas: las 45 emisoras responden con código 200/206, salida del proceso 0 (sin fallos).
- Se comprobó a mano con `curl` cada una de las 7 URLs nuevas antes de incluirlas en `stations.json` (todas devuelven 200 o 206).
- Se validó que `stations.json` sigue siendo JSON válido tras los cambios (`JSON.parse` sin errores).
- Se comprobó la sintaxis de `app.js` (`node --check`), sin errores.
- No se ha podido probar visualmente el botón "Ver más" en un navegador real dentro de esta sesión (no había herramienta de navegador disponible); la lógica se apoya en comparar `scrollHeight` de la cuadrícula con el alto visible del contenedor, mismo patrón ya usado en el resto del proyecto para otros cálculos de layout.

### Riesgos o pendientes
- Pendiente de comprobación visual real en navegador (móvil y escritorio) del botón "Ver más" — recomendable antes de dar la funcionalidad por definitiva.
- IB3 Ràdio usa una URL de streaming `http://` sin cifrar; podría no sonar en algunos navegadores por bloqueo de contenido mixto (queda anotado en `stations.json`).
- Onda Madrid y Canal Extremadura Radio se quedan fuera por no encontrarse un stream funcional; si en el futuro recuperan un dominio de streaming activo, se podrían añadir.

### Cómo revertir
- Emisoras nuevas: en `stations.json`, eliminar las 7 entradas cuyo `name` es "Europa FM", "M80 Radio", "Kiss FM", "Radio Euskadi", "Radio Galega", "IB3 Ràdio (Baleares)" y "Ràdio 4".
- Reintentos del chequeo de streams: en `scripts/check-streams.mjs`, deshacer los cambios y volver a la función `checkUrl` original de un único intento (sin `checkUrlOnce`/`RETRIES`/`sleep`).
- Cuadrícula colapsable: en `index.html` quitar el `<div id="stations-grid-wrap">`/`stations-grid-fade` y el botón `#toggle-grid-btn` (dejando `#stations-grid` directamente dentro de `<main>`); en `styles.css` quitar las reglas `.stations-grid-wrap`, `.stations-grid-fade` y `.toggle-grid-btn`; en `app.js` quitar las variables `gridWrap`/`toggleGridBtn`/`gridExpanded`, la función `updateGridToggleVisibility`, el listener del botón y sus llamadas dentro de `renderGrid()` y del bloque `fetch('stations.json')`.
- Versión de caché: si se revierte cualquiera de los cambios anteriores, no hace falta tocar `sw.js`; si se revierten todos, se puede volver `CACHE_VERSION` a `'v5'` (opcional, solo afecta a qué versión ven los usuarios con la PWA ya instalada).

---

## 2026-09-08 (sin commitear) — Easter egg: UVB-76 ("la radio del Juicio Final")

### Objetivo
El usuario pidió añadir, a modo de "huevo de pascua" (easter egg) escondido en la web, la posibilidad de escuchar en directo UVB-76, una emisora de onda corta rusa apodada "la radio del Juicio Final" por las teorías sobre su relación con un sistema militar soviético. Tras aclarar el formato, pidió que se mostrara en una ventanita de vídeo lo más pequeña y discreta posible, controlable con los mismos botones de play/pausa y volumen que las demás emisoras.

### Archivos afectados
- `index.html`: modificado.
- `styles.css`: modificado.
- `app.js`: modificado.
- `sw.js`: modificado (subida de versión de caché).

### Cambios realizados
- Se ha añadido un punto diminuto y casi invisible en la esquina superior derecha de la pantalla (aparece un poco más marcado solo al pasar el ratón o el foco por encima). Al tocarlo, aparece una ventanita muy pequeña (96×54 píxeles, más pequeña aún en móvil) con la retransmisión en directo de UVB-76 vía YouTube, encima del mini reproductor.
- El play/pausa y el volumen de ese mini reproductor (los mismos que usan las emisoras normales) pasan a controlar ese vídeo mientras está activo, en vez del audio de una emisora.
- Elegir cualquier emisora normal mientras suena esto la detiene automáticamente (y viceversa: activar este detalle detiene la emisora que estuviera sonando). Volver a tocar el mismo punto discreto lo apaga.
- No hay ninguna emisora de este tipo en `stations.json` ni en la rejilla de tarjetas: no está pensado para descubrirse navegando la lista, sino solo para quien sepa (o encuentre) dónde tocar.
- No se ha encontrado ninguna emisión en directo de UVB-76 con una URL de audio directa y estable que se pudiera usar igual que las demás emisoras (los sitios que la ofrecen o son aplicaciones móviles, o cargan el sonido con JavaScript sin exponer un enlace fijo, o daban error de certificado de seguridad al comprobarlos). Por eso se usa, en su lugar, un canal de YouTube dedicado en exclusiva a retransmitir esta emisora las 24 horas, comprobado en el momento de implementarlo que estaba efectivamente en directo.

### Motivo
Petición directa del usuario, explícitamente como una curiosidad/broma interna ("easter egg"), no como una funcionalidad principal de la web.

### Validaciones
- Se ha comprobado, mediante una consulta pública a YouTube (antes de implementar nada), que el vídeo elegido existe, se puede incrustar y estaba en directo en el momento de la comprobación.
- `node --check app.js`: sin errores de sintaxis.
- Cambios servidos y comprobados en el servidor local de pruebas (código HTTP 200, y el HTML/JS servido contiene ya el nuevo código).
- No se ha podido comprobar de forma visual e interactiva (ver el punto discreto, tocarlo, ver que aparece el vídeo y que efectivamente suena, comprobar que el play/pausa y el volumen lo controlan) porque este entorno no dispone de navegador. Se recomienda encarecidamente probarlo a mano antes de considerarlo terminado.

### Riesgos o pendientes
- **Pendiente de prueba visual real**, sobre todo importante en este caso al depender de la API de YouTube (que solo se puede verificar de verdad ejecutándola en un navegador).
- El canal de YouTube usado es de un tercero, no propio ni controlado por el usuario: si ese canal deja de retransmitir en directo, cierra, o YouTube retira el vídeo, el easter egg dejaría de sonar (mostraría un vídeo no disponible) hasta que se actualice manualmente el identificador del vídeo en `app.js` (constante `BUZZER_VIDEO_ID`).
- Al ser contenido de YouTube incrustado, sigue las normas de uso de YouTube (anuncios ocasionales antes o durante el vídeo pueden estar fuera de nuestro control, según la configuración del canal de origen).

### Cómo revertir
Deshacer los cambios en `index.html`, `styles.css`, `app.js` y `sw.js` con `git checkout -- index.html styles.css app.js sw.js` (si no se ha commiteado todavía) o revirtiendo el commit correspondiente una vez creado.

---

## 2026-09-08 (sin commitear) — Rotar automáticamente al TOP3 si una emisora no logra reconectar

### Objetivo
El usuario pidió que, si una emisora se queda atascada intentando reconectar, se salte automáticamente a otra del podio TOP3 en vez de tener que refrescar la página a mano. Preguntó también si sería mejor que, al refrescar, se reprodujera sola la emisora del puesto 1.

### Archivos afectados
- `app.js`: modificado.
- `sw.js`: modificado (subida de versión de caché).
- `README.md`: modificado.

### Cambios realizados
- Se ha añadido un contador de intentos fallidos de reconexión. Si una emisora falla 5 veces seguidas intentando reconectar (unos 17-18 segundos de intentos), la web prueba automáticamente con la siguiente emisora del podio TOP 3 (por orden de puesto: 1º, 2º, 3º, y vuelve a empezar por el 1º si hace falta), sin recargar la página ni perder el volumen ni nada.
- Si la emisora que falla no está en el TOP 3, o el TOP 3 solo tiene fijada esa misma emisora, se sigue reintentando la emisora original como hasta ahora (no hay otra opción a la que saltar).
- Se ha explicado al usuario por qué la otra alternativa que planteó (recargar la página sola y que empezara a sonar el TOP1 automáticamente) no es una solución fiable: quitando el aviso "TOCA PARA REANUDAR" ya implementado, ningún navegador permite que una página, tras recargarse, empiece a reproducir sonido sin que la persona toque algo — es una restricción de seguridad del propio navegador, no algo que se pueda evitar con más código. Por eso no se ha implementado esa vía.

### Motivo
Rotar entre las emisoras favoritas dentro de la misma página funciona porque el reproductor de audio ya quedó "autorizado" a sonar por el primer toque de la persona al empezar a escuchar; cambiar de emisora dentro de esa misma sesión no vuelve a pedir permiso al navegador. Recargar la página, en cambio, empieza una sesión nueva desde cero, y ahí sí hace falta un toque real sí o sí.

### Validaciones
- `node --check app.js`: sin errores de sintaxis.
- Cambios servidos en el servidor local de pruebas (`http://localhost:5174`).
- No se ha podido probar de verdad el escenario completo (una emisora real caída varios reintentos seguidos, viendo el salto automático a la siguiente del podio) porque requeriría provocar una caída real de un servidor de streaming, algo que no se puede forzar desde este entorno. Se recomienda comprobarlo la próxima vez que una emisora del TOP3 falle de verdad, o simulándolo manualmente si se desea (por ejemplo, apagando el wifi/datos brevemente con una emisora del TOP3 sonando).

### Riesgos o pendientes
- Pendiente de verificación real del salto automático entre emisoras del TOP3 con un fallo de streaming genuino.
- Si en el podio TOP3 solo hay una emisora fiable (o ninguna), no hay a dónde saltar y la web sigue reintentando la misma como hasta ahora; esto es un límite conocido, no un fallo.

### Cómo revertir
Deshacer los cambios en `app.js`, `sw.js` y `README.md` con `git checkout -- app.js sw.js README.md` (si no se ha commiteado todavía) o revirtiendo el commit correspondiente una vez creado.

---

## 2026-09-08 (sin commitear) — Detectar cuando el navegador bloquea la reconexión automática

### Objetivo
El usuario avisó de que, en algún momento, la radio dejó de reconectar sola tras un corte y tuvo que refrescar la página varias veces para que volviera a sonar. Preguntó si existía un límite de reintentos.

### Archivos afectados
- `app.js`: modificado.
- `styles.css`: modificado.
- `sw.js`: modificado (subida de versión de caché).

### Cambios realizados
Revisando el código se ha confirmado que no existe ningún límite de número de reintentos: la web reintenta cada 3,5 segundos de forma indefinida. Sin embargo, hay dos motivos, propios del funcionamiento de los navegadores, que pueden hacer que ese reintento automático deje de notarse:

1. **Bloqueo silencioso de reproducción automática:** tras varios intentos fallidos sin que la persona haya tocado nada recientemente, el navegador puede empezar a rechazar en silencio los intentos automáticos de reproducción (por su política "antipublicidad sonora"/autoplay). Antes, ese rechazo se ignoraba sin más, así que el reintento seguía "disparándose" cada 3,5 s pero nunca llegaba a sonar, sin ningún aviso visible — parecía colgado. Ahora, cuando esto ocurre, la tarjeta y el mini reproductor muestran un aviso claro ("👆 TOCA PARA REANUDAR") y basta un solo toque para reanudar, sin necesidad de refrescar la página.
2. **Temporizador parado en segundo plano:** si el móvil bloquea la pantalla o el navegador manda la pestaña a segundo plano un buen rato, el navegador puede ralentizar o congelar el reintento automático. Ahora, en cuanto se vuelve a la pestaña o se desbloquea la pantalla, se fuerza un intento de reconexión inmediato en vez de esperar al siguiente disparo del temporizador (que podría tardar o haberse perdido).

### Motivo
Ninguno de los dos comportamientos es un fallo del código de la web en sí, sino restricciones que imponen los propios navegadores para evitar que las páginas reproduzcan sonido sin permiso. El problema real era que, cuando ocurrían, la web no lo comunicaba ni ofrecía una salida sencilla (aparte de refrescar). Ahora se detectan y se resuelven con un solo toque.

### Validaciones
- `node --check app.js`: sin errores de sintaxis.
- Cambios servidos en el servidor local de pruebas (`http://localhost:5174`).
- No se ha podido reproducir de verdad el escenario exacto que describió el usuario (requiere un navegador real, dejar la radio sonando un buen rato y provocar varios cortes de red seguidos) porque este entorno no dispone de navegador ni conexión a auriculares/altavoz. Queda pendiente que el usuario confirme si, la próxima vez que ocurra un corte largo, ve el aviso "TOCA PARA REANUDAR" en vez de quedarse colgado sin explicación.

### Riesgos o pendientes
- Pendiente de confirmación real por parte del usuario la próxima vez que se produzca una desconexión prolongada.
- Sigue siendo posible, en teoría, que algún otro comportamiento distinto del navegador (no cubierto por estos dos casos) deje la reconexión colgada; si vuelve a pasar, sería útil que el usuario anote en qué móvil/navegador ocurrió y cuánto tiempo llevaba la pantalla bloqueada o la pestaña en segundo plano.

### Cómo revertir
Deshacer los cambios en `app.js`, `styles.css` y `sw.js` con `git checkout -- app.js styles.css sw.js` (si no se ha commiteado todavía) o revirtiendo el commit correspondiente una vez creado.

---

## 2026-09-08 (sin commitear) — Efecto de "respiración" en el sol de fondo

### Objetivo
El usuario pidió que el sol animado del fondo se atenuara de forma progresiva, como si respirara.

### Archivos afectados
- `styles.css`: modificado.

### Cambios realizados
El sol de fondo ya tenía una animación de brillo (subía y bajaba de opacidad), pero era bastante sutil y rápida (6 segundos, poca diferencia entre el punto más apagado y el más brillante). Se ha hecho el ciclo más lento (9 segundos) y con más diferencia entre el punto más tenue y el más brillante, y ahora también el resplandor de alrededor del sol crece y encoge a la vez que la opacidad, para que se note como una respiración real y no solo un parpadeo. Se ha añadido además que, si la persona tiene activada en su dispositivo la opción de "reducir el movimiento" (una preferencia de accesibilidad), el sol se queda fijo sin animar, por si el movimiento constante le resulta molesto.

### Motivo
Petición directa del usuario para dar más presencia visual al efecto ya existente.

### Validaciones
- Cambio servido en el servidor local de pruebas (`http://localhost:5174`) para que el usuario lo revise visualmente.
- No se ha podido comprobar el resultado visual (una animación) desde este entorno, al no disponer de navegador; pendiente de confirmación visual del usuario.

### Riesgos o pendientes
- Pendiente de que el usuario confirme si la velocidad e intensidad del "respirar" es la que buscaba, o si prefiere un ciclo más lento/rápido o más o menos marcado.

### Cómo revertir
Deshacer los cambios en `styles.css` con `git checkout -- styles.css` (si no se ha commiteado todavía) o revirtiendo el commit correspondiente una vez creado.

---

## 2026-09-08 (sin commitear) — Mejorar la legibilidad del texto de la cabecera

### Objetivo
El usuario avisó de que el texto "Elige tu emisora y suena, aunque falle la conexión", "Arrastra el icono ⠿..." y "Arrastra aquí tus emisoras favoritas..." no se leía bien sobre el fondo.

### Archivos afectados
- `styles.css`: modificado.

### Cambios realizados
Esos tres textos están colocados justo encima del sol animado y las franjas brillantes del fondo, y no tenían ninguna sombra que los separase visualmente de lo que hay detrás (a diferencia del título grande, que sí lleva un halo de color). Se les ha añadido una sombra oscura sutil detrás de las letras, igual que un contorno suave, para que se lean bien independientemente de si detrás hay una zona clara u oscura del fondo. También se ha quitado la transparencia extra que tenían dos de ellos, que reducía aún más el contraste.

### Motivo
El color claro y apagado de ese texto, sin ningún tipo de sombra ni contorno, se mezclaba visualmente con las zonas más brillantes del sol de fondo y perdía legibilidad.

### Validaciones
- Cambio aplicado y servido en el servidor local de pruebas (`http://localhost:5174`) para que el usuario lo revise visualmente.
- No se ha podido comprobar el resultado visual desde este entorno (sin navegador disponible); pendiente de confirmación visual por parte del usuario.

### Riesgos o pendientes
- Pendiente de que el usuario confirme si la legibilidad ahora es suficiente o si prefiere un ajuste adicional (por ejemplo, oscurecer algo más el fondo detrás de la cabecera).

### Cómo revertir
Deshacer los cambios en `styles.css` con `git checkout -- styles.css` (si no se ha commiteado todavía) o revirtiendo el commit correspondiente una vez creado.

---

## 2026-09-08 (sin commitear) — Mini reproductor con volumen, idioma en emisoras catalanas, comprobación automática de streams y limpieza interna del guardado

### Objetivo
El usuario pidió implementar, todas juntas, varias mejoras sugeridas previamente: un control explícito de play/pausa y volumen (en vez de depender solo de tocar la tarjeta), una barra de reproducción fija ("mini player") visible al hacer scroll, marcar el idioma correcto en los nombres de emisoras que no están en español, un sistema para detectar automáticamente streams caídos, y unificar en el código el guardado del orden de tarjetas y del podio TOP 3 en un único dato guardado (sin cambio visible para el usuario).

### Archivos afectados
- `index.html`: modificado.
- `app.js`: modificado.
- `styles.css`: modificado.
- `stations.json`: modificado.
- `sw.js`: modificado.
- `README.md`: modificado.

### Archivos creados
- `scripts/check-streams.mjs`: script que comprueba una a una todas las URLs de streaming de `stations.json` y avisa de cuáles han dejado de responder.
- `.github/workflows/check-streams.yml`: automatización en GitHub que ejecuta ese script todos los lunes (y también se puede lanzar a mano desde GitHub) y avisa por email si alguna emisora fiable ha caído.

### Cambios realizados
- **Mini reproductor fijo:** se ha añadido una barra en la parte inferior de la pantalla que aparece en cuanto se elige una emisora y se queda siempre visible (incluso al hacer scroll hacia abajo para ver más emisoras). Muestra el nombre de la emisora actual, su estado (sintonizando/en directo/reconectando/en pausa), un botón grande de play/pausa fácil de tocar con el dedo, y un control deslizante de volumen. El volumen elegido se recuerda para la próxima vez que se abra la web.
- **Idioma correcto en emisoras catalanas:** los nombres de "Catalunya Informació", "Catalunya Radio (Barcelona)", "Flaix FM", "Radio Flaixbac (Barcelona)", "RAC 1" y "RAC 105" ahora llevan marcado que están en catalán, para que un lector de pantalla (usado por personas con discapacidad visual) los lea con la pronunciación correcta en vez de intentar leerlos como si fueran español.
- **Comprobación automática de emisoras caídas:** se ha creado un script que visita cada URL de streaming y comprueba si responde. Se ejecuta solo cada lunes mediante GitHub Actions; si alguna emisora (de las que no están ya marcadas como "no fiable") deja de responder, GitHub avisa por email a quien tenga acceso al repositorio, sin tener que estar comprobándolo a mano. También se puede ejecutar en cualquier momento a mano con `node scripts/check-streams.mjs`.
- **Guardado interno unificado:** por dentro, el orden de las tarjetas y las emisoras fijadas en el podio TOP 3 ahora se guardan juntos en un único dato en el navegador, en vez de en dos independientes como antes. Se ha añadido una migración automática: a quien ya tuviera guardado un orden o un podio con el sistema antiguo, se le seguirá respetando la primera vez que abra la web con este cambio. No cambia nada visible para quien usa la web.
- Se ha subido el número de versión de caché del service worker (`sw.js`) de `v1` a `v2`, para que quien ya tenga la web instalada como app reciba estos cambios en vez de seguir viendo la versión anterior guardada.
- Se ha documentado todo lo anterior en `README.md` (nuevo campo opcional `lang` en `stations.json`, cómo ejecutar la comprobación de streams a mano, y qué hace la automatización semanal).

### Motivo
Estas eran mejoras que se habían sugerido previamente al usuario como ideas de accesibilidad, comodidad en móvil y mantenimiento del proyecto, y el usuario pidió implementarlas todas juntas.

### Validaciones
- `node --check app.js` y `node --check sw.js`: sin errores de sintaxis.
- `stations.json` comprobado como JSON válido tras los cambios.
- El script `scripts/check-streams.mjs` se ha ejecutado de verdad contra las 38 emisoras con stream de `stations.json`: las 38 han respondido correctamente.
- Se ha servido la web con un servidor local de pruebas y se ha comprobado que `index.html`, `manifest.json`, `sw.js` y los iconos se sirven sin errores (código 200), y que el HTML del mini reproductor está presente en la página.
- No se ha podido probar de forma interactiva en un navegador real (pulsar el botón de play/pausa, mover el control de volumen, comprobar visualmente la barra fija al hacer scroll, ni un lector de pantalla real leyendo los nombres en catalán) porque este entorno no dispone de un navegador con el que interactuar. Se recomienda probarlo a mano, sobre todo en un móvil, antes de darlo por cerrado del todo.

### Riesgos o pendientes
- Pendiente de prueba manual real en navegador/móvil de: el botón de play/pausa del mini reproductor, el control de volumen, y que la barra no tape contenido del pie de página.
- El workflow de GitHub Actions (`check-streams.yml`) no se ha podido probar de verdad ejecutándose en GitHub (requeriría subir los cambios al repositorio remoto); el script en sí sí se ha probado localmente con éxito.
- Si una persona ya tenía guardado un orden de emisoras o un podio con el sistema antiguo, la migración a la clave nueva ocurre la primera vez que carga la web tras este cambio; no debería perder su configuración, pero conviene confirmarlo probando con datos guardados previamente si se quiere estar totalmente seguro.

### Cómo revertir
Deshacer los cambios en `index.html`, `app.js`, `styles.css`, `stations.json`, `sw.js` y `README.md` con `git checkout -- <archivo>` (si no se ha commiteado todavía), y borrar `scripts/check-streams.mjs` y `.github/workflows/check-streams.yml`. Si ya se hubiera commiteado, revertir el commit correspondiente.

---

## 2026-09-08 (sin commitear) — Convertir la web en PWA instalable

### Objetivo
El usuario pidió convertir la web en una PWA (aplicación web progresiva) para poder instalarla en el móvil.

### Archivos afectados
- `index.html`: modificado.
- `README.md`: modificado.

### Archivos creados
- `manifest.json`: ficha de la app (nombre, iconos, colores) que usa el navegador para poder "instalarla".
- `sw.js`: service worker (script en segundo plano) que guarda una copia de la web (HTML, CSS, JS e iconos) para que cargue al instante y funcione algo sin conexión.
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`, `icons/apple-touch-icon.png`: iconos de la app generados con el mismo estilo visual synthwave de la web (sol con franjas + ecualizador), en los tamaños que exigen Android e iOS.

### Cambios realizados
- Se ha enlazado `manifest.json` y los iconos nuevos desde `index.html`, y se ha añadido el color de tema para la barra del navegador/estado en móvil.
- Se ha añadido un pequeño script en `index.html` que registra `sw.js` al cargar la página (si el navegador no soporta service workers, la web sigue funcionando exactamente igual, simplemente no se puede instalar).
- El service worker guarda en caché el HTML, el CSS, el JS, el `manifest.json` y los iconos para que la web cargue al instante en visitas siguientes e incluso sin conexión. La lista de emisoras (`stations.json`) se pide siempre primero a internet para tenerla actualizada, y solo se usa la copia guardada si no hay conexión. Los streams de audio en directo y la librería `hls.js` del CDN **nunca** se guardan en caché, se piden siempre directos a internet, para no interferir con la reconexión automática ante microcortes.
- Se ha documentado en `README.md` qué es cada archivo nuevo y, sobre todo, que hay que subir el número `CACHE_VERSION` en `sw.js` cada vez que se modifique `index.html`, `styles.css`, `app.js`, `manifest.json` o los iconos, para que a quien ya tenga la app instalada no le siga apareciendo la versión antigua guardada.

### Motivo
El usuario preguntó qué implicaba convertir la web en PWA y, tras confirmar que no afecta a quien la visita como página web normal (sigue funcionando igual), pidió implementarlo para poder "instalarla" en el móvil y que abra como una app.

### Validaciones
- `manifest.json` comprobado como JSON válido (`JSON.parse` sin errores).
- Iconos generados y comprobados visualmente (tamaños correctos, buen aspecto con el estilo de la web).
- No se ha podido probar la instalación real de la PWA en un móvil ni comprobar el funcionamiento sin conexión en esta sesión (entorno sin navegador ni dispositivo disponible). Se recomienda comprobar en Chrome de Android (aviso de "instalar app") y en Safari de iOS ("Compartir → Añadir a pantalla de inicio") antes de darlo por cerrado, además de revisar en las herramientas de desarrollador (pestaña "Application/Aplicación") que el service worker se registra sin errores.

### Riesgos o pendientes
- Pendiente de prueba real en dispositivo móvil (instalación y modo sin conexión).
- Recordar subir `CACHE_VERSION` en `sw.js` en cada cambio futuro de los archivos cacheados, o los usuarios con la app instalada verán versiones antiguas.
- En local, sin servir la web por HTTPS (o `localhost`), el navegador puede negarse a registrar el service worker; esto es una limitación normal de los navegadores, no un fallo del código.

### Cómo revertir
Quitar el `<link rel="manifest">`, las etiquetas `<meta>` de PWA y el script de registro del service worker en `index.html`; borrar `manifest.json`, `sw.js` y la carpeta `icons/`; deshacer el añadido correspondiente en `README.md`. Si ya hay usuarios con la app instalada, además conviene subir `CACHE_VERSION` una última vez con un `sw.js` vacío que borre la caché, para limpiar lo ya guardado en sus navegadores.

---

## 2026-09-08 (sin commitear) — Adaptación a dispositivos móviles

### Objetivo
El usuario pidió adaptar la web de la radio para que funcione bien en móviles.

### Archivos afectados
- `styles.css`: modificado.

### Cambios realizados
- El icono de arrastrar (⠿) para reordenar las emisoras era demasiado pequeño para tocarlo con el dedo. Ahora, en pantallas táctiles, tiene una zona de toque mucho más grande (about 44x44 píxeles, el mínimo recomendado) aunque el icono se vea igual de pequeño visualmente.
- Se ha quitado el recuadro azul que aparece al tocar botones y tarjetas en móviles (Android/iOS), que quedaba feo con el estilo de la web.
- Se ha añadido un nuevo ajuste para tablets y móviles grandes (pantallas de hasta 768 píxeles de ancho): menos espacio en blanco arriba y a los lados, y tarjetas de emisora más estrechas para aprovechar mejor la pantalla.
- Se ha afinado el ajuste ya existente para móviles pequeños (hasta 480 píxeles): menos espacio entre los tres primeros puestos del podio.
- Se ha añadido un ajuste nuevo para móviles muy estrechos (hasta 360 píxeles, los más pequeños del mercado): la lista de emisoras pasa a mostrarse en una sola columna en vez de dos, para que no queden apretados los nombres.

### Motivo
La web ya tenía el arrastrar-y-soltar preparado técnicamente para funcionar con el dedo (usaba "Pointer Events", compatibles con táctil), pero le faltaba que los elementos fueran cómodos de tocar y que el diseño se ajustara bien a los distintos tamaños de pantalla de un móvil.

### Validaciones
- Revisión visual del código y de las reglas CSS añadidas.
- No se ha podido probar en un navegador real ni en un móvil físico dentro de esta sesión (entorno sin navegador disponible). Se recomienda comprobarlo en un móvil o con las herramientas de desarrollador de Chrome/Firefox en modo "responsive" antes de darlo por cerrado.

### Riesgos o pendientes
- Pendiente de verificación visual real en dispositivo móvil.
- Ninguna otra funcionalidad (reproducción, reconexión, guardado del orden) se ha tocado en este cambio.

### Cómo revertir
Deshacer los cambios en `styles.css` con `git checkout -- styles.css` (si no se ha commiteado todavía) o revirtiendo el commit correspondiente una vez creado.

---

## Historial previo (resumen reconstruido a partir de los commits de git ya existentes)

Estas entradas resumen el trabajo ya realizado antes de que existiera este registro. Se reconstruyen a partir de los mensajes y diferencias de git para dejar constancia completa desde el origen del proyecto.

### 2026-09-08 10:45 — Commit `652f802`: "reorganizar pastillas"
- **Archivos afectados:** `app.js`, `stations.json`, `styles.css` (modificados).
- **Cambios:** Se ha definido un orden inicial por defecto para dos emisoras destacadas (Los 40 Classic y Cadena 100), que se aplica antes del orden personalizado guardado por el usuario. Se han eliminado del listado varias emisoras (Chanquete FM, Europa FM, Hit FM, Kiss FM, Loca FM) por no tener un stream de audio fiable o accesible. Se ha dado un fondo semitransparente a las casillas del podio de favoritas para que se vean mejor.
- **Motivo:** Limpieza de emisoras no funcionales y mejora visual del podio.

### 2026-09-08 10:18 — Commit `313067b`: "añadir top3"
- **Archivos afectados:** `app.js`, `index.html`, `styles.css` (modificados).
- **Cambios:** Se ha añadido la sección "TOP 3", un podio donde el usuario puede arrastrar sus tres emisoras favoritas para fijarlas en un lugar destacado. La posición se guarda en el propio navegador (localStorage) para que se recuerde en visitas futuras.
- **Motivo:** Permitir al usuario destacar sus emisoras preferidas sin tener que buscarlas cada vez entre todas las demás.

### 2026-09-08 10:03 — Commit `2fea672`: "arreglos"
- **Archivos afectados:** `app.js`, `index.html`, `styles.css` (modificados).
- **Cambios:** Se ha añadido la posibilidad de arrastrar las tarjetas de las emisoras para reordenarlas a gusto del usuario (compatible con ratón y con el dedo en pantallas táctiles), mediante un pequeño icono de agarre (⠿) en cada tarjeta. El orden elegido se guarda en el navegador para que se mantenga en futuras visitas.
- **Motivo:** Dar al usuario control sobre el orden en que ve sus emisoras habituales.

### 2026-09-08 09:55 — Commit `8226644`: "Initial commit: Radios de España Sin Microcortes"
- **Archivos creados:** `.gitignore`, `README.md`, `app.js`, `index.html`, `stations.json`, `styles.css`.
- **Cambios:** Primera versión de la web. Página de una sola pantalla, de uso personal, para escuchar emisoras de radio españolas en directo, con estilo visual "synthwave/vaporwave". Incluye un reproductor de audio que se reconecta solo cuando la conexión sufre un microcorte (en vez de quedarse parado), usando audio HTML5 nativo, reintentos periódicos, un "vigilante" que detecta cuando el sonido se queda congelado sin dar error, y soporte para streams en formato HLS cargando la librería correspondiente solo cuando hace falta.
- **Motivo:** Creación inicial del proyecto, a petición del usuario, para tener una forma sencilla y personal de escuchar radio sin cortes molestos por fallos de red.

---

## Reglas de este registro

Ver el archivo `CLAUDE.md` de este proyecto para las instrucciones permanentes sobre cómo y cuándo debe actualizarse este documento.
