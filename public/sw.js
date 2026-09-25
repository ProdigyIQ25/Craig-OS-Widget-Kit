/* Craig OS PWA service worker — static shell only.
 * NEVER cache /api/*, auth cookies payloads, tokens, or Notion responses.
 */
const SHELL_CACHE = "craig-os-shell-v1";
const SHELL_URLS = ["/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept or cache API / authenticated data paths.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network first; offline → intentional degraded page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((cached) => cached || Response.error())),
    );
    return;
  }

  // Shell assets only — cache-first for allowlisted static URLs.
  if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })),
    );
  }
});
