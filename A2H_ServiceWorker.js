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
                'BluetoothTerminal.js',
                'protobuf/protobuf.js'
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


let deferredPrompt;
//const A2HButton = document.getElementById('Add_to_Homescreen_Button');
self.addEventListener('beforinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    A2HButton.hidden = false;
    console.log(e.request.url);
    e.prompt();
    deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
});