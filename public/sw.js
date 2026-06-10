const CACHE = 'expense-tracker-pro-v1';
const APP_SHELL = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/notifications',
  '/reports',
  '/backup',
  '/manifest.js',
  '/icon.svg',
  '/apple-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE ? caches.delete(key) : Promise.resolve())))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fallback = await caches.match('/dashboard');
        return fallback || Response.error();
      })
  );
});
