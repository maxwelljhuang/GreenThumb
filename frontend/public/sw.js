/**
 * Service Worker for GreenThumb PWA
 * Handles caching, offline support, and push notifications
 */

const CACHE_NAME = 'greenthumb-v1'
const STATIC_CACHE = 'greenthumb-static-v1'
const DYNAMIC_CACHE = 'greenthumb-dynamic-v1'
const API_CACHE = 'greenthumb-api-v1'

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: {
    cacheName: STATIC_CACHE,
    strategy: 'cache-first',
    maxAge: 86400000, // 24 hours
  },
  // API responses - network first with fallback
  api: {
    cacheName: API_CACHE,
    strategy: 'network-first',
    maxAge: 300000, // 5 minutes
  },
  // Images - cache first with long TTL
  images: {
    cacheName: STATIC_CACHE,
    strategy: 'cache-first',
    maxAge: 604800000, // 7 days
  },
  // HTML pages - network first
  pages: {
    cacheName: DYNAMIC_CACHE,
    strategy: 'network-first',
    maxAge: 3600000, // 1 hour
  },
}

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/feed',
  '/search',
  '/collections',
  '/profile',
  '/onboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/search',
  '/api/v1/recommend',
  '/api/v1/feedback',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request))
  }
})

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2')
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/')
}

// Check if request is for images
function isImageRequest(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
}

// Check if request is for pages
function isPageRequest(request) {
  const url = new URL(request.url)
  return url.pathname === '/' ||
         url.pathname.startsWith('/feed') ||
         url.pathname.startsWith('/search') ||
         url.pathname.startsWith('/collections') ||
         url.pathname.startsWith('/profile') ||
         url.pathname.startsWith('/onboard')
}

// Handle static assets - cache first
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to handle static asset:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Handle API requests - network first with fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache for API request:', request.url)
    
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are offline. Some features may not be available.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle image requests - cache first
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to handle image request:', error)
    return new Response('Image not available offline', { status: 503 })
  }
}

// Handle page requests - network first with fallback
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache for page request:', request.url)
    
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to offline page
    return caches.match('/offline.html') || new Response('Offline', { status: 503 })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sync offline actions when back online
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await syncOfflineAction(action)
        await removeOfflineAction(action.id)
      } catch (error) {
        console.error('Failed to sync offline action:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Get offline actions from IndexedDB
async function getOfflineActions() {
  // This would integrate with IndexedDB to get stored offline actions
  return []
}

// Sync offline action
async function syncOfflineAction(action) {
  // This would send the offline action to the server
  console.log('Syncing offline action:', action)
}

// Remove synced offline action
async function removeOfflineAction(actionId) {
  // This would remove the action from IndexedDB
  console.log('Removing synced action:', actionId)
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-96x96.png'
      }
    ],
    tag: data.tag || 'greenthumb-notification',
    requireInteraction: data.requireInteraction || false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Cache cleanup
setInterval(() => {
  cleanupOldCaches()
}, 60000) // Run every minute

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys()
    const now = Date.now()
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const dateHeader = response.headers.get('date')
          if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime()
            const age = now - responseDate
            
            // Remove cached items older than 7 days
            if (age > 604800000) {
              await cache.delete(request)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error)
  }
}
