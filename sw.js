const CACHE_NAME = "abdullah-fahim-v1.0.0"
const OFFLINE_URL = "/offline.html"

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  "/",
  "/manifest.json",
  "/pages/home.html",
  "/pages/gallery.html",
  "/pages/routine.html",
  "/pages/contact.html",
  "/offline.html",
  // External CDN resources
  "https://cdn.tailwindcss.com",
  "https://i.ibb.co.com/4RwDKSd1/A-removebg-preview.png",
  "https://static.dezeen.com/uploads/2025/05/sq-google-g-logo-update_dezeen_2364_col_0.jpg",
  "https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2029&q=80",
]

// Firebase SDK URLs (will be cached dynamically)
const FIREBASE_URLS = [
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
]

// Install event - cache static resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        console.log("Service Worker: Caching static resources")

        // Cache static resources with error handling
        const cachePromises = STATIC_CACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url)
            if (response.ok) {
              await cache.put(url, response)
              console.log(`Cached: ${url}`)
            }
          } catch (error) {
            console.warn(`Failed to cache ${url}:`, error)
          }
        })

        await Promise.allSettled(cachePromises)

        // Force activation of new service worker
        self.skipWaiting()
      } catch (error) {
        console.error("Service Worker: Install failed", error)
      }
    })(),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys()
        const deletePromises = cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log("Service Worker: Deleting old cache", cacheName)
            return caches.delete(cacheName)
          })

        await Promise.all(deletePromises)

        // Take control of all clients
        await self.clients.claim()
        console.log("Service Worker: Activated successfully")
      } catch (error) {
        console.error("Service Worker: Activation failed", error)
      }
    })(),
  )
})

// Fetch event - serve cached content or fetch from network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith("chrome-extension://")) {
    return
  }

  event.respondWith(
    (async () => {
      try {
        const url = new URL(event.request.url)

        // Handle different types of requests
        if (isFirebaseRequest(url)) {
          return handleFirebaseRequest(event.request)
        } else if (isImageRequest(url)) {
          return handleImageRequest(event.request)
        } else if (isPageRequest(url)) {
          return handlePageRequest(event.request)
        } else {
          return handleGeneralRequest(event.request)
        }
      } catch (error) {
        console.error("Service Worker: Fetch error", error)
        return handleOfflineFallback(event.request)
      }
    })(),
  )
})

// Check if request is for Firebase SDK
function isFirebaseRequest(url) {
  return url.hostname === "www.gstatic.com" && url.pathname.includes("firebase")
}

// Check if request is for an image
function isImageRequest(url) {
  return (
    /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname) ||
    url.hostname.includes("images.") ||
    url.hostname.includes("ibb.co") ||
    url.hostname.includes("unsplash.com")
  )
}

// Check if request is for a page
function isPageRequest(url) {
  return url.pathname.endsWith(".html") || url.pathname === "/" || url.pathname.startsWith("/pages/")
}

// Handle Firebase SDK requests with cache-first strategy
async function handleFirebaseRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    console.log("Service Worker: Serving Firebase SDK from cache")
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
      console.log("Service Worker: Cached Firebase SDK")
    }
    return networkResponse
  } catch (error) {
    console.error("Service Worker: Firebase SDK fetch failed", error)
    throw error
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn("Service Worker: Image fetch failed", error)
    // Return a placeholder image or the cached logo
    const fallbackImage = await cache.match("https://i.ibb.co.com/4RwDKSd1/A-removebg-preview.png")
    return fallbackImage || new Response("", { status: 404 })
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.warn("Service Worker: Network failed for page request", error)
  }

  // Fallback to cache
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  // Ultimate fallback to offline page
  return handleOfflineFallback(request)
}

// Handle general requests with cache-first strategy
async function handleGeneralRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn("Service Worker: General request failed", error)
    return handleOfflineFallback(request)
  }
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const cache = await caches.open(CACHE_NAME)

  // For navigation requests, return offline page
  if (request.mode === "navigate") {
    const offlinePage = await cache.match(OFFLINE_URL)
    if (offlinePage) {
      return offlinePage
    }
  }

  // For other requests, return a basic response
  return new Response("Offline - Content not available", {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "Content-Type": "text/plain",
    },
  })
}

// Handle background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle any offline actions that need to be synced
      handleBackgroundSync(),
    )
  }
})

async function handleBackgroundSync() {
  try {
    // Implement background sync logic here
    // For example, sync offline form submissions, etc.
    console.log("Service Worker: Background sync completed")
  } catch (error) {
    console.error("Service Worker: Background sync failed", error)
  }
}

// Handle push notifications (if needed in the future)
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received")

  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "https://i.ibb.co.com/4RwDKSd1/A-removebg-preview.png",
    badge: "https://i.ibb.co.com/4RwDKSd1/A-removebg-preview.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
        icon: "https://i.ibb.co.com/4RwDKSd1/A-removebg-preview.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "https://i.ibb.co.com/4RwDKSd1/A-removebg-preview.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Abdullah Fahim App", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked")

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

console.log("Service Worker: Script loaded")
