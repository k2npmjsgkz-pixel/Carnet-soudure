/* Carnet Soudeur : mise en cache pour fonctionner sans réseau */
const VERSION = "atelier-v1";
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("atelier-") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Réponse immédiate depuis le cache, puis mise à jour en arrière-plan quand le réseau est là.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !fonts) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = req.mode === "navigate" ? "./index.html" : req;
    const cached = await cache.match(key, { ignoreSearch: req.mode === "navigate" });
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
