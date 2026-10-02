const CACHE = 'dom-dela-v1';
const ROOT = '/dom-dela/';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([ROOT, `${ROOT}index.html`, `${ROOT}icon.svg`, `${ROOT}manifest.webmanifest`]))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin || new URL(request.url).pathname.startsWith(`${ROOT}api/`)) return;
  event.respondWith(fetch(request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); } return response; }).catch(() => caches.match(request).then(found => found || caches.match(`${ROOT}index.html`))));
});
