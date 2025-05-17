const CACHE_NAME = 'tracking-calendar-v1.2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/statistics.html',
    '/settings.html',
    '/about.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/calendar.js',
    '/js/data-io.js',
    '/js/statistics.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json',
    'icons/icon1-arrow-down.png',
    'icons/icon2-hot-cup.png',
    'icons/icon3-black-paw.png',
    'icons/icon4-white-paw.png',
    'icons/icon5-flag.png',
    'icons/icon6-kitty.png',
    'icons/icon7-crying.png',
    'icons/icon8-arrow-up.png',
    'icons/icon9-cat-with-sign.png'
];
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
