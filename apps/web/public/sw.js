const CACHE_NAME = "tinykite-static-v1";
const HTTP_OK = 200;
// Relative paths resolve against this script's URL, so the worker caches the
// right files under whatever base path the site is mounted at (e.g. /tools/).
const CORE_ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./sitemap.xml"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function cacheResponse(request, response) {
  if (response.status !== HTTP_OK || response.type !== "basic") {
    return;
  }
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  // Network first: a deploy must reach visitors on their next load. The cache
  // answers only when the network cannot, which is all offline support needs.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        cacheResponse(event.request, response);
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? Response.error()))
  );
});
