// Service Worker para RM Manutec (PWA & Google Play TWA)
const CACHE_NAME = 'rm-manutec-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Cache initial assets warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First with Cache Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Ignore chrome extensions or external cross-origin analytics
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('/');
          }
          return new Response('Offline - RM Manutec', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// Push notification listener
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'RM Manutec • Atualização';
  const options = {
    body: data.body || 'Seu chamado técnico foi atualizado na RM Manutec.',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
