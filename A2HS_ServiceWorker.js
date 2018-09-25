var cacheName = 'v:static';

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll([
                'index.html',
                'Help.html',
                'images/Buerkert_Logo.png',
                'StyleSheet.css',
                'Page1Logic.js',
                'Bluetooth_Transfer_Protobuf.js',
                'protobuf/protobuf.js',
                'QR-Scanner/instascan.min.js',
                'QR-Scanner/QR-Scanner.js'
            ]).then(function (cache) {
                self.skipWaiting();
            });
        })
    );
});

self.addEventListener('fetch', function (e) {
    console.log(e.request.url);
    e.respondWith(
        caches.match(e.request).then(function (response) {      // Versucht Antwort vom cache zu erhalten
            if (response) {
                return response;                                // Gibt Antwort zurück
            }
            return fetch(e.request);                            // Gibt die Anfrage zurück
        })
    );
});