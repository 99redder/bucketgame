// Offline files for Animal Bucket. Updates activate after open games close.
const CACHE_NAME = 'bucket-game-v20';
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
    './js/zoom-lock.js',
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

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith('bucket-game-') && key !== CACHE_NAME).map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
        if (cached) return cached;
        try {
            const response = await fetch(request);
            if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
            return response;
        } catch (error) {
            if (request.mode === 'navigate') return new Response('Open Animal Bucket online once to play offline.', { status: 503 });
            throw error;
        }
    })());
});
