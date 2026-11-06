# Radios de España Sin Microcortes

Web de una sola página, de uso personal, para escuchar emisoras de radio españolas en directo con un reproductor que se reconecta solo cuando la conexión sufre microcortes, en vez de quedarse colgado en pausa.

Sin registro, sin cuentas, sin analítica, sin cookies.

## Cómo desplegar en Vercel

1. Sube esta carpeta (`radio_MICRO`) a un repositorio de GitHub.
2. Entra en [vercel.com](https://vercel.com), pulsa "Add New Project" e importa ese repositorio.
3. Vercel detecta automáticamente `index.html` en la raíz: no hace falta configurar build command, output directory ni variables de entorno. Pulsa "Deploy".
4. Cada `git push` a la rama principal vuelve a desplegar la web automáticamente.

## Cómo añadir o editar una emisora

Todas las emisoras están en [`stations.json`](stations.json). Cada entrada admite estos campos:

```json
{
  "name": "Nombre de la emisora",
  "freq": "99.9 FM",
  "streamUrl": "https://.../stream.mp3",
  "streamType": "mp3",
  "officialUrl": "https://web-oficial-de-la-emisora.com/",
  "reliable": true,
  "lang": "ca",
  "notes": "Comentario opcional"
}
```

- `streamType` puede ser `"mp3"`, `"aac"` o `"hls"`. Las emisoras `"hls"` cargan `hls.js` automáticamente solo cuando se seleccionan.
- Si no existe un stream de audio directo, pon `"streamUrl": null` y `"streamType": null`; la tarjeta mostrará el aviso "NO DISPONIBLE AQUÍ" con un enlace a `officialUrl`.
- Si el stream es HTTP (no HTTPS) o poco fiable, añade `"reliable": false`; se tratará igual que si no tuviera stream, para evitar el bloqueo por contenido mixto en una web servida por HTTPS.
- `geoRestricted` es opcional y solo lo usa la revisión semanal: con `true`, un 403 no cuenta como caída (la emisora bloquea a los servidores de GitHub, pero funciona desde España). No afecta a la web.
- `lang` es opcional: indica el idioma del nombre de la emisora (p. ej. `"ca"` para catalán) para que los lectores de pantalla lo pronuncien correctamente. Si no se indica, se usa el idioma general de la web (español).
- `notes` es solo informativo, no se muestra en la web.

No hace falta tocar `index.html`, `styles.css` ni `app.js` para añadir o quitar emisoras.

### Modos Big Calm, Music Time y Buggy Time

Sus emisoras están en [`emisoras-modos.json`](emisoras-modos.json), en `modos.calm.emisoras`, `modos.music.emisoras` y `modos.buggy.emisoras`. Usan los mismos campos que `emisoras-relax.json` (`nombre`, `codec`, `bitrate`, `stream`, `web`, `descripcion`).

- `categoria`: en Music Time y Buggy Time decide en qué filtro aparece la emisora. Tiene que ser uno de los definidos en `MUSIC_CATEGORY_META` o `BUGGY_CATEGORY_META` de `app.js` (Buggy Time: `scifi`, `oldies`, `fallout`, `gta`, `games` y `buggy`); si no, la emisora no se ve en ningún filtro.
- `afinacion` (opcional) muestra una etiqueta en la tarjeta y en el reproductor, por ejemplo `"432 Hz"`. En Big Calm solo debe ponerse si la afinación se ha medido: un nombre con "432" no garantiza que suene así.
- `afinacionNota` (opcional) es el texto que aparece al pasar el ratón por la etiqueta.
- `categoria` (obligatoria en Music Time, porque no hay filtro "Todas" y sin ella la emisora no se vería) coloca la emisora en una temática: `blues`, `crooners`, `rock70`, `rocknroll`, `ochentas`, `rockespanol`, `soundtracks`, `fantasia`, `metal`, `melodico`, `folkmetal`, `newage`, `indie`, `cielos` o `clasica`. Las temáticas se definen en `MUSIC_CATEGORY_ORDER` y `MUSIC_CATEGORY_META`, en `app.js`.
- Si un modo no tiene emisoras, muestra un aviso y oculta el podio.

## Notas técnicas

- HTML + CSS + JavaScript vanilla, sin build step.
- `hls.js` se carga de forma perezosa vía CDN (cdnjs) solo si el usuario elige una emisora con `streamType: "hls"`.
- Lógica de resiliencia ante microcortes en `app.js`: reintento indefinido cada ~3,5 s, reasignación de `src` + `load()` en cada reconexión, escucha de `online`/`offline`, y un watchdog cada 5 s que detecta streams "congelados" (sin errores mas `currentTime` parado).
- Si el navegador bloquea la reproducción automática (política de autoplay tras varios fallos sin interacción), se muestra el aviso "TOCA PARA REANUDAR" en vez de seguir reintentando en silencio.
- Si una emisora falla 5 veces seguidas al reconectar, se prueba automáticamente con la siguiente emisora del podio TOP 3 (en orden de puesto), sin necesidad de recargar la página. Esto no aplica al caso de bloqueo por autoplay: ahí hace falta un toque real igualmente, cambiar de emisora por script tampoco lo evitaría.

## Canción que suena, anteriores y próximas

El reproductor de abajo muestra la canción en curso y, con el botón de lista, abre una ventana con las anteriores y (si la emisora las anuncia) las próximas.

- Los datos los da la función de Vercel [`api/now-playing.js`](api/now-playing.js) (`/api/now-playing?url=<stream>`). Usa la API del proveedor cuando existe (Triton/StreamTheWorld, SomaFM, laut.fm, Radio.co, RadioKing, Rainwave, Zeno) y, si no, los metadatos ICY del propio stream o el `status-json.xsl` de Icecast.
- Solo acepta streams que estén en `stations.json`, `emisoras-relax.json` o `emisoras-modos.json`, así que no sirve como proxy abierto. La CDN de Vercel guarda cada respuesta 15 s.
- "Próximas" solo existe en RadioKing y Rainwave. Si la emisora no da historial, el navegador guarda en `localStorage` las que han sonado mientras escuchabas.
- Cadenas habladas (SER, RNE, COPE, Onda Cero), streams HLS y algunas otras no publican nada: el botón no aparece.
- En local, con un servidor estático, `/api/` no existe y la función simplemente no se ve. Hace falta `vercel dev` o el despliegue.

## Carátulas (logos) de las emisoras

Cada tarjeta y el reproductor de abajo muestran el logo de la emisora. En escritorio va a la izquierda del nombre; en el móvil, arriba. Si una emisora no tiene logo, se muestran sus iniciales.

- Los logos están en `logos/<slug>.webp` (128×128) y `logos/index.json` lista los que existen. El slug es el nombre en minúsculas, sin tildes y con guiones (`Cadena SER (Sevilla)` → `cadena-ser-sevilla`).
- Para conseguir los de emisoras nuevas: `python scripts/fetch-logos.py` (requiere Python y Pillow). Solo busca los que faltan; `--all` los vuelve a descargar todos. Los saca de radio-browser.info o de la web oficial de la emisora.
- Después, revisa `logos/hoja-de-contacto.png` (no se sube al repositorio). Si un logo no corresponde a su emisora, añade su slug a `logos/excluidos.json` y vuelve a ejecutar el script.

## Controles del móvil y temporizador

- En todos los modos, la pantalla de bloqueo, los auriculares y el coche muestran la emisora (o la canción), con el icono de la web como imagen, o la carátula del disco si la emisora la da. Play/pausa funciona desde ahí, y "siguiente / anterior" recorre el TOP 3. Si no hay favoritas en el podio, recorre todas las emisoras del modo en el orden de la pantalla.
- El temporizador de apagado (botón del reloj en el reproductor de abajo) está en todos los modos y baja el volumen poco a poco antes de pausar. Al cambiar de modo se cancela, salvo el del modo dormir, que se conserva para cuando se vuelva a él.

## Comprobación automática de emisoras caídas

Con el tiempo, algunas emisoras cambian de servidor o dejan de funcionar. Hay un script que comprueba todas las URLs de `stations.json`:

```
node scripts/check-streams.mjs
```

Requiere Node 18 o superior (usa el `fetch` incluido en Node, sin instalar nada). Muestra qué emisoras responden y cuáles no, y termina con error si alguna emisora marcada como fiable ha dejado de funcionar.

También se ejecuta solo, automáticamente, cada lunes mediante GitHub Actions (`.github/workflows/check-streams.yml`). Si detecta alguna caída, la ejecución en GitHub queda marcada en rojo y GitHub avisa por email a quien tenga acceso de escritura al repositorio — así no hace falta comprobarlo a mano. También se puede lanzar manualmente desde la pestaña "Actions" del repositorio en GitHub ("Run workflow").

Cada ejecución guarda el historial de fallos en `stream-health.json`. La app lo lee al cargar y oculta las emisoras que llevan 3 o más comprobaciones seguidas fallando; reaparecen solas en cuanto un lunes vuelven a responder. Las marcadas con `"geoRestricted": true` no se ocultan nunca, porque fallan desde los servidores de GitHub pero funcionan en España. Si el historial no se puede leer, se muestran todas.

## PWA (instalable en el móvil)

La web es una PWA: se puede "Añadir a pantalla de inicio" desde el navegador del móvil y se abre como una app, sin barra de direcciones.

- `manifest.json`: nombre, icono y colores de la app instalada.
- `sw.js`: service worker que guarda una copia del "app shell" (HTML/CSS/JS/iconos) y de las listas de emisoras para uso básico sin conexión. Siempre pide primero a la red y solo usa la copia si no hay conexión, para que tras publicar no se mezcle un `app.js` viejo con una lista de emisoras nueva. Los streams de audio y `hls.js` **nunca** se cachean, se piden siempre directos a la red.
- `icons/`: iconos generados para la app (192px, 512px, versión "maskable" para Android y `apple-touch-icon` para iOS).

**Importante al modificar `index.html`, `styles.css`, `app.js`, `manifest.json` o los iconos:** sube el número de `CACHE_VERSION` al principio de `sw.js`. Si no lo haces, los usuarios que ya tengan la PWA instalada seguirán viendo la versión antigua cacheada hasta que limpien datos del sitio.

En Android/Chrome la instalación se ofrece automáticamente. En iOS/Safari el usuario debe hacer "Compartir → Añadir a pantalla de inicio" manualmente (Apple no ofrece el aviso automático ni soporta notificaciones push en PWA).
