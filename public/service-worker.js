// Service Worker for Showroom Manager PWA
const CACHE_NAME = 'showroom-manager-v2'; // Increment version number when making significant changes
const STATIC_CACHE_NAME = 'showroom-static-v2';
const DYNAMIC_CACHE_NAME = 'showroom-dynamic-v2';

// Static assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Limit cache size for dynamic content
const CACHE_SIZE_LIMIT = 50;

// Install event - cache core assets for offline use
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  // Cache static assets
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Service Worker: Install failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('Service Worker: Now ready to handle fetches');
      return self.clients.claim();
    })
  );
});

// Helper: Trim the cache to avoid filling device storage
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest items (first in, first out)
    await cache.delete(keys[0]);
    // Call recursively until we're under the limit
    await trimCache(cacheName, maxItems);
  }
};

// Network first strategy for API calls
const networkFirstStrategy = async (request) => {
  try {
    // Try from network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network request failed, falling back to cache', request.url);
    
    // If network fails, try from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If both network and cache fail, return a basic offline response
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    // For other resources, return an empty response
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Cache first strategy for static assets
const cacheFirstStrategy = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, get from network
    const networkResponse = await fetch(request);
    
    // Cache a copy for future use
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch', request.url);
    
    // Return fallback for navigation
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Stale while revalidate strategy for dynamic content
const staleWhileRevalidateStrategy = async (request) => {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  
  // Fetch from network to update cache (don't await, do this in background)
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      
      // Trim cache to avoid filling storage
      trimCache(DYNAMIC_CACHE_NAME, CACHE_SIZE_LIMIT);
    }
    return networkResponse;
  }).catch(() => {
    console.log('Service Worker: Background fetch failed', request.url);
  });
  
  // Return the cached response immediately if we have it
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If nothing in cache, wait for the network response
  return fetchPromise;
};

// Fetch event - respond with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle API calls with network-first approach
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For static assets use cache-first
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // For everything else use stale-while-revalidate
  event.respondWith(staleWhileRevalidateStrategy(event.request));
});