/**
 * Hill-Haat Service Worker
 * Provides offline support, caching strategies, and push notifications
 */

const CACHE_NAME = 'hill-haat-v1';
const STATIC_CACHE_NAME = 'hill-haat-static-v1';
const DYNAMIC_CACHE_NAME = 'hill-haat-dynamic-v1';
const API_CACHE_NAME = 'hill-haat-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Cache duration in milliseconds
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Background sync queue names
const SYNC_QUEUE_ORDERS = 'orders-sync-queue';
const SYNC_QUEUE_LISTINGS = 'listings-sync-queue';

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME && 
                     cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle different caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (except for background sync)
  if (request.method !== 'GET') {
    // Queue POST/PUT/DELETE requests for background sync when offline
    if (!navigator.onLine && isSyncableRequest(request)) {
      event.respondWith(queueRequestForSync(request));
      return;
    }
    return;
  }

  // Different strategies based on request type
  if (isApiRequest(url)) {
    // Network-first for API requests
    event.respondWith(networkFirst(request, API_CACHE_NAME));
  } else if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else {
    // Stale-while-revalidate for other requests
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  }
});

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) || 
         url.pathname === '/';
}

/**
 * Check if request should be queued for background sync
 */
function isSyncableRequest(request) {
  const syncableUrls = ['/api/orders', '/api/listings'];
  return syncableUrls.some(url => request.url.includes(url));
}

/**
 * Cache-first strategy - best for static assets
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first fetch failed:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Network-first strategy - best for API requests
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network-first fetch failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still fresh
      const cachedDate = cachedResponse.headers.get('sw-cached-date');
      if (cachedDate) {
        const age = Date.now() - new Date(cachedDate).getTime();
        if (age < API_CACHE_DURATION) {
          return cachedResponse;
        }
      }
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

/**
 * Stale-while-revalidate strategy - best for HTML and dynamic content
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network fetch in background
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set('sw-cached-date', new Date().toISOString());
        const responseToCache = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });
        cache.put(request, responseToCache);
      }
      return response;
    })
    .catch((error) => {
      console.log('[Service Worker] Background fetch failed:', error);
    });

  // Return cached response immediately, or wait for network
  return cachedResponse || networkFetch || getOfflineFallback(request);
}

/**
 * Get offline fallback page
 */
async function getOfflineFallback(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try to return cached home page for navigation requests
  if (request.mode === 'navigate') {
    const cachedHome = await cache.match('/');
    if (cachedHome) {
      return cachedHome;
    }
  }

  // Return a basic offline response for API requests
  return new Response(
    JSON.stringify({
      error: 'offline',
      message: 'You are currently offline. Please check your connection.',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Queue request for background sync
 */
async function queueRequestForSync(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  // Store in IndexedDB for later sync
  const db = await openSyncDB();
  const queueName = request.url.includes('/orders') ? SYNC_QUEUE_ORDERS : SYNC_QUEUE_LISTINGS;
  
  await db.addToQueue(queueName, requestData);
  
  // Register for background sync
  await self.registration.sync.register(queueName);
  
  return new Response(
    JSON.stringify({
      success: false,
      message: 'Request queued for sync when online',
    }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Open IndexedDB for sync queue
 */
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hill-haat-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(createSyncDB(request.result));
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_ORDERS)) {
        db.createObjectStore(SYNC_QUEUE_ORDERS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_LISTINGS)) {
        db.createObjectStore(SYNC_QUEUE_LISTINGS, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Create helper methods for sync database
 */
function createSyncDB(db) {
  return {
    addToQueue: (queueName, data) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(queueName, 'readwrite');
        const store = transaction.objectStore(queueName);
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    getQueue: (queueName) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(queueName, 'readonly');
        const store = transaction.objectStore(queueName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    clearQueue: (queueName) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(queueName, 'readwrite');
        const store = transaction.objectStore(queueName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    removeFromQueue: (queueName, id) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(queueName, 'readwrite');
        const store = transaction.objectStore(queueName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
  };
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === SYNC_QUEUE_ORDERS) {
    event.waitUntil(syncOrders());
  } else if (event.tag === SYNC_QUEUE_LISTINGS) {
    event.waitUntil(syncListings());
  }
});

/**
 * Sync queued orders
 */
async function syncOrders() {
  const db = await openSyncDB();
  const queue = await db.getQueue(SYNC_QUEUE_ORDERS);
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      
      if (response.ok) {
        await db.removeFromQueue(SYNC_QUEUE_ORDERS, item.id);
        console.log('[Service Worker] Order synced successfully');
      }
    } catch (error) {
      console.error('[Service Worker] Failed to sync order:', error);
    }
  }
}

/**
 * Sync queued listings
 */
async function syncListings() {
  const db = await openSyncDB();
  const queue = await db.getQueue(SYNC_QUEUE_LISTINGS);
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      
      if (response.ok) {
        await db.removeFromQueue(SYNC_QUEUE_LISTINGS, item.id);
        console.log('[Service Worker] Listing synced successfully');
      }
    } catch (error) {
      console.error('[Service Worker] Failed to sync listing:', error);
    }
  }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'Hill-Haat',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'hill-haat-notification',
    data: {},
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Handle click - open app or focus existing window
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Notification close event
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});

/**
 * Message event - communicate with main app
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('[Service Worker] Service Worker loaded');
