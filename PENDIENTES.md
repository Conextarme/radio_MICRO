# Pendientes y mejoras para más adelante

Ideas comentadas con la IA que se dejaron para otro momento. Al hacer una, se borra de aquí y se apunta en `CAMBIOS_IA.md`.

---

## Partir `app.js` en módulos (aplazado el 2026-11-06)

### Por qué
`app.js` tiene unas 2.300 líneas en un solo bloque (una función que se ejecuta al cargar). El reproductor, los modos, el podio, el temporizador, la ventana de canciones y los logos comparten variables. Por eso cada cambio puede romper otra parte sin que se note a primera vista.

La idea es separarlo en archivos (`player.js`, `modes.js`, `podium.js`, `timer.js`, `now-playing.js`, `logos.js`…) cargados con `import` nativo del navegador, sin build.

### ¿Es peligroso?
Arriesgado sí, pero se puede controlar. El código no cambia lo que hace, solo de sitio. El riesgo está en el estado compartido: hay que decidir qué módulo es dueño de cada variable (`currentIndex`, `currentStatus`, `userPaused`, `stations`, `cards`, `appMode`…) y cómo se avisan unos a otros. Los errores no saltan al cargar la página, sino en casos concretos; por ejemplo, cambiar de modo con el temporizador activo, o pulsar "siguiente" en la pantalla de bloqueo con el podio vacío.

### Cómo hacerlo con seguridad
1. **Primero, pruebas automáticas** (ver "Pruebas automáticas y CI" más abajo). Sin ellas no hay forma de saber que todo sigue igual. Ya existen scripts de prueba improvisados con Chrome sin interfaz que cubren:
   - elegir emisora, pausar y reanudar;
   - siguiente/anterior de la pantalla de bloqueo;
   - temporizador y cambio de modo;
   - ventana de canciones;
   - logos e iniciales;
   - modo dormir sin votos.

   Se pueden convertir en pruebas de Playwright.
2. **Por pasos pequeños**, un módulo cada vez, probando después de cada paso. Empezar por lo más aislado y dejar el corazón para el final:
   1. Logos/carátulas.
   2. Temporizador de apagado.
   3. Canción en curso y ventana de canciones.
   4. Pantalla de bloqueo (Media Session).
   5. Podio y orden de tarjetas (arrastrar).
   6. Modos (normal, dormir, Big Calm, Music Time, Buggy Time).
   7. Reproductor y reconexión, lo último.
3. **Service worker:** cada archivo nuevo tiene que añadirse a `APP_SHELL` en `sw.js` y hay que subir `CACHE_VERSION`. Si no, la app instalada en el móvil deja de funcionar sin conexión.
4. Un commit por módulo, para poder deshacer cada paso por separado.

---

## Otras sugerencias pendientes

### Del primer bloque de usabilidad
- **Retomar la última emisora al abrir**, en todos los modos. Ahora solo existe en el modo dormir ("▶ Continuar: …").
- **Buscador de emisoras** que busque en todos los modos (hay 262).
- **Tocar una canción de la ventana de canciones** para buscarla en YouTube o Spotify, o copiar el título.
- **Volumen en iPhone:** iOS no deja cambiar el volumen de una web, así que la barra no hace nada. Ocultarla ahí o cambiarla por un botón de silencio.
- **Icono ♪ en las tarjetas** de las emisoras que publican la canción.
- **Atajos de teclado** en el ordenador: espacio para pausar, flechas para el volumen y N/P para cambiar de emisora.

### Para un nivel profesional
1. **Pruebas automáticas y CI:** Playwright de extremo a extremo y pruebas unitarias de `api/now-playing.js`, ejecutadas en GitHub Actions en cada push.
2. **Partir `app.js`:** ver la sección de arriba.
3. **Un solo formato de datos** para las tres listas de emisoras (hoy `name`/`streamUrl` frente a `nombre`/`stream`), validado con JSON Schema en la CI.
4. **Streams de respaldo por emisora** (`streamUrls: [...]`): probar otro servidor de la misma emisora antes de saltar a otra del TOP 3.
5. **Revisión de emisoras diaria y desde Europa** (no semanal desde EE. UU.), comprobando que el audio avanza de verdad.
6. **Registro anónimo de fallos reales** (emisora, tipo de error, reconexiones). Choca con el "sin analítica" del README: habría que reformularlo o hacerlo opcional.
7. **Enviar a altavoces:** Chromecast y AirPlay (Remote Playback API).
8. **Exportar/importar favoritas y orden** con un enlace o un QR, sin cuentas.
9. **App en Play Store** con TWA. En iPhone, Capacitor (además permitiría alarma para despertar con la radio).
10. **Fuentes de Google alojadas en el proyecto** (RGPD: hoy cada visita envía la IP a Google).
11. **Aviso legal, política de privacidad, dominio propio, imagen para compartir en redes y accesos directos de la PWA a cada modo**, si se abre al público.
12. **Accesibilidad:** reordenar con teclado, respetar `prefers-reduced-motion` en las animaciones y una pasada con Lighthouse y axe.

### Detalles sueltos detectados
- En el móvil, modo normal, el reproductor de abajo deja unos 70 px para el nombre (logo + temporizador + canciones + play + volumen). Se lee el nombre, pero la canción queda muy recortada. Si molesta, se puede ocultar el logo del reproductor en el móvil, como ya se hace en el modo dormir.
- 107 emisoras no tienen logo y muestran iniciales (Los 40 Classic, Fallout, SomaFM…). Se podrían añadir a mano en `logos/`.
- Revisar de vez en cuando `logos/hoja-de-contacto.png` (la genera `scripts/fetch-logos.py`).
