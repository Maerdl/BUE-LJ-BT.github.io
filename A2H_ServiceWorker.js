var cacheName = 'v:static';

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll([
                'index.html',
                'About.html',
                'images/Buerkert_Logo.png',
                'StyleSheet.css',
                'Page1Logic.js',
                'BluetoothTerminal.js'
            ]).then(function (cache) {
                self.skipWaiting();
            });
        })
    );
});

self.addEventListener('fetch', function (e) {
    console.log(e.request.url);
    e.respondWith(
        caches.match(e.request).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(e.request);
        })
    );
});

self.addEventListener('beforinstallprompt', e => {
    console.log(e.request.url);
    console.log('__BEFOREINSTALLPROMPT_TRIGGERT__');
});