const CACHE_NAME = 'leap-vocab-v1';
const APP_URL = new URL('./leap_vocab_flashcards.html', self.location.href).href;
const PRECACHE = [
  './leap_vocab_flashcards.html',
  './leap_vocab_manifest.webmanifest',
  './leap_vocab_icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('leap-vocab-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.href === APP_URL) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(response => response || caches.match(APP_URL)))
    );
    return;
  }

  if (url.pathname.endsWith('/leap_vocab_manifest.webmanifest') || url.pathname.endsWith('/leap_vocab_icon.svg')) {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
  }
});
