self.importScripts('./utils/fp.js', './utils/cache-methods.js');

const APP_SHELL = [
    '/',
    'index.html',
    'index.js',
    'carousel.js',    
    'http.js',
    'utils/fp.js',
    'utils/cache-methods.js'
];

const CACHE_NAME = 'photosapp';
const VERSION = 37;
const CACHE_VERSION = `${CACHE_NAME}.v${VERSION}`;

self.addEventListener('install',(e) => {
    console.log('installed');
    
   e.waitUntil(caches.open(CACHE_VERSION)
            .then(cache => {        
            return cache.addAll(APP_SHELL);
        }).catch(console.log)
    );
});


self.addEventListener('fetch', (event) => {
    // console.log(event, event.request)
    event.respondWith(
        stale_while_revilidate(event)
    )
})

self.addEventListener('activate', (e) => {
    console.log('activated', e);

    e.waitUntil(
        caches.keys()
        .then((keys) => {
            const f1 = partial(arrayMethod, 'filter');
            const f2 = partial(arrayMethod, 'map');
            const composed = compose(f2((key) => caches.delete(key)), f1((key) => key !== CACHE_VERSION));
            console.log(composed(keys))
            return Promise.all( composed(keys));
        })
    );
})
