// Service Worker for Rebuilding Iran PWA
const CACHE_NAME = 'rebuilding-iran-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip browser extensions and external requests
  if (!url.origin.includes(self.location.origin)) return;

  // Skip API requests (always go to network)
  if (url.pathname.startsWith('/api/')) return;

  // Skip Supabase requests
  if (url.hostname.includes('supabase')) return;

  event.respondWith(
    (async () => {
      try {
        // Try network first for navigation requests
        if (request.mode === 'navigate') {
          const networkResponse = await fetch(request);
          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }

        // For other requests, try cache first, then network
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          // Return cache and update in background
          event.waitUntil(
            (async () => {
              try {
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                  const cache = await caches.open(CACHE_NAME);
                  cache.put(request, networkResponse);
                }
              } catch (e) {
                // Network failed, that's okay - we served from cache
              }
            })()
          );
          return cachedResponse;
        }

        // No cache, fetch from network
        const networkResponse = await fetch(request);

        // Cache successful responses for static assets
        if (networkResponse.ok && isStaticAsset(url.pathname)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // Network failed and no cache
        console.log('[SW] Fetch failed, returning offline page');

        // For navigation, show offline page
        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) return offlineResponse;
        }

        // Return a basic error response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })()
  );
});

// Helper to determine if URL is a static asset worth caching
function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.startsWith('/_next/static/')
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Get pending progress updates from IndexedDB
  // This would be implemented with IndexedDB storage
  console.log('[SW] Syncing progress...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'Rebuilding Iran', {
      body: data.body || 'New update available',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      data: data.url || '/',
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
