const CACHE_NAME = 'pwa-cache-v2';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/airlines.json',
  '/icon-192.png',
  '/icon-512.png'
];
const QUEUE_NAME = 'airline-queue';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'invalidate-airlines-cache') {
    caches.open(CACHE_NAME).then(cache => cache.delete('/api/airlines'));
  } else if (event.data?.type === 'queue') {
    storeOperation(event.data.operation);
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-airlines') {
    event.waitUntil(processQueue());
  }
});

function storeOperation(operation) {
  return caches.open(QUEUE_NAME).then(cache => {
    const id = Date.now();
    const request = new Request(`/queue/${id}`, { method: 'POST' });
    const response = new Response(JSON.stringify(operation));
    return cache.put(request, response);
  });
}

function processQueue() {
  return caches
    .open(QUEUE_NAME)
    .then(cache =>
      cache.keys().then(keys =>
        Promise.all(
          keys.map(key =>
            cache.match(key).then(res =>
              res.json().then(op =>
                fetch(op.url, {
                  method: op.method,
                  headers: op.headers,
                  body: op.body ? JSON.stringify(op.body) : undefined
                }).then(() => cache.delete(key))
              )
            )
          )
        )
      )
    )
    .then(() => caches.open(CACHE_NAME).then(cache => cache.delete('/api/airlines')))
    .then(() =>
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'sync-complete' }));
      })
    );
}
