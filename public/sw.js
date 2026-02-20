// NEUROHQ Service Worker - Network-first for JS/CSS so deployment always serves new nav/icons
const CACHE_VERSION = "v3";
const STATIC_CACHE = `neurohq-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `neurohq-dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE = "/offline";

// Assets to cache immediately on install
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/offline",
  "/manifest.json",
  "/app-icon.png",
];

// Critical routes to prefetch
const CRITICAL_ROUTES = [
  "/tasks",
  "/assistant",
  "/budget",
  "/learning",
  "/strategy",
  "/report",
  "/settings",
];

// Install: Cache static assets
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate: Clean up old caches and prefetch critical routes
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) {
            return name.startsWith("neurohq-") && name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
          })
          .map(function (name) {
            return caches.delete(name);
          })
      );
    }).then(function () {
      // Prefetch critical routes in background
      return Promise.all(
        CRITICAL_ROUTES.map(function (route) {
          return fetch(route, { method: "HEAD" }).catch(function () {
            // Ignore errors, just prefetch what we can
          });
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch: Cache-first for static assets, network-first for API, stale-while-revalidate for pages
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // JS/CSS: Network First so deployment always serves new bundle (nav icons, etc.)
  if (url.pathname.startsWith("/_next/static/") && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
    return;
  }
  // Other static assets: images, fonts, icons - Cache First
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/mascots/")
  ) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // API calls: Network First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cached) {
            return cached || new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          });
        })
    );
    return;
  }

  // HTML pages: Stale-While-Revalidate
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        const fetchPromise = fetch(event.request)
          .then(function (response) {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then(function (cache) {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(function () {
            if (cached) return cached;
            return caches.match(OFFLINE_PAGE).then(function (offline) {
              return offline || new Response("Offline", { status: 503 });
            });
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: Network First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || new Response("Offline", { status: 503 });
        });
      })
  );
});

// Push notifications
self.addEventListener("push", function (event) {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "NEUROHQ";
  const options = {
    body: data.body ?? "",
    icon: "/app-icon.png",
    badge: "/app-icon.png",
    tag: data.tag ?? "neurohq",
    data: data.url ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length) clientList[0].focus();
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
