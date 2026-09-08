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

var CACHE_VERSION = 'v2';
var CACHE_NAME = 'radio-micro-' + CACHE_VERSION;

var APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './stations.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
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

  // stations.json: red primero (para tener la lista más reciente),
  // con la copia en caché como respaldo si no hay conexión.
  if (url.pathname.endsWith('/stations.json')) {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request);
      })
    );
    return;
  }

  // Resto del app shell: caché primero, red como respaldo y actualización
  // silenciosa de la caché para la próxima vez.
  event.respondWith(
    caches.match(request).then(function (cached) {
      var networkFetch = fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || networkFetch;
    })
  );
});
