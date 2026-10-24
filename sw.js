// Always the latest game (2026-10-24). GitHub Pages tells browsers to keep every file for 10 minutes, so after an
// update a reload could still run the old code for a while. This worker keeps nothing itself: every request for one
// of the game's own files goes to the server asking "has it changed?" (a tiny 304 when it hasn't), so a reload always
// runs what's live. Anything from elsewhere (fonts, the multiplayer server) is left alone.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => fetch(req)));
});
