/* Agrageo Suite - Service Worker v5.0 (no-cache: sempre rede; purga caches antigos) */
const OLD_CACHES = ['hidroscanner-v1','hidroscanner-v2','hidroscanner-v3','hidroscanner-v4','hidroscanner-v4.1','agrageo-suite-cache'];

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => OLD_CACHES.includes(k) || true).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Nunca interceptar requisições de API/Supabase
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('jsdelivr')) return;
  if (e.request.method !== 'GET') return;
  // Rede primeiro, sem gravar em cache
  e.respondWith(fetch(e.request, { cache: 'no-store' }));
});
