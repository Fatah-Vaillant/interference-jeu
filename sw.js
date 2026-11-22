'use strict';
/* Service worker d'Interférence : jeu jouable hors ligne, toujours la dernière version en ligne.
   - Enregistré par js/ui.js avec ?v=<CONFIG.version> : une nouvelle version = un nouveau worker et un nouveau cache.
   - En ligne : réseau d'abord (revalidé, jamais le cache HTTP périmé), copie mise en cache au passage.
   - Hors ligne : réponse du cache. Les anciens caches sont effacés à l'activation.
   Chemins relatifs : fonctionne sous n'importe quel sous-dossier (GitHub Pages /interference-jeu/). */
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'interference-' + VERSION;
const CORE = ['./', './index.html', './css/style.css', './manifest.webmanifest', './confidentialite.html',
  './js/config.js', './js/util.js', './js/lang.js', './js/audio.js', './js/art.js', './js/icons.js', './js/ships.js', './js/worlds.js',
  './js/data.js', './js/game.js', './js/ideas.js', './js/dev.js', './js/ui.js',
  './fonts/ChakraPetch-Regular.ttf', './fonts/ChakraPetch-Medium.ttf', './fonts/ChakraPetch-SemiBold.ttf', './fonts/ChakraPetch-Bold.ttf',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-48.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('interference-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // une requête de navigation ne peut pas être recopiée avec des options : on refait la requête par son adresse
  e.respondWith(fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' }).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
