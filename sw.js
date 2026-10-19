const CACHE = "qb-compromiso-v12";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./css/fonts.css",
  "./css/compromiso.css",
  "./js/app.js",
  "./js/imagenes.js",
  "./js/jsQR.js",
  "./assets/Supervisor.png",
  "./assets/icon-192.png",
  "./assets/instalar-android.png",
  "./instalar.html",
  "./version.json",
  "./icons/aprobacion.png",
  "./icons/mark.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./fonts/plus-jakarta-sans-500.woff2",
  "./fonts/plus-jakarta-sans-600.woff2",
  "./fonts/plus-jakarta-sans-700.woff2",
  "./fonts/plus-jakarta-sans-800.woff2",
  "./data/trabajadores.json",
  "./data/evaluadores.json",
  "./data/lotes-licapa.json",
  "./data/supervisores-cosecha.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (url) => {
      try { await cache.add(url); } catch (error) { /* un archivo faltante no deja la app sin copia */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function esEstatico(request) {
  const dest = request.destination;
  if (dest === "image" || dest === "font" || dest === "style" || dest === "script" || dest === "manifest") return true;
  return /\.(png|jpe?g|svg|webp|gif|woff2?|css|js|json|html|webmanifest)$/i.test(new URL(request.url).pathname);
}

async function desdeCache(cache, request) {
  const directo = await cache.match(request, { ignoreSearch: true });
  if (directo) return directo;
  const path = new URL(request.url).pathname;
  const keys = await cache.keys();
  for (const key of keys) {
    if (new URL(key.url).pathname === path) return cache.match(key);
  }
  return null;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await desdeCache(cache, request) || await cache.match("./index.html");
      try {
        const fresh = await fetch(request);
        if (fresh.ok) cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (error) {
        return cached || new Response("", { status: 504, statusText: "offline" });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await desdeCache(cache, request);
    if (esEstatico(request) && cached) return cached;
    try {
      const fresh = await fetch(request);
      if (fresh.ok && new URL(request.url).origin === self.location.origin) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (error) {
      return cached || new Response("", { status: 504, statusText: "offline" });
    }
  })());
});
