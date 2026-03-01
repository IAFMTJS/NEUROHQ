// NEUROHQ Service Worker – offline-first PWA (hele site)
// Wat blijft staan op het apparaat (zodat minder opnieuw geladen hoeft):
// - STATIC_CACHE (install): /offline, manifest, app-icon (geen / of /dashboard: voorkomt lege/verkeerde HTML na login)
// - DYNAMIC_CACHE: openbare routes, JS/CSS; app-routes (dashboard, tasks, …) worden NIET gecached zodat na login altijd verse HTML
// - IndexedDB (neurohq-offline): offline mutaties (POST/PUT etc.) → gesynchroniseerd zodra er weer netwerk is
const CACHE_VERSION = "v8";
const STATIC_CACHE = `neurohq-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `neurohq-dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE = "/offline";

// Offline mutation queue (IndexedDB) for API writes
const OFFLINE_DB_NAME = "neurohq-offline";
const OFFLINE_STORE_NAME = "pending";
const OFFLINE_DB_VERSION = 1;

function openOfflineDB() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    req.onerror = function () {
      reject(req.error);
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function addToOfflineQueue(entry) {
  return openOfflineDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(OFFLINE_STORE_NAME, "readwrite");
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const id = "q-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
      store.add(
        Object.assign(
          {
            id: id,
            createdAt: Date.now(),
          },
          entry
        )
      );
      tx.oncomplete = function () {
        db.close();
        resolve();
      };
      tx.onerror = function () {
        db.close();
        reject(tx.error);
      };
    });
  });
}

function getOfflineQueue() {
  return openOfflineDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(OFFLINE_STORE_NAME, "readonly");
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = function () {
        const result = req.result || [];
        db.close();
        resolve(result);
      };
      req.onerror = function () {
        db.close();
        reject(req.error);
      };
    });
  });
}

function removeFromOfflineQueue(id) {
  return openOfflineDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(OFFLINE_STORE_NAME, "readwrite");
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      store.delete(id);
      tx.oncomplete = function () {
        db.close();
        resolve();
      };
      tx.onerror = function () {
        db.close();
        reject(tx.error);
      };
    });
  });
}

function processOfflineQueue() {
  return getOfflineQueue().then(function (entries) {
    if (!entries.length) {
      return;
    }
    return Promise.all(
      entries.map(function (entry) {
        const headers = new Headers(entry.headers || {});
        const requestInit = {
          method: entry.method,
          headers: headers,
          body: entry.body || null,
        };
        const request = new Request(entry.url, requestInit);
        return fetch(request)
          .then(function (response) {
            if (response.ok) {
              return removeFromOfflineQueue(entry.id);
            }
          })
          .catch(function () {
            // Keep in queue; another sync will retry.
          });
      })
    ).then(function () {
      return getOfflineQueue().then(function (remaining) {
        if (remaining.length > 0 && self.registration.sync) {
          return self.registration.sync.register("neurohq-sync-pending");
        }
      });
    });
  });
}

// Background Sync: replay queued API writes when connectivity returns
self.addEventListener("sync", function (event) {
  if (event.tag === "neurohq-sync-pending") {
    event.waitUntil(processOfflineQueue());
  }
});

// Alleen assets/routes die geen login nodig hebben – anders cachen we de “niet-ingelogde” HTML en zie je die bij reopen
const STATIC_ASSETS = [
  "/offline",
  "/manifest.json",
  "/manifest.webmanifest",
  "/app-icon.png",
];

// Alleen openbare routes prefetchen (zonder cookies). Dashboard/tasks/budget etc. worden gecached bij echte navigatie (met cookies) = juiste HTML
const PUBLIC_ROUTES_TO_PREFETCH = [
  "/",
  "/offline",
  "/login",
  "/signup",
  "/forgot-password",
  "/test",
];

function warmupBackgroundCaches() {
  return caches.open(DYNAMIC_CACHE).then(function (cache) {
    const routesToPrefetch = PUBLIC_ROUTES_TO_PREFETCH;
    return Promise.all(
      routesToPrefetch.map(function (route) {
        const request = new Request(route, { method: "GET" });
        return cache.match(request).then(function (cached) {
          if (cached) return;
          return fetch(request)
            .then(function (response) {
              if (response && response.ok) {
                cache.put(request, response.clone());
              }
            })
            .catch(function () {
              // Ignore errors, just warm what we can
            });
        });
      })
    );
  });
}

// Install: Cache static assets (do not skipWaiting here so app can show "Nieuwe versie beschikbaar" toast)
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// When app requests it (toast "Vernieuwen" clicked), activate new SW
// Also support background cache warmup after initial load
self.addEventListener("message", function (event) {
  if (!event.data || typeof event.data.type !== "string") {
    return;
  }
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data.type === "WARMUP_BACKGROUND_CACHE") {
    if ("waitUntil" in event) {
      event.waitUntil(warmupBackgroundCaches());
    } else {
      warmupBackgroundCaches();
    }
    return;
  }
  // iOS (en andere browsers zonder Background Sync): client vraagt SW om offline-queue te verwerken bij openen + online
  if (event.data.type === "SYNC_OFFLINE_QUEUE") {
    if ("waitUntil" in event) {
      event.waitUntil(processOfflineQueue());
    } else {
      processOfflineQueue();
    }
  }
});

// Activate: Clean up old caches, enable navigation preload, and prefetch critical routes (cache HTML in advance)
self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then(function (cacheNames) {
          return Promise.all(
            cacheNames
              .filter(function (name) {
                return name.startsWith("neurohq-") && name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
              })
              .map(function (name) {
                return caches.delete(name);
              })
          );
        })
        .then(function () {
          // Alleen openbare routes prefetchen; auth-routes (dashboard, tasks, …) alleen cachen bij echte navigatie
          return caches.open(DYNAMIC_CACHE).then(function (cache) {
            return Promise.all(
              PUBLIC_ROUTES_TO_PREFETCH.map(function (route) {
                var request = new Request(route, { method: "GET" });
                return fetch(request)
                  .then(function (response) {
                    if (response && response.ok) {
                      cache.put(request, response.clone());
                    }
                  })
                  .catch(function () {
                    // Ignore errors, just prefetch what we can
                  });
              })
            );
          });
        }),
      self.registration.navigationPreload
        ? self.registration.navigationPreload.enable().catch(function () {
            // Ignore navigation preload errors; it's an optional optimization.
          })
        : Promise.resolve(),
    ]).then(function () {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch: Cache-first for static assets, network-first (with offline queue for writes) for API, stale-while-revalidate for pages
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // JS/CSS: Stale-while-revalidate – direct uit cache als beschikbaar (snel bij herhaald gebruik/offline), op de achtergrond bijwerken
  if (url.pathname.startsWith("/_next/static/") && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        const revalidate = fetch(event.request).then(function (response) {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function () { return null; });
        if (cached) {
          revalidate();
          return cached;
        }
        return revalidate.then(function (response) {
          return response || new Response("Offline", { status: 503 });
        });
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

  // API calls: Network First for GET, queue writes when offline
  if (url.pathname.startsWith("/api/")) {
    const method = event.request.method.toUpperCase();

    // Writes: POST/PUT/PATCH/DELETE -> queue on network failure
    if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
      const networkRequest = event.request.clone();
      const queueRequest = event.request.clone();

      event.respondWith(
        fetch(networkRequest).catch(function () {
          // On network error, queue for background sync
          return queueRequest
            .text()
            .then(function (bodyText) {
              const headers = {};
              event.request.headers.forEach(function (value, key) {
                // Only persist a small subset of headers we care about.
                if (key.toLowerCase() === "content-type") {
                  headers[key] = value;
                }
              });
              return addToOfflineQueue({
                url: event.request.url,
                method: method,
                body: bodyText,
                headers: headers,
              });
            })
            .then(function () {
              if (self.registration.sync) {
                self.registration.sync.register("neurohq-sync-pending").catch(function () {
                  // Ignore sync registration errors; we'll retry when app opens.
                });
              }
              return new Response(JSON.stringify({ queued: true, offline: true }), {
                status: 202,
                headers: { "Content-Type": "application/json" },
              });
            })
            .catch(function () {
              return new Response(JSON.stringify({ error: "Offline", queued: false }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              });
            });
        })
      );
      return;
    }

    // GETs: network-first with cache + offline fallback
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
            return (
              cached ||
              new Response(JSON.stringify({ error: "Offline" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              })
            );
          });
        })
    );
    return;
  }

  // HTML pages: network-first; app-routes (dashboard, tasks, …) nooit cachen zodat na login geen oude/lege HTML uit cache
  if (event.request.headers.get("accept")?.includes("text/html")) {
    const pathname = url.pathname.replace(/\/$/, "") || "/";
    const isAppRoute =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/tasks" ||
      pathname.startsWith("/tasks/") ||
      pathname === "/settings" ||
      pathname === "/budget" ||
      pathname.startsWith("/budget/") ||
      pathname === "/learning" ||
      pathname.startsWith("/learning/") ||
      pathname === "/strategy" ||
      pathname.startsWith("/strategy/") ||
      pathname === "/report" ||
      pathname === "/xp" ||
      pathname === "/assistant" ||
      pathname.startsWith("/analytics");

    event.respondWith(
      (event.preloadResponse || Promise.resolve(null))
        .then(function (preloadedResponse) {
          if (preloadedResponse) {
            if (!isAppRoute) {
              const clone = preloadedResponse.clone();
              caches.open(DYNAMIC_CACHE).then(function (cache) {
                cache.put(event.request, clone);
              });
            }
            return preloadedResponse;
          }
          const navigationRequest = new Request(event.request.url, {
            headers: event.request.headers,
            method: "GET",
            redirect: "follow",
          });
          return fetch(navigationRequest).then(function (response) {
            if (response.ok && !isAppRoute) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then(function (cache) {
                cache.put(event.request, clone);
              });
            }
            return response;
          });
        })
        .catch(function () {
          if (isAppRoute) {
            return caches.match(OFFLINE_PAGE).then(function (offline) {
              return offline || new Response("Offline", { status: 503 });
            });
          }
          return caches.match(event.request).then(function (cached) {
            if (cached) return cached;
            return caches.match(OFFLINE_PAGE).then(function (offline) {
              return offline || new Response("Offline", { status: 503 });
            });
          });
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
