// Makes repeat visits load instantly from cache. Hashed build assets never change, so they
// are served cache-first; everything else of ours (the page, backgrounds, icons) is served
// from cache and refreshed in the background for the next visit. API requests go to another
// origin and are left alone (the app keeps its own copy of the schedule).
const CACHE = 'cinema-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(url.pathname.includes('/assets/') ? cacheFirst(request) : staleWhileRevalidate(event));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const isPage = request.mode === 'navigate';
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: isPage });

  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      if (isPage) await pruneScripts(cache, await response.clone().text());
    }
    return response;
  });

  if (!cached) return network;
  event.waitUntil(network.catch(() => {}));
  return cached;
}

/** Drops old JS/CSS bundles the latest page no longer references, so the cache doesn't grow. */
async function pruneScripts(cache, html) {
  for (const request of await cache.keys()) {
    const { pathname } = new URL(request.url);
    if (/\/assets\/.+\.(js|css)$/.test(pathname) && !html.includes(pathname)) {
      await cache.delete(request);
    }
  }
}
