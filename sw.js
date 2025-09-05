// Service Worker for WeerApp PWA - Enhanced Version
const CACHE_NAME = 'weerapp-v2.0.0';
const STATIC_CACHE = 'weerapp-static-v2.0.0';
const DYNAMIC_CACHE = 'weerapp-dynamic-v2.0.0';
const WEATHER_CACHE = 'weerapp-weather-v2.0.0';
const IMAGES_CACHE = 'weerapp-images-v2.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /^https:\/\/wttr\.in/,
    /^https:\/\/api\.openweathermap\.org/,
    /^https:\/\/api\.buienradar\.nl/
];

// Weather data cache duration (30 minutes)
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        // Static files - cache first strategy
        if (STATIC_FILES.some(file => request.url.endsWith(file))) {
            event.respondWith(cacheFirst(request, STATIC_CACHE));
        }
        // Weather API requests - special handling with cache duration
        else if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
            event.respondWith(weatherApiStrategy(request));
        }
        // Images - cache first with long duration
        else if (request.destination === 'image') {
            event.respondWith(cacheFirst(request, IMAGES_CACHE));
        }
        // Other requests - network first
        else {
            event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        }
    }
});

// Cache first strategy - check cache first, then network
async function cacheFirst(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        return new Response('Offline content not available', { status: 503 });
    }
}

// Weather API strategy - cache with duration check
async function weatherApiStrategy(request) {
    try {
        // Check if we have cached weather data that's still fresh
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const cacheTime = cachedResponse.headers.get('sw-cache-time');
            if (cacheTime && (Date.now() - parseInt(cacheTime)) < WEATHER_CACHE_DURATION) {
                console.log('Service Worker: Serving fresh cached weather data');
                return cachedResponse;
            }
        }
        
        // Try to fetch fresh data
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Clone response and add cache timestamp
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            // Cache the response
            const cache = await caches.open(WEATHER_CACHE);
            cache.put(request, cachedResponse);
            
            return networkResponse;
        }
        
        // If network fails, return cached data even if stale
        if (cachedResponse) {
            console.log('Service Worker: Serving stale cached weather data');
            return cachedResponse;
        }
        
        throw new Error('No cached data available');
    } catch (error) {
        console.log('Weather API failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return a fallback response with demo data
        return new Response(JSON.stringify({
            current_condition: [{
                temp_C: "22",
                FeelsLikeC: "24",
                humidity: "65",
                windspeedKmph: "12",
                weatherCode: "113",
                weatherDesc: [{"value": "Zonnig"}]
            }],
            weather: [{
                hourly: Array.from({length: 24}, (_, i) => ({
                    time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
                    tempC: (20 + Math.sin(i * Math.PI / 12) * 5).toString(),
                    weatherCode: i < 6 || i > 20 ? "113" : "113",
                    weatherDesc: [{"value": i < 6 || i > 20 ? "Heldere nacht" : "Zonnig"}]
                }))
            }],
            nearest_area: [{
                timezone: [{"value": "Europe/Amsterdam"}]
            }]
        }), {
            headers: {
                'Content-Type': 'application/json',
                'sw-cache-time': Date.now().toString()
            }
        });
    }
}

// Network first strategy - try network first, fallback to cache
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page or error response
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        return new Response('Offline content not available', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Background sync for weather data
self.addEventListener('sync', (event) => {
    if (event.tag === 'weather-sync') {
        console.log('Service Worker: Background sync for weather data');
        event.waitUntil(syncWeatherData());
    }
});

// Sync weather data in background
async function syncWeatherData() {
    try {
        // This would typically fetch fresh weather data
        // and update the cache
        console.log('Syncing weather data in background');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications (for weather alerts)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            data: data.data,
            actions: [
                {
                    action: 'open',
                    title: 'Open App',
                    icon: '/icons/icon-72x72.png'
                },
                {
                    action: 'close',
                    title: 'Sluiten',
                    icon: '/icons/icon-72x72.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'weather-update') {
        event.waitUntil(syncWeatherData());
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});
