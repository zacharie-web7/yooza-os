/*
 * Yooza Avis — Service worker PWA
 * Cache les ressources locales nécessaires à l’utilisation hors connexion.
 */
const CACHE_NAME = 'yooza-avis-v2.1.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './js/parcours.js',
  './js/avis-qr.js',
  './js/vendor/qrcode.js',
  './css/parcours.css',
  './js/dashboard.js',
  './js/clients.js',
  './js/client-detail.js',
  './js/settings.js',
  './assets/yooza-logo-sidebar.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-16.png',
  './assets/icons/favicon-32.png'
];

const APP_BASE_URL = new URL('./', self.location.href);
const PUBLIC_ASSET_URLS = new Set(APP_SHELL.map(function(resource) {
  return normalizePublicUrl(resource);
}));

function normalizePublicUrl(value) {
  const url = new URL(value, APP_BASE_URL);
  url.search = '';
  url.hash = '';
  return url.href;
}

function shouldHandleRequest(request) {
  if (!request || request.method !== 'GET') return false;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return false;

  // Liste blanche stricte : une future route /api, /auth ou un callback OAuth
  // n'est pas un asset public et ne pourra donc jamais entrer dans ce cache.
  return PUBLIC_ASSET_URLS.has(normalizePublicUrl(requestUrl.href));
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(APP_SHELL); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return cacheName.startsWith('yooza-avis-') && cacheName !== CACHE_NAME;
          })
          .map(function(cacheName) { return caches.delete(cacheName); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (!shouldHandleRequest(event.request)) return;

  const cacheKey = normalizePublicUrl(event.request.url);

  // Réseau d’abord : les techniciens reçoivent les améliorations dès qu’ils sont connectés.
  // Cache de repli : l’application reste exploitable lorsqu’il n’y a plus de réseau.
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(cacheKey, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        return caches.match(cacheKey).then(function(cachedResponse) {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'Ressource indisponible hors connexion' });
        });
      })
  );
});
