'use strict';

const CACHE_NAME = 'camara-pwa-cache-v1';

const ARCHIVOS_PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(ARCHIVOS_PRECACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (nombres) {
        return Promise.all(nombres.map(function (nombre) {
          if (nombre !== CACHE_NAME) {
            console.log('[SW] Eliminando cache obsoleta:', nombre);
            return caches.delete(nombre);
          }
          return Promise.resolve(false);
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (respuestaCache) {
        if (respuestaCache) {
          return respuestaCache;
        }

        return fetch(event.request)
          .then(function (respuestaRed) {
            if (respuestaRed && respuestaRed.ok) {
              return caches.open(CACHE_NAME)
                .then(function (cache) {
                  cache.put(event.request, respuestaRed.clone());
                  return respuestaRed;
                });
            }
            return respuestaRed;
          });
      })
      .catch(function () {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 503, statusText: 'Sin conexion' });
      })
  );
});
