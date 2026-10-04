// Makes repeat visits fast and the site usable offline. Hashed build assets never change, so
// they are served cache-first. Pages are network-first (a deploy shows up on the next load),
// falling back to the cached page when offline or when the network is slow. Everything else
// of ours (backgrounds, icons) is served from cache and refreshed in the background. API requests go to another
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

  if (url.pathname.includes('/assets/')) event.respondWith(cacheFirst(request));
  else if (request.mode === 'navigate') event.respondWith(networkFirstPage(event));
  else event.respondWith(staleWhileRevalidate(event));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

// How long a page load waits for the network before showing the cached page instead.
const PAGE_NETWORK_TIMEOUT_MS = 2500;

async function networkFirstPage(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      await pruneScripts(cache, await response.clone().text());
    }
    return response;
  });
  event.waitUntil(network.catch(() => {}));

  const timeout = new Promise((resolve) => setTimeout(resolve, PAGE_NETWORK_TIMEOUT_MS, null));
  const fast = await Promise.race([network.catch(() => null), timeout]);
  if (fast) return fast;
  const cached = await cache.match(request, { ignoreSearch: true });
  return cached ?? network;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone());
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
