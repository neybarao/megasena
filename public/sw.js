const CACHE = 'megasena-v1'
const ROOT = self.location.pathname.replace(/sw\.js$/, '')
const CORE = [
  ROOT,
  `${ROOT}manifest.webmanifest`,
  `${ROOT}data/results.json`,
  `${ROOT}data/metadata.json`,
  `${ROOT}icons/icon-192-v1.png`,
  `${ROOT}icons/icon-512-v1.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(ROOT))),
  )
})
