const CACHE_VERSION = "useravaa-career-v1";
const OFFLINE_URL = "/career/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/site.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("useravaa-career-") && key !== CACHE_VERSION)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

async function networkWithOfflineFallback(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    return await fetch(request);
  } catch {
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached || Response.error());
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate" && (url.pathname === "/" || url.pathname.startsWith("/career"))) {
    event.respondWith(networkWithOfflineFallback(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/")
    || url.pathname.startsWith("/career-paths/")
    || url.pathname.startsWith("/brand/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
