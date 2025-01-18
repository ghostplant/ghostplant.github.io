const filesToCache = [
	"Pool.htm",
	"Pool.json",
	"Pool.png",
	"PoolFavIcon_16x16.png",
	"PoolFavIcon_192x192.png",
	"PoolFavIcon_512x512.png",
	"PoolGame.htm",
	"PoolGame.js",
	"PoolShare.png"
];

const staticCacheName = "pool-v1";

self.addEventListener("install", event => {
	event.waitUntil(
		caches.open(staticCacheName)
		.then(cache => {
			return cache.addAll(filesToCache);
		})
	);
});

self.addEventListener("fetch", event => {
	event.respondWith(
		caches.match(event.request)
		.then(response => {
			if (response) {
				return response;
			}
			return fetch(event.request)
		}).catch(error => {
		})
	);
});