/**
 * Hill-Haat Service Worker
 * Provides offline support, caching strategies, and push notifications
 * for the Northeast India Farm-to-Highway Marketplace
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `hill-haat-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `hill-haat-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `hill-haat-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `hill-haat-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `hill-haat-images-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-96x96.png',
  '/icons/apple-touch-icon.png',
];

// API routes that should be cached
const CACHEABLE_API_ROUTES = [
  '/api/listings',
  '/api/locations',
  '/api/logistics',
  '/api/categories',
];

// Cache duration in milliseconds
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Background sync queue names
const SYNC_QUEUE_ORDERS = 'orders-sync-queue';
const SYNC_QUEUE_LISTINGS = 'listings-sync-queue';
const SYNC_QUEUE_CART = 'cart-sync-queue';

// Offline page HTML
const OFFLINE_PAGE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Hill-Haat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      text-align: center;
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #fef3c7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: #f59e0b;
    }
    h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    button {
      background: #059669;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #047857; }
    .features {
      margin-top: 24px;
      text-align: left;
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #4b5563;
    }
    .feature:last-child { margin-bottom: 0; }
    .check { color: #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-3.536 3.536a4 4 0 010 5.656m-3.536-3.536a4 4 0 010-5.656m-3.536 3.536a4 4 0 010 5.656m-3.536-3.536a4 4 0 010-5.656"/>
      </svg>
    </div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry, your data is safe!</p>
    <button onclick="location.reload()">Try Again</button>
    <div class="features">
      <div class="feature">
        <span class="check">✓</span>
        <span>Browse cached products</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>Orders saved for sync</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>Auto-sync when back online</span>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(CACHE_NAME).then((cache) => {
        // Cache the offline page
        return cache.put(
          '/offline',
          new Response(OFFLINE_PAGE_HTML, {
            headers: { 'Content-Type': 'text/html' },
          })
        );
      }),
    ])
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
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
              // Delete old version caches
              return cacheName.startsWith('hill-haat-') && 
                     !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated and claiming clients');
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
  } else if (isImageRequest(url)) {
    // Cache-first for images with longer duration
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE_NAME, IMAGE_CACHE_DURATION));
  } else if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else {
    // Stale-while-revalidate for other requests (HTML, etc.)
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
 * Check if request is for an image
 */
function isImageRequest(url) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
  return imageExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) || 
         url.pathname === '/';
}

/**
 * Check if request should be queued for background sync
 */
function isSyncableRequest(request) {
  const syncableUrls = ['/api/orders', '/api/listings', '/api/cart'];
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
    console.log('[Service Worker] Cache-first fetch failed:', error.message);
    return getOfflineFallback(request);
  }
}

/**
 * Cache-first with expiry - for images
 */
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedDate = cachedResponse.headers.get('sw-cached-date');
    if (cachedDate) {
      const age = Date.now() - new Date(cachedDate).getTime();
      if (age < maxAge) {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      const responseToCache = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers,
      });
      cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Image fetch failed:', error.message);
    return cachedResponse || getOfflineFallback(request);
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
      // Add timestamp header for cache freshness check
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      const responseToCache = new Response(await networkResponse.clone().arrayBuffer(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers,
      });
      cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network-first fetch failed, trying cache:', error.message);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
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
      console.log('[Service Worker] Background fetch failed:', error.message);
    });

  // Return cached response immediately, or wait for network
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return networkFetch || getOfflineFallback(request);
}

/**
 * Get offline fallback page
 */
async function getOfflineFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Return cached offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlinePage = await cache.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Try to return cached home page
    const cachedHome = await caches.match('/');
    if (cachedHome) {
      return cachedHome;
    }
  }

  // Return a JSON error for API requests
  if (request.url.includes('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. Please check your connection.',
        code: 'OFFLINE',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Return offline page as fallback
  const offlinePage = await cache.match('/offline');
  if (offlinePage) {
    return offlinePage;
  }

  // Final fallback
  return new Response('Offline', { status: 503 });
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
  let queueName = SYNC_QUEUE_ORDERS;
  
  if (request.url.includes('/listings')) {
    queueName = SYNC_QUEUE_LISTINGS;
  } else if (request.url.includes('/cart')) {
    queueName = SYNC_QUEUE_CART;
  }
  
  await db.addToQueue(queueName, requestData);
  
  // Register for background sync
  try {
    await self.registration.sync.register(queueName);
  } catch (error) {
    console.log('[Service Worker] Background sync not available:', error.message);
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      queued: true,
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
      [SYNC_QUEUE_ORDERS, SYNC_QUEUE_LISTINGS, SYNC_QUEUE_CART].forEach(queueName => {
        if (!db.objectStoreNames.contains(queueName)) {
          const store = db.createObjectStore(queueName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      });
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
  } else if (event.tag === SYNC_QUEUE_CART) {
    event.waitUntil(syncCart());
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
        
        // Notify the client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            entityType: 'order',
            success: true,
          });
        });
      }
    } catch (error) {
      console.error('[Service Worker] Failed to sync order:', error.message);
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
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            entityType: 'listing',
            success: true,
          });
        });
      }
    } catch (error) {
      console.error('[Service Worker] Failed to sync listing:', error.message);
    }
  }
}

/**
 * Sync queued cart items
 */
async function syncCart() {
  const db = await openSyncDB();
  const queue = await db.getQueue(SYNC_QUEUE_CART);
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      
      if (response.ok) {
        await db.removeFromQueue(SYNC_QUEUE_CART, item.id);
        console.log('[Service Worker] Cart synced successfully');
      }
    } catch (error) {
      console.error('[Service Worker] Failed to sync cart:', error.message);
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
    body: 'You have a new notification from Hill-Haat',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'hill-haat-notification',
    data: {},
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
      
      // Customize based on notification type
      if (data.type === 'order') {
        notificationData.tag = `order-${data.orderId}`;
        notificationData.actions = [
          { action: 'view', title: 'View Order' },
          { action: 'dismiss', title: 'Dismiss' },
        ];
        if (data.url) {
          notificationData.data.url = data.url;
        }
      } else if (data.type === 'listing') {
        notificationData.tag = `listing-${data.listingId}`;
        notificationData.actions = [
          { action: 'view', title: 'View Listing' },
          { action: 'dismiss', title: 'Dismiss' },
        ];
      } else if (data.type === 'message') {
        notificationData.tag = `message-${data.senderId}`;
        notificationData.actions = [
          { action: 'reply', title: 'Reply' },
          { action: 'dismiss', title: 'Dismiss' },
        ];
      }
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error.message);
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    actions: notificationData.actions,
    requireInteraction: notificationData.requireInteraction || false,
    timestamp: Date.now(),
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
  let urlToOpen = '/';
  
  if (event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  } else if (event.action === 'view' || !event.action) {
    // Default to home or based on notification type
    const notificationType = event.notification.data?.type;
    if (notificationType === 'order') {
      urlToOpen = '/?view=orders';
    } else if (notificationType === 'listing') {
      urlToOpen = '/?view=marketplace';
    }
  }
  
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
  
  // Track notification dismissal for analytics
  event.waitUntil(
    fetch('/api/analytics/notification-dismissed', {
      method: 'POST',
      body: JSON.stringify({
        tag: event.notification.tag,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Ignore errors for analytics
    })
  );
});

/**
 * Periodic background sync (for periodic data refresh)
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync:', event.tag);
  
  if (event.tag === 'refresh-listings') {
    event.waitUntil(refreshListings());
  } else if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

/**
 * Refresh cached listings
 */
async function refreshListings() {
  try {
    const response = await fetch('/api/listings?limit=50');
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put('/api/listings?limit=50', response.clone());
      console.log('[Service Worker] Listings refreshed');
    }
  } catch (error) {
    console.log('[Service Worker] Failed to refresh listings:', error.message);
  }
}

/**
 * Message event - communicate with main app
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      Promise.all([
        caches.open(STATIC_CACHE_NAME).then(c => c.keys()).then(k => k.length),
        caches.open(DYNAMIC_CACHE_NAME).then(c => c.keys()).then(k => k.length),
        caches.open(API_CACHE_NAME).then(c => c.keys()).then(k => k.length),
        caches.open(IMAGE_CACHE_NAME).then(c => c.keys()).then(k => k.length),
      ]).then(([staticCount, dynamicCount, apiCount, imageCount]) => {
        event.ports[0]?.postMessage({
          static: staticCount,
          dynamic: dynamicCount,
          api: apiCount,
          images: imageCount,
          total: staticCount + dynamicCount + apiCount + imageCount,
        });
      })
    );
  }
});

console.log('[Service Worker] Hill-Haat Service Worker loaded - Version:', CACHE_NAME);
