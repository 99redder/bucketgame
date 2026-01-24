// Service Worker for Animal Bucket Game PWA
const CACHE_VERSION = 'v1';
const CACHE_NAME = `bucket-game-${CACHE_VERSION}`;

// Assets to cache for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/game.js',
    '/js/animations.js',
    '/js/audio.js',
    '/js/touch.js',
    // Animal images
    '/images/animals/cat.svg',
    '/images/animals/dog.svg',
    '/images/animals/elephant.svg',
    '/images/animals/lion.svg',
    '/images/animals/monkey.svg',
    '/images/animals/pig.svg',
    '/images/animals/cow.svg',
    '/images/animals/duck.svg',
    '/images/animals/frog.svg',
    '/images/animals/horse.svg',
    '/images/animals/orca.svg',
    '/images/animals/chicken.svg',
    // Icons
    '/images/icons/icon.svg'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => {
                console.log('[Service Worker] Cache failed:', err);
            })
    );
});

// Activate event - clean up old caches
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
            .then(() => self.clients.claim())
    );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses or non-GET requests
                        if (!response || response.status !== 200 || event.request.method !== 'GET') {
                            return response;
                        }
                        // Clone the response and cache it
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
            .catch(() => {
                // Return offline fallback if available
                return caches.match('/index.html');
            })
    );
});
