/**
 * sw.js — Service Worker (Offline PWA)
 * Estratégia: Cache-First para assets estáticos,
 *             Network-First para API, com fallback.
 */

const CACHE_NAME  = 'gerenciador-os-v1';
const API_PREFIX  = '/api/';

const STATIC_ASSETS = [
  '/',
  '/api/os/lista',
  '/api/os/nova',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/js/lista.js',
  '/static/js/sig.js',
  '/static/js/geo.js',
  '/static/js/db.js',
  '/static/js/sync.js',
  '/static/manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap',
];

// ── Install: pré-cacheia assets estáticos ───────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

// ── Activate: limpa caches antigos ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estratégia por tipo de recurso ───────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora métodos não-GET (POST/PUT/DELETE vão direto)
  if (request.method !== 'GET') return;

  // Rotas de API: Network-First, caching de GETs de leitura
  if (url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets estáticos: Cache-First
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('<h2>Sem conexão</h2>', {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Cacheia apenas respostas bem-sucedidas de GET
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ erro: 'Offline', cache: false }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Background Sync (quando conexão volta) ──────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-os-pendentes') {
    event.waitUntil(syncPendentes());
  }
});

async function syncPendentes() {
  // Notifica as abas abertas para disparar a sync
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_REQUEST' }));
}
