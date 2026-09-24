# Tarea: añadir "Modo dormir" (modo de relajación para dormir)

Lee primero `CLAUDE.md` (registro obligatorio en `CAMBIOS_IA.md`), `index.html`, `app.js`, `styles.css`, `sw.js` y `stations.json`. Respeta el estilo de código actual: JS en IIFE con `var` y funciones clásicas, sin frameworks ni dependencias nuevas.

## Qué quiero

Un botón en la cabecera superior que active el **modo dormir**. Ojo: NO es un modo oscuro/nocturno de la interfaz. Es un modo para relajarse y dormirse con emisoras de sonidos relajantes. Al pulsarlo, la web cambia de "modo día" (el actual) a "modo dormir"; al volver a pulsarlo, vuelve al modo normal.

### 1. Botón
- Colócalo arriba, en `.site-header`, visible en móvil y en escritorio.
- Etiqueta clara: `🌙 Modo dormir` en modo normal y `☀️ Modo normal` en modo dormir. Es un `<button type="button">` con `aria-pressed` y `aria-label`.
- Estilo acorde a la estética actual (neón retro), sin tapar el título.

### 2. Misma estructura, otras emisoras
- Mantén exactamente la misma estructura: sección **TOP 3** con el podio (2º, 1º, 3º) y debajo la cuadrícula de tarjetas ("pastillas"), con el botón "Ver más" y la misma reproducción, el mismo mini-reproductor y la misma reconexión automática. Reutiliza `createCard`, `renderGrid`, `playStation`, etc., no dupliques la lógica de reproducción.
- En modo dormir, las emisoras salen de `emisoras-relax.json` (ya está en la raíz del repo) en lugar de `stations.json`. Cárgalo con `fetch` igual que `stations.json`. El JSON tiene `categorias[]`, cada una con `id`, `nombre` y `emisoras[]`. Aplánalo y adapta cada emisora al formato que ya usa la app: `nombre`→`name`, `stream`→`streamUrl`, `web`→`officialUrl`, `descripcion`→`notes`, `freq: "Stream"`, `streamType` según `codec` (`mp3` o `aac`), y conserva `votos` y el `id` de su categoría. Todas las URLs ya son HTTPS y están comprobadas (62 emisoras), no hace falta filtrar nada.
- **El podio TOP 3 empieza vacío** en modo dormir: no lo rellenes con nada por defecto. Lo llena el usuario arrastrando sus favoritas, igual que en el modo normal. El orden y el podio del modo dormir se guardan en su **propia** clave de `localStorage` (por ejemplo `radioMicroSleepState`), separada de `radioMicroState`, para no mezclar ni perder el orden del modo normal.
- Orden inicial de la cuadrícula: por temática, en el orden en que vienen en el JSON (lluvia, mar, bosque, naturaleza mixta, ruido, ambient, dormir, meditación, piano, chillout, lo-fi) y, dentro de cada temática, por `votos` de mayor a menor. Las temáticas de naturaleza (lluvia, mar, bosque, naturaleza mixta) son las preferidas del usuario: que queden arriba.
- Cada tarjeta lleva la etiqueta de su temática con el mecanismo `category-<id>` que ya existe en `createCard` (por ejemplo "🌧 Lluvia", "🌊 Mar", "🌲 Bosque"), con un tono sutil por temática. Al arrastrar, el usuario puede reordenar a su gusto como ahora.

### 3. Clasificación en la pastilla
- Cada tarjeta muestra su **posición en el ranking** (`#1`, `#2`, `#3`…) calculada por `votos` entre todas las emisoras del modo dormir (la de más votos es la #1), en una chapa pequeña en una esquina de la tarjeta, con un **color destacado** (por ejemplo dorado o lila brillante, con buen contraste). Las 3 primeras pueden llevar un color especial (oro, plata, bronce, como el podio).
- El número es la clasificación por votos y no cambia cuando el usuario reordena manualmente las tarjetas.
- Muestra también, en pequeño, los votos y el país/bitrate si cabe sin saturar (por ejemplo `47.611 votos · 128 kbps`).

### 4. Fondo: del sol a la luna
- En modo normal hay un sol retro con horizonte (`.sun-horizon`, `.sun`, `.grid-horizon`). En modo dormir, el sol se sustituye por una **luna** (creciente o luna llena, en CSS puro o SVG inline, sin imágenes externas) sobre un cielo nocturno azul marino/violeta muy oscuro con **estrellas** suaves.
- Paleta calmada y de bajo brillo: nada de amarillo/magenta chillón. Cambia las variables CSS (`--bg-deep`, `--bg-mid`, `--neon-*`, etc.) con un selector como `body.sleep-mode`, sin duplicar hojas de estilo. Baja o quita las `.scanlines`.
- Animaciones lentas y sutiles (luna que "respira", estrellas que titilan despacio). Respeta `prefers-reduced-motion`.
- Cambia el título y el tagline en modo dormir (por ejemplo "SONIDOS PARA DORMIR" / "Cierra los ojos y déjate llevar.") y el texto del TOP 3 ("🌙 TOP 3 PARA DORMIR"). Actualiza también `<meta name="theme-color">`.
- Transición suave (fundido de 0,6 s aprox.) al cambiar de modo.

### 5. Comportamiento
- Al cambiar de modo, detén la reproducción actual (`stopPlayback`) y oculta o reinicia el mini-reproductor, para que no siga sonando una emisora que ya no se ve.
- Recuerda el modo elegido en `localStorage` (clave `radioMicroSleepMode`) y restáuralo al abrir la web. Envuelve el acceso en `try/catch` como hace el resto del código.
- No rompas el easter egg ni el arrastrar y soltar del podio.
- Si `emisoras-relax.json` no carga, muestra un mensaje amable y vuelve al modo normal.

### 6. PWA
- Añade `./emisoras-relax.json` a la lista de archivos precacheados de `sw.js` y sube `CACHE_VERSION` (de `v6` a `v7`) para que las instalaciones existentes reciban los cambios.

### 7. Funciones para dormir (solo visibles en modo dormir)
- **Temporizador de apagado.** Botón "⏱" junto al mini-reproductor (o dentro de él) con opciones 15, 30, 45, 60 min, 2 h y "Desactivado". Muestra la cuenta atrás restante. Al terminar, baja el volumen con un **fundido** de unos 30-60 s y pausa la emisora sin dejarla reconectando (usa el mismo camino que la pausa del usuario, para que el watchdog y la reconexión no la reanuden). Guarda la hora de fin como marca de tiempo (`Date.now() + duración`) y no como contador de `setInterval`: los navegadores móviles congelan los temporizadores con la pantalla bloqueada, así que al volver (`visibilitychange`) recalcula, y si ya pasó la hora, pausa. Restaura el volumen del usuario tras el fundido, sin pisar el valor guardado en `radioMicroVolume`.
- **Pantalla encendida y bajo brillo.** Mientras suena una emisora en modo dormir, pide `navigator.wakeLock.request('screen')` (con `try/catch` y comprobando que existe) para que la pantalla no se bloquee, y vuelve a pedirlo al regresar a la pestaña. Tras ~20 s sin tocar la pantalla, muestra una capa oscura casi negra (con `pointer-events` para despertarla al tocar) que atenúa todo y deja solo la luna y el nombre de la emisora. Al tocar, desaparece.
- **Reproducción con la pantalla bloqueada.** Usa la Media Session API (`navigator.mediaSession`): `metadata` con el nombre de la emisora y la temática, y manejadores de `play` y `pause` (y `stop`) enlazados con las funciones existentes. Así se puede pausar desde la pantalla de bloqueo y el sistema no corta el audio.
- **Filtro por temática.** Fila de chips encima de la cuadrícula: "Todas" y una por temática (🌧 Lluvia, 🌊 Mar, 🌲 Bosque, 🌿 Naturaleza, 🔊 Ruido, 🌌 Ambient, 😴 Dormir, 🧘 Meditación, 🎹 Piano, 🍸 Chillout, 🎧 Lo-fi). Con scroll horizontal en móvil. Filtrar oculta las tarjetas de otras temáticas pero no toca el podio ni el orden guardado.
- **Continuar donde lo dejé.** Guarda la última emisora del modo dormir (por nombre) y el temporizador elegido. Al abrir en modo dormir, muestra un botón grande "▶ Continuar: <emisora>" (no reproduzcas solo: el navegador exige un toque del usuario).
- **Fundido de volumen** al empezar una emisora y al cambiar de una a otra (1-2 s), para que no suene de golpe.
- **Botón de play/pausa grande** en el mini-reproductor del modo dormir (mínimo 56 px), fácil de pulsar a oscuras.
- **Salto a una alternativa si una emisora cae.** Si tras los reintentos actuales una emisora del modo dormir falla, pasa a otra de la misma temática con más votos, en vez de a la siguiente del podio, y muéstralo en el estado ("cambiando a …"). Reutiliza `switchToNextFavorite` o la lógica existente si encaja; si no, añade una función pequeña.
- **Estética de descanso.** Nada de parpadeos ni animaciones rápidas. Tono cálido (ámbar tenue) en textos y acentos en lugar de blanco azulado, para no cansar la vista.

### 8. Móvil (obligatorio: tiene que usarse igual de bien en móvil que en navegador de escritorio)
- Diseño **mobile-first**, probado a 360 y 375 px de ancho y en horizontal. Sin scroll horizontal de la página, salvo la fila de chips.
- Áreas táctiles de al menos 44x44 px (botón de modo dormir, chips, temporizador, tarjetas, play/pausa). Sin depender de `hover`.
- Respeta las zonas seguras (`env(safe-area-inset-*)`) en la cabecera y en el mini-reproductor, porque el viewport ya usa `viewport-fit=cover`.
- El arrastrar y soltar del podio debe funcionar con el dedo (revisa que `attachDragHandle` use eventos de puntero o táctiles y que no bloquee el scroll de la página). Mientras no funcione bien en táctil, añade una alternativa: pulsación larga o un botón "⭐ Al podio" en cada tarjeta que la coloque en el primer hueco libre.
- El audio necesita un toque del usuario para empezar (política de autoplay de iOS y Android): nunca arranques el sonido al cambiar de modo ni al cargar.
- Funciona como PWA instalada (modo `standalone`) y en Safari iOS y Chrome Android. Si `wakeLock` o `mediaSession` no existen (Safari antiguo), la web sigue funcionando sin ellos y sin errores en consola.
- Comprueba que el fondo con luna y estrellas no gasta demasiada batería: animaciones solo con `transform` y `opacity`, y desactívalas si `prefers-reduced-motion` o cuando la pestaña está oculta.
- El texto debe ser legible sin zoom (mínimo 14-16 px) y con buen contraste sobre el fondo nocturno.

### 9. Comprobación automática de streams (cron)
El workflow `.github/workflows/check-streams.yml` (cada lunes, 07:00 UTC) ejecuta `scripts/check-streams.mjs`, que hoy solo lee `stations.json`. Amplíalo para que también vigile las emisoras del modo dormir:
- El script debe leer `stations.json` **y** `emisoras-relax.json`. Del segundo, aplana `categorias[].emisoras[]` y usa `stream` como URL y `nombre` como nombre. En la salida por consola, distingue de qué lista viene cada emisora (por ejemplo prefijo `[normal]` / `[dormir]`).
- Reutiliza `checkUrl` tal cual (timeout de 10 s, 3 reintentos, `Range: bytes=0-1024`) y el mismo criterio de fallo: código de salida distinto de 0 si alguna emisora falla.
- En el mensaje final, di en qué archivo revisar cada emisora caída (`stations.json` o `emisoras-relax.json`).
- Son unas 100 emisoras en total: limita la concurrencia (por ejemplo lotes de 10 a la vez) para que GitHub Actions no sature la red y dé falsos positivos, como ya ocurrió una vez (ver `CAMBIOS_IA.md`).
- Node 18+, sin dependencias nuevas. No hace falta tocar el `.yml`, salvo que el script cambie de ruta o de nombre.
- Prueba en local con `node scripts/check-streams.mjs` y anota el resultado real en `CAMBIOS_IA.md`.

## Fuera de alcance
No añadas cuentas, librerías ni un mezclador de varias emisoras a la vez (queda para una fase posterior), ni la activación automática del modo dormir a una hora programada. No cambies `stations.json`. La lógica de reconexión solo se toca lo mínimo necesario para que el temporizador y el salto a una alternativa convivan con ella.

## Al terminar
- Prueba en el navegador: activar y desactivar el modo, reproducir una emisora en cada modo, recargar y comprobar que se recuerda el modo, el temporizador con fundido, el filtro por temática, la capa de atenuación, y que no hay errores en consola.
- Prueba en vista móvil (360 y 375 px, vertical y horizontal) y en escritorio. Indica expresamente qué no has podido probar (por ejemplo bloqueo de pantalla real o Safari iOS) en `CAMBIOS_IA.md`.
- Actualiza `CAMBIOS_IA.md` según `CLAUDE.md`, sin inventar pruebas que no hayas hecho.
