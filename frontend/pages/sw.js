// Agrageo Suite — service worker desativado (v5.0)
// Remove qualquer cache antigo instalado por versões anteriores e deixa o
// navegador sempre buscar os arquivos atualizados do Netlify.
const CACHE_PREFIXES = ['hidroscanner', 'agrageo'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => CACHE_PREFIXES.some(p => k.startsWith(p))).map(k => caches.delete(k))
      ))
      .then(() => self.registration.scope)
      .then(scope => fetch(scope + 'pages/index.html', { cache: 'no-store' }).catch(() => null))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Nunca serve cache: delega direto para a rede.
  event.respondWith(fetch(event.request));
});
