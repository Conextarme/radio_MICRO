# Registro de cambios del proyecto (IA)

Este archivo recoge, en orden cronológico inverso (lo más reciente arriba), todos los cambios realizados en este proyecto con ayuda de IA desde su creación.

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
