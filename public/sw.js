// Priva service worker — intentionally minimal and SAFE.
// It caches ONLY the offline page and serves it when a navigation fails
// offline. Everything else (HTML, JS, API, server functions) goes straight to
// the network with no caching, so a deploy never gets served stale content.
const CACHE = "priva-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only intercept page navigations; let all other requests hit the network.
  if (req.method === "GET" && req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
});
