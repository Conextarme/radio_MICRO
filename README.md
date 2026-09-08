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
  "notes": "Comentario opcional"
}
```

- `streamType` puede ser `"mp3"`, `"aac"` o `"hls"`. Las emisoras `"hls"` cargan `hls.js` automáticamente solo cuando se seleccionan.
- Si no existe un stream de audio directo, pon `"streamUrl": null` y `"streamType": null`; la tarjeta mostrará el aviso "NO DISPONIBLE AQUÍ" con un enlace a `officialUrl`.
- Si el stream es HTTP (no HTTPS) o poco fiable, añade `"reliable": false`; se tratará igual que si no tuviera stream, para evitar el bloqueo por contenido mixto en una web servida por HTTPS.
- `notes` es solo informativo, no se muestra en la web.

No hace falta tocar `index.html`, `styles.css` ni `app.js` para añadir o quitar emisoras.

## Notas técnicas

- HTML + CSS + JavaScript vanilla, sin build step.
- `hls.js` se carga de forma perezosa vía CDN (cdnjs) solo si el usuario elige una emisora con `streamType: "hls"`.
- Lógica de resiliencia ante microcortes en `app.js`: reintento indefinido cada ~3,5 s, reasignación de `src` + `load()` en cada reconexión, escucha de `online`/`offline`, y un watchdog cada 5 s que detecta streams "congelados" (sin errores mas `currentTime` parado).
