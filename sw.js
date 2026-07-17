/* Service Worker — Aplicación de Gestión Henko */
const CACHE = 'henko-v2';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // La API (Apps Script) y todo lo que no sea GET va siempre a la red
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // index/navegación: red primero (para recibir versiones nuevas), cache si no hay internet
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })
        .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // Íconos y demás estáticos: cache primero
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res;
    }))
  );
});
