const CACHE_NAME = 'hidroscanner-v4.1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usar a estrutura de pastas correta do frontend
      return cache.addAll([
        './index.html',
        '../css/style.css',
        '../js/mapa.js',
        '../js/agrageo.js',
        '../js/empresarial.js',
        '../js/diario.js',
        '../js/cnpj.js',
        '../js/pipeline.js',
        '../js/alertas.js',
        '../assets/logo-agrageo.png'
      ]).catch(err => console.warn('[PWA] Fallback de offline falhou parcialmente:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
});

self.addEventListener('fetch', e => {
  // Ignora requisições de API (Receita, GeoServers) no cache
  if (e.request.url.includes('api') || e.request.url.includes('geoserver') || e.request.url.includes('nominatim')) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
