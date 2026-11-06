'use strict';

/*
 * Service worker de la PWA "Radios de España Sin Microcortes".
 *
 * Solo cachea el "app shell" (HTML/CSS/JS/iconos) para que la web cargue
 * al instante y funcione sin conexión. Los streams de audio y hls.js
 * (CDN externo) se dejan pasar siempre directos a la red: cachearlos no
 * tendría sentido (son flujos en directo) y podría interferir con la
 * lógica de reconexión de app.js.
 *
 * IMPORTANTE: al modificar cualquier archivo del "app shell" hay que subir
 * el número de CACHE_VERSION, si no los usuarios que ya tengan la PWA
 * instalada seguirán viendo la versión antigua cacheada.
 */

var CACHE_VERSION = 'v30';
var CACHE_NAME = 'radio-micro-' + CACHE_VERSION;

var APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './stations.json',
  './emisoras-relax.json',
  './emisoras-modos.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // cache: 'reload' evita que la caché HTTP del navegador cuele una copia vieja.
      return cache.addAll(APP_SHELL.map(function (url) { return new Request(url, { cache: 'reload' }); }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function isAppShellRequest(url) {
  return url.origin === self.location.origin;
}

self.addEventListener('fetch', function (event) {
  var request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  var url = new URL(request.url);

  // Streams de audio, hls.js del CDN y cualquier otro origen externo:
  // siempre a la red, nunca a caché.
  if (!isAppShellRequest(url)) {
    return;
  }

  // La canción que suena (api/now-playing) cambia a cada momento: nunca a caché.
  if (url.pathname.indexOf('/api/') !== -1) {
    return;
  }

  // Todo lo propio (HTML, JS, CSS, listas de emisoras, historial de fallos):
  // red primero y copia en caché como respaldo si no hay conexión.
  // Antes el código (app.js, etc.) iba "caché primero": tras publicar, el móvil
  // juntaba el app.js viejo con la lista de emisoras nueva y las categorías
  // nuevas (p. ej. Fallout y GTA en Buggy Time) no aparecían.
  event.respondWith(
    fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || (request.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
