// Service worker — HomeRent Finder
// CACHE_NAME must match APP_VERSION in index.html. Bump on every release.
const CACHE_NAME = 'homerent-v1.5.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // Never touch Firebase / Google / font traffic — it breaks live sync.
  if (
    url.includes('firebaseapp.com') ||
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('api.github.com') ||
    // map: library from the CDN, tiles and geocoding are all network-only
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('tile.openstreetmap.org') ||
    url.includes('nominatim.openstreetmap.org')
  ) return;

  // Network-first, cache as fallback (keeps the app fresh, works offline).
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(c => c || caches.match('./index.html')))
  );
});
