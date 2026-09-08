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
- `lang` es opcional: indica el idioma del nombre de la emisora (p. ej. `"ca"` para catalán) para que los lectores de pantalla lo pronuncien correctamente. Si no se indica, se usa el idioma general de la web (español).
- `notes` es solo informativo, no se muestra en la web.

No hace falta tocar `index.html`, `styles.css` ni `app.js` para añadir o quitar emisoras.

## Notas técnicas

- HTML + CSS + JavaScript vanilla, sin build step.
- `hls.js` se carga de forma perezosa vía CDN (cdnjs) solo si el usuario elige una emisora con `streamType: "hls"`.
- Lógica de resiliencia ante microcortes en `app.js`: reintento indefinido cada ~3,5 s, reasignación de `src` + `load()` en cada reconexión, escucha de `online`/`offline`, y un watchdog cada 5 s que detecta streams "congelados" (sin errores mas `currentTime` parado).

## Comprobación automática de emisoras caídas

Con el tiempo, algunas emisoras cambian de servidor o dejan de funcionar. Hay un script que comprueba todas las URLs de `stations.json`:

```
node scripts/check-streams.mjs
```

Requiere Node 18 o superior (usa el `fetch` incluido en Node, sin instalar nada). Muestra qué emisoras responden y cuáles no, y termina con error si alguna emisora marcada como fiable ha dejado de funcionar.

También se ejecuta solo, automáticamente, cada lunes mediante GitHub Actions (`.github/workflows/check-streams.yml`). Si detecta alguna caída, la ejecución en GitHub queda marcada en rojo y GitHub avisa por email a quien tenga acceso de escritura al repositorio — así no hace falta comprobarlo a mano. También se puede lanzar manualmente desde la pestaña "Actions" del repositorio en GitHub ("Run workflow").

## PWA (instalable en el móvil)

La web es una PWA: se puede "Añadir a pantalla de inicio" desde el navegador del móvil y se abre como una app, sin barra de direcciones.

- `manifest.json`: nombre, icono y colores de la app instalada.
- `sw.js`: service worker que cachea el "app shell" (HTML/CSS/JS/iconos) para carga instantánea y uso básico sin conexión. Los streams de audio y `hls.js` **nunca** se cachean, se piden siempre directos a la red.
- `icons/`: iconos generados para la app (192px, 512px, versión "maskable" para Android y `apple-touch-icon` para iOS).

**Importante al modificar `index.html`, `styles.css`, `app.js`, `manifest.json` o los iconos:** sube el número de `CACHE_VERSION` al principio de `sw.js`. Si no lo haces, los usuarios que ya tengan la PWA instalada seguirán viendo la versión antigua cacheada hasta que limpien datos del sitio.

En Android/Chrome la instalación se ofrece automáticamente. En iOS/Safari el usuario debe hacer "Compartir → Añadir a pantalla de inicio" manualmente (Apple no ofrece el aviso automático ni soporta notificaciones push en PWA).
