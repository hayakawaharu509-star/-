const CACHE_NAME = 'leap-vocab-v2';
const APP_URL = new URL('./leap_vocab_flashcards.html', self.location.href).href;
const PRECACHE = [
  './leap_vocab_flashcards.html',
  './leap_vocab_manifest.webmanifest',
  './leap_vocab_icon.svg',
  './leap_vocab_sources.txt'
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

  if (url.pathname === new URL(APP_URL).pathname) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(APP_URL, copy)));
          }
          return response;
        })
        .catch(() => caches.match(APP_URL))
    );
    return;
  }

  if (PRECACHE.slice(1).some(path => new URL(path, APP_URL).pathname === url.pathname)) {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
  }
});
