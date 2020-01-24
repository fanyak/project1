/**
 * 
 * @param {*} event: a fetch event
 * // default cache:
 * if there is a match in the cache, and it is fresh, return it.
 * If there is a match in the cache, and it is stale, make provisional request. If the response hasn't changed, return it from the cache, else 
 * get from the server and update the cache.
 * If there is not match, make the request AND update the cache with the response
 * // @NOTE: We don't check in the sw if the cached response is fresh...
 * // @TODO: maybe we could check the 'last updated' header of the response, to see if it is fresh or stale
 * // SINCE WE ARE NOT CHECKING FOR FRESH OR STALE, the default is the same as `no-cache` and `force-cache`
 */
const default_cache = (event) => {
   return caches.match(event.request)
    .then((match) => {
        return match || fetch(event.request).then((response) => {
            if(response.ok) {
                const cloned = response.clone();
                // don't wait for the update, (don't return this promise, return the response immediately)
                caches.open(CACHE_VERSION).then((caches) => {
                    caches.put(event.request, cloned)
                });
            }
            return response;
        });
    });
}

/**
 * Don't store and don't update the cache
 * Also, The cache is never checked
 * @param {*} event is the fetch event
 */

const no_store = (event) => {
    return fetch(event.request)
}
/**
 * Don't check the cache, 
 * BUT update it with the response of the request
 * @param {*} event a fetch evet
 */
const reload_cache = (event) => {
    // console.log('cacheName', CACHE_VERSION)
    return fetch(event.request).then((response) => {
        if(response.ok){
            const cloned = response.clone();
            // don't wait for the update - return the response immediatelly
            caches.open(CACHE_VERSION).then((cache) => {
                cache.put(event.request, cloned);
            });
            return response;
        }
    })
}

/**
 * served the cached response, if it exists,
 * but also fetch an update for the next time
 * @param {*} event the fetch event
 */

const stale_while_revilidate = (event) => {
    
    return caches.open(CACHE_VERSION).then(cache =>
        cache.match(event.request).then(match => {

        // make the request whether a match exists or not;
        // if the cache exists, it will be returned, but the cache will also be updated
        const req = fetch(event.request).then((response) => {
            if(response.ok) {
                const cloned = response.clone();
                cache.put(event.request, cloned);                
            }
            return response;
        });

        return match || req;
    })
    
    );
}
