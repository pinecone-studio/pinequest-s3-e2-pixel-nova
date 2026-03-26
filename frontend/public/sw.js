// Placeholder service worker to avoid Next.js routing /sw.js to dynamic routes in dev.
self.addEventListener("install", () => {
  self.skipWaiting?.();
});

self.addEventListener("activate", () => {
  self.clients?.claim?.();
});
