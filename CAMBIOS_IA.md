# Registro de cambios del proyecto (IA)

Este archivo recoge, en orden cronológico inverso (lo más reciente arriba), todos los cambios realizados en este proyecto con ayuda de IA desde su creación.

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
