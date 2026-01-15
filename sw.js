
const VERSION = 'v6';
const CACHE_NAME = `money-manager-${VERSION}`;
const RUNTIME_CACHE = 'money-manager-runtime';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  // Cache các thư viện quan trọng nhất
  'https://esm.sh/lucide-react@^0.561.0',
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Không cache API AI
  if (event.request.url.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Trả về cache ngay lập tức nhưng vẫn fetch bản mới trong background (Stale-While-Revalidate)
        fetch(event.request).then((response) => {
            if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response));
            }
        });
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic' && !event.request.url.includes('esm.sh')) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
          // Fallback cho điều hướng nếu offline hoàn toàn
          if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
          }
      });
    })
  );
});
