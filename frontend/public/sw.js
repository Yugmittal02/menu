const CACHE_NAME = 'sewashubham-v2';
const urlsToCache = [
  '/manifest.json'
];

// Install event - cache only static shell assets (NOT index.html)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - cleanup ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache (NEVER cache HTML)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  // Skip development resources
  if (
    event.request.url.includes('/src/') ||
    event.request.url.includes('/node_modules/') ||
    event.request.url.includes('/@') ||
    event.request.url.includes('chrome-extension')
  ) {
    return;
  }

  // Navigation requests (HTML pages) — ALWAYS go to network, never cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/manifest.json').then(() => {
          return new Response(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>You are offline</h2><p>Please check your connection and try again.</p><button onclick="location.reload()">Retry</button></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, images) — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});
