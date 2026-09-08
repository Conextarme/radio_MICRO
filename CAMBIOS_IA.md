# Registro de cambios del proyecto (IA)

Este archivo recoge, en orden cronológico inverso (lo más reciente arriba), todos los cambios realizados en este proyecto con ayuda de IA desde su creación.

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
