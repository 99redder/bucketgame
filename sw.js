// Service Worker for Animal Bucket Game PWA
const CACHE_VERSION = 'v8';
const CACHE_NAME = `bucket-game-${CACHE_VERSION}`;

// Assets to cache for offline functionality (relative paths for GitHub Pages compatibility)
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/game.js',
    './js/animations.js',
    './js/audio.js',
    './js/touch.js',
    // Animal images
    './images/animals/cat.svg',
    './images/animals/dog.svg',
    './images/animals/elephant.svg',
    './images/animals/lion.svg',
    './images/animals/monkey.svg',
    './images/animals/pig.svg',
    './images/animals/cow.svg',
    './images/animals/duck.svg',
    './images/animals/frog.svg',
    './images/animals/horse.svg',
    './images/animals/orca.svg',
    './images/animals/chicken.svg',
    './images/animals/crocodile.svg',
    './images/animals/panda.svg',
    './images/animals/shark.svg',
    './images/animals/polarbear.svg',
    './images/animals/giraffe.svg',
    './images/animals/zebra.svg',
    './images/animals/penguin.svg',
    './images/animals/owl.svg',
    './images/animals/rabbit.svg',
    './images/animals/tiger.svg',
    './images/animals/turtle.svg',
    './images/animals/snake.svg',
    './images/animals/dolphin.svg',
    './images/animals/kangaroo.svg',
    // Icons
    './images/icons/icon.svg'
];

// Install event - cache all static assets and take over immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting and activate immediately');
                return self.skipWaiting();
            })
            .catch(err => {
                console.log('[Service Worker] Cache failed:', err);
            })
    );
});

// Activate event - clean up old caches and take control of all pages
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith('bucket-game-') && key !== CACHE_NAME)
                    .map(key => {
                        console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    })
            ))
            .then(() => {
                console.log('[Service Worker] Claiming clients and reloading');
                return self.clients.claim();
            })
            .then(() => {
                // Notify all clients to reload for the update
                return self.clients.matchAll();
            })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED' });
                });
            })
    );
});

// Fetch event - network-first for HTML/JS, cache-first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Network-first for HTML and JS files (to get updates quickly)
    if (event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the fresh response
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fall back to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-first for other assets (images, CSS)
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || event.request.method !== 'GET') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
            .catch(() => {
                return caches.match('./index.html');
            })
    );
});
