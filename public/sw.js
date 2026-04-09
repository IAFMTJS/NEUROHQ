// NEUROHQ Service Worker – offline-first PWA (hele site)
// Wat blijft staan op het apparaat (zodat minder opnieuw geladen hoeft):
// - STATIC_CACHE (install): /offline, manifest, app-icon, core HUD visuals
// - DYNAMIC_CACHE (per CACHE_VERSION): HTML/API offline fallback; _next/static JS/CSS = network-first, daarna cache voor offline
// - IndexedDB (neurohq-offline): offline mutaties (POST/PUT etc.) → gesynchroniseerd zodra er weer netwerk is
// Bump this when UI/layout changes so authenticated HTML cache doesn't keep old shells after refresh.
const CACHE_VERSION = "v29";
const STATIC_CACHE = `neurohq-static-${CACHE_VERSION}`;
const OFFLINE_PAGE = "/offline";

function waitUntilIfPossible(event, promise) {
  try {
    if (event && typeof event.waitUntil === "function") {
      event.waitUntil(
        Promise.resolve(promise).catch(function () {
          // Never allow waitUntil to throw/reject.
        })
      );
    }
  } catch {
    // Ignore; some browsers/platforms may be picky about waitUntil usage.
  }
}

function safeCachePut(cache, request, response) {
  return cache.put(request, response).catch(function () {
    // Ignore transient network/cache races during dev HMR or aborted nav preload responses.
  });
}

function getTodayDateString() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function getDynamicCacheName() {
  // Single bucket per CACHE_VERSION (no calendar day in the name). A daily suffix used to wipe the
  // whole cache at midnight, which deleted still-valid /_next/static chunks and caused frequent
  // "page failed" / cold loads after sleep or the next-day open on PWA.
  return "neurohq-dynamic-" + CACHE_VERSION;
}

function isAuthenticatedAppRoutePath(pathname) {
  // Daytime-critical authenticated surfaces: allow offline open + SWR HTML caching.
  return (
    pathname === "/dashboard" ||
    pathname === "/tasks" ||
    pathname === "/budget" ||
    pathname === "/strategy" ||
    pathname === "/analytics" ||
    pathname === "/report" ||
    pathname === "/settings" ||
    pathname === "/profile" ||
    pathname === "/help" ||
    pathname === "/assistant" ||
    // nested analytics / learning pages should behave the same once visited
    pathname.startsWith("/learning")
  );
}

function isLearningPath(pathname) {
  return pathname === "/learning" || pathname.startsWith("/learning/");
}

/** True for App Router flight/RSC fetches — must never use the generic cache-first handler. */
function isNextFlightLikeRequest(request, url) {
  try {
    const h = request.headers;
    const accept = h.get("accept") || "";
    if (accept.includes("text/x-component")) return true;
    // Align with next/dist/client/components/app-router-headers FLIGHT_HEADERS + _rsc query.
    if (h.get("rsc") === "1") return true;
    if (h.has("next-router-state-tree")) return true;
    if (h.has("next-router-prefetch")) return true;
    if (h.has("next-router-segment-prefetch")) return true;
    if (h.has("next-hmr-refresh")) return true;
    const q = url.search || "";
    if (q.includes("_rsc")) return true;
    return false;
  } catch {
    return false;
  }
}

/** Stable key for caching HTML navigations (ignore SW reload cache-bust query). */
function requestForHtmlCache(eventRequest) {
  try {
    const u = new URL(eventRequest.url);
    if (u.searchParams.has("__swv")) {
      u.searchParams.delete("__swv");
      const qs = u.searchParams.toString();
      u.search = qs ? "?" + qs : "";
    }
    return new Request(u.toString(), {
      method: "GET",
      credentials: eventRequest.credentials,
      headers: eventRequest.headers,
      redirect: eventRequest.redirect || "follow",
    });
  } catch {
    return eventRequest;
  }
}

function isSnapshotApiRequest(url) {
  if (!url || !url.pathname) return false;
  const p = url.pathname;
  if (p === "/api/bootstrap/today") return true;
  if (p === "/api/dashboard/data") return true;
  if (p === "/api/xp/context") return true;
  if (p === "/api/settings") return true;
  if (p === "/api/strategy/snapshot") return true;
  if (p === "/api/analytics/snapshot") return true;
  if (p === "/api/tasks") return true;
  if (p === "/api/budget/context") return true;
  return false;
}

function looksLikeJsonResponse(response) {
  try {
    const ct = response && response.headers ? response.headers.get("content-type") : null;
    return typeof ct === "string" && ct.toLowerCase().includes("application/json");
  } catch {
    return false;
  }
}

/** Never let fetch handler reject — prevents "FetchEvent.respondWith received an error: Load failed" after PWA resume. */
function offlineFallbackResponse() {
  return caches.match(OFFLINE_PAGE).then(function (offline) {
    return offline || new Response("Offline", { status: 503, statusText: "Offline" });
  });
}

function safeRespondWith(event, getPromise) {
  event.respondWith(
    Promise.resolve()
      .then(getPromise)
      .catch(function () {
        return offlineFallbackResponse();
      })
  );
}

// Offline mutation queue (IndexedDB) for API writes
// NOTE: Keep separate from the app's action-queue (`lib/offline-queue.ts`) to avoid shape collisions.
const OFFLINE_DB_NAME = "neurohq-sw-offline";
const OFFLINE_STORE_NAME = "pendingHttp";
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
  "/icon-192.png",
  // Core branding & HUD visuals – pre-cached so first PWA open has them locally
  "/logo-naam.png",
  // Bottom nav PNGs (`lib/navigation/bottom-nav-links.tsx`); aligns with native warm-cache.
  "/nav/Missions.png",
  "/nav/Budget.png",
  "/nav/Growth.png",
  "/nav/Dashboard.png",
  "/nav/Strategy.png",
  "/Icons/User.PNG",
  "/nav/Settings.png",
  "/Background12.PNG",
  "/grain.PNG",
  "/stars.png",
];

// Alleen openbare routes prefetchen (zonder cookies). Dashboard/tasks/budget etc. worden gecached bij echte navigatie (met cookies) = juiste HTML
const PUBLIC_ROUTES_TO_PREFETCH = [
  "/",
  "/offline",
  "/login",
  "/signup",
  "/forgot-password",
];

const AUTH_ROUTES_TO_PREFETCH = [
  "/dashboard",
  "/tasks",
  "/budget",
  "/strategy",
  "/analytics",
  "/report",
  "/profile?view=insights&tab=overview",
  "/settings",
  "/profile",
  "/help",
  "/assistant",
  "/learning",
  "/learning/analytics",
];

function getSnapshotEndpointsToPrefetch(today) {
  var t = today || getTodayDateString();
  // Keep URLs stable so CacheStorage hits; only include the params that are required.
  return [
    "/api/bootstrap/today",
    "/api/dashboard/data?part=all",
    "/api/xp/context?date=" + encodeURIComponent(t),
    "/api/settings",
    "/api/strategy/snapshot",
    "/api/analytics/snapshot",
    "/api/tasks?date=" + encodeURIComponent(t),
    "/api/budget/context",
  ];
}

function warmupBackgroundCaches(opts) {
  var options = opts || {};
  var includeAuth = options.includeAuth === true;
  var today = options.today || getTodayDateString();
  return caches.open(getDynamicCacheName()).then(function (cache) {
    const routesToPrefetch = includeAuth
      ? PUBLIC_ROUTES_TO_PREFETCH.concat(AUTH_ROUTES_TO_PREFETCH, getSnapshotEndpointsToPrefetch(today))
      : PUBLIC_ROUTES_TO_PREFETCH;
    return Promise.all(
      routesToPrefetch.map(function (route) {
        const request = new Request(route, { method: "GET" });
        return cache.match(request).then(function (cached) {
          if (cached) return;
          return fetch(request)
            .then(function (response) {
              // Never cache auth-redirect HTML into API cache keys (causes JSON parse failures later).
              if (response && response.ok && (!request.url.includes("/api/") || looksLikeJsonResponse(response))) {
                safeCachePut(cache, request, response.clone());
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

// Install: Cache static assets. Call skipWaiting so new versions activate immediately and avoid stale 404 HTML.
// Use addAll with catch so one missing asset (e.g. 404 in dev) does not block SW activation and push subscribe.
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS).catch(function () {
        // Continue activation even if some assets failed (e.g. /offline 404 in dev).
      });
    })
  );
  self.skipWaiting();
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
    var includeAuth = !!event.data.includeAuth;
    var today = typeof event.data.today === "string" ? event.data.today : undefined;
    var replyPort =
      event.data.neurohqReplyPort === true && event.ports && event.ports[0] ? event.ports[0] : null;
    var warmupPromise = warmupBackgroundCaches({ includeAuth: includeAuth, today: today });
    if (replyPort) {
      warmupPromise
        .then(function () {
          try {
            replyPort.postMessage({ ok: true });
          } catch (e) {}
        })
        .catch(function (err) {
          try {
            replyPort.postMessage({
              ok: false,
              error: err && err.message ? String(err.message) : String(err),
            });
          } catch (e2) {}
        });
    }
    if ("waitUntil" in event) {
      event.waitUntil(warmupPromise);
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
    return;
  }
  // Local test notification: schedule a one-off notification ~30s later so the user can see how push looks/behaves.
  if (event.data.type === "TEST_PUSH_IN_30S") {
    if ("waitUntil" in event) {
      event.waitUntil(
        new Promise(function (resolve) {
          setTimeout(function () {
            self.registration
              .showNotification("NEUROHQ test notification", {
                body: "This is a delayed test notification (≈30s).",
                icon: "/icon-192.png",
                badge: "/icon-192.png",
                tag: "neurohq-test",
              })
              .finally(resolve);
          }, 30000);
        })
      );
    } else {
      setTimeout(function () {
        self.registration.showNotification("NEUROHQ test notification", {
          body: "This is a delayed test notification (≈30s).",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "neurohq-test",
        });
      }, 30000);
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
          var todayDynamic = getDynamicCacheName();
          return Promise.all(
            cacheNames
              .filter(function (name) {
                return name.startsWith("neurohq-") && name !== STATIC_CACHE && name !== todayDynamic;
              })
              .map(function (name) {
                return caches.delete(name);
              })
          );
        })
        .then(function () {
          // Prefetch public routes into dynamic cache
          return caches.open(getDynamicCacheName()).then(function (cache) {
            return Promise.all(
              PUBLIC_ROUTES_TO_PREFETCH.map(function (route) {
                var request = new Request(route, { method: "GET" });
                return fetch(request)
                  .then(function (response) {
                    if (response && response.ok) {
                      safeCachePut(cache, request, response.clone());
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

// Fetch: Next.js bundles = network-first so deploys show new CSS/JS immediately; cache only for offline replay
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // JS/CSS (_next/static): MUST run before generic `/_next/` handling — otherwise every static chunk
  // was network-only with a plain-text 503 fallback (unreachable dead branch + bad offline behavior).
  if (url.pathname.startsWith("/_next/static/") && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
    safeRespondWith(event, function () {
      return caches.open(getDynamicCacheName()).then(function (cache) {
        return fetch(event.request)
          .then(function (response) {
            if (response.ok && event.request.method === "GET") {
              safeCachePut(cache, event.request, response.clone());
            }
            return response;
          })
          .catch(function () {
            return cache.match(event.request).then(function (c) {
              return c || new Response("Offline", { status: 503 });
            });
          });
      });
    });
    return;
  }

  // App Router RSC/flight: do not call respondWith — a synthetic 503 body breaks flight parsing after
  // PWA resume when the radio is still waking (half the app showed "Er is iets misgegaan").
  try {
    if (isNextFlightLikeRequest(event.request, url)) {
      return;
    }
  } catch {
    // If header access fails, fall through to other handlers.
  }

  // Remaining Next internals (e.g. image optimizer): network-only, never cache flight.
  if (url.pathname.startsWith("/_next/")) {
    safeRespondWith(event, function () {
      return fetch(event.request).catch(function () {
        return new Response("Offline", { status: 503 });
      });
    });
    return;
  }
  // Other static assets: images, fonts, icons - Cache First (Cache API only supports GET)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/mascots/")
  ) {
    safeRespondWith(event, function () {
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(function (cache) {
              safeCachePut(cache, event.request, clone);
            });
          }
          return response;
        });
      });
    });
    return;
  }

  // API calls: Network First for GET, queue writes when offline
  if (url.pathname.startsWith("/api/")) {
    const method = event.request.method.toUpperCase();

    // Explicit network bypass for bootstrap/debug requests.
    if (event.request.headers.get("x-sw-bypass") === "1") {
      safeRespondWith(event, function () {
        return fetch(event.request).catch(function () {
          return new Response(
            JSON.stringify({ error: "Offline", offline: true }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        });
      });
      return;
    }

    // Push / auth / security-sensitive endpoints: NEVER cache or queue, always network-only
    if (
      url.pathname.startsWith("/api/push") ||
      url.pathname.startsWith("/api/auth") ||
      url.pathname.startsWith("/api/stripe") ||
      url.pathname.startsWith("/api/billing")
    ) {
      safeRespondWith(event, function () {
        return fetch(event.request).catch(function () {
          return new Response(
            JSON.stringify({ error: "Offline", offline: true }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        });
      });
      return;
    }

    // Writes: POST/PUT/PATCH/DELETE -> queue on network failure
    if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
      const networkRequest = event.request.clone();
      const queueRequest = event.request.clone();

      safeRespondWith(event, function () {
        return fetch(networkRequest).catch(function () {
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
        });
      });
      return;
    }

    // GETs: snapshot endpoints = network-first (same as other /api GETs). Cache-first here made the PWA
    // serve stale JSON for /api/tasks, /api/dashboard/data, etc. when fetches omit x-neurohq-refresh —
    // browser tabs could look fine while the installed PWA kept yesterday/empty snapshots. Update cache on
    // successful JSON; fall back to cache only when the network fails (offline).
    if (method === "GET" && isSnapshotApiRequest(url)) {
      safeRespondWith(event, function () {
        return caches.open(getDynamicCacheName()).then(function (cache) {
          function fetchSnapshot(req) {
            return fetch(req).then(function (response) {
              if (response && response.status === 304) {
                return cache.match(event.request).then(function (cached) {
                  if (cached) return cached;
                  var u = event.request.url;
                  u += (u.indexOf("?") >= 0 ? "&" : "?") + "_swbust=" + Date.now();
                  return fetchSnapshot(
                    new Request(u, {
                      method: "GET",
                      credentials: event.request.credentials,
                      headers: event.request.headers,
                      cache: "no-store",
                    })
                  );
                });
              }
              if (response && response.ok && looksLikeJsonResponse(response)) {
                safeCachePut(cache, event.request, response.clone());
              }
              return response;
            });
          }
          return fetchSnapshot(event.request).catch(function () {
            return cache.match(event.request).then(function (c) {
              return (
                c ||
                new Response(JSON.stringify({ error: "Offline" }), {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                })
              );
            });
          });
        });
      });
      return;
    }

    // Other GETs: network-first so fresh server state wins; fall back to cache when offline
    safeRespondWith(event, function () {
      return caches.open(getDynamicCacheName()).then(function (cache) {
        return fetch(event.request)
          .then(function (response) {
            if (response.ok && event.request.method === "GET") {
              var clone = response.clone();
              safeCachePut(cache, event.request, clone);
            }
            return response;
          })
          .catch(function () {
            return cache.match(event.request).then(function (c) {
              return (
                c ||
                new Response(JSON.stringify({ error: "Offline" }), {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                })
              );
            });
          });
      });
    });
    return;
  }

  // HTML pages: authenticated app routes = stale-while-revalidate (cache hit → instant; then network refresh).
  // Mid-day deploys without refresh can still reference removed chunks; "Nieuwe versie" / hard refresh fixes that.
  if (event.request.headers.get("accept")?.includes("text/html")) {
    var htmlKey = requestForHtmlCache(event.request);
    var navRequest = new Request(htmlKey.url, {
      headers: event.request.headers,
      method: "GET",
      redirect: "follow",
      credentials: event.request.credentials,
    });

    safeRespondWith(event, function () {
      return caches.open(getDynamicCacheName()).then(function (cache) {
        const pathname = url.pathname;

        if (isAuthenticatedAppRoutePath(pathname)) {
          // Learning is updated frequently in this project; prefer fresh HTML over instant stale shell.
          if (isLearningPath(pathname)) {
            return (event.preloadResponse || Promise.resolve(null))
              .then(function (preloadedResponse) {
                return preloadedResponse || fetch(navRequest);
              })
              .then(function (response) {
                if (response && response.ok && event.request.method === "GET") {
                  safeCachePut(cache, htmlKey, response.clone());
                }
                return response;
              })
              .catch(function () {
                return cache.match(htmlKey).then(function (c) {
                  if (c) return c;
                  return caches.match(OFFLINE_PAGE).then(function (offline) {
                    return offline || new Response("Offline", { status: 503 });
                  });
                });
              });
          }

          // Stale-while-revalidate: cache hit serves immediately (PWA reopen / sleep); network refreshes in background.
          return cache.match(htmlKey).then(function (cached) {
            if (cached) {
              fetch(navRequest)
                .then(function (response) {
                  if (response && response.ok && event.request.method === "GET") {
                    safeCachePut(cache, htmlKey, response.clone());
                  }
                })
                .catch(function () {});
              return cached;
            }
            return (event.preloadResponse || Promise.resolve(null))
              .then(function (preloadedResponse) {
                return preloadedResponse || fetch(navRequest);
              })
              .then(function (response) {
                if (response && response.ok && event.request.method === "GET") {
                  safeCachePut(cache, htmlKey, response.clone());
                }
                return response;
              })
              .catch(function () {
                return cache.match(htmlKey).then(function (c) {
                  if (c) return c;
                  return caches.match(OFFLINE_PAGE).then(function (offline) {
                    return offline || new Response("Offline", { status: 503 });
                  });
                });
              });
          });
        }

        // Other HTML: keep existing network-first behavior.
        return (event.preloadResponse || Promise.resolve(null))
          .then(function (preloadedResponse) {
            if (preloadedResponse) {
              if (event.request.method === "GET") {
                var c = preloadedResponse.clone();
                safeCachePut(cache, htmlKey, c);
              }
              return preloadedResponse;
            }
            return fetch(navRequest).then(function (response) {
              if (response.ok && event.request.method === "GET") {
                var c = response.clone();
                safeCachePut(cache, htmlKey, c);
              }
              return response;
            });
          })
          .catch(function () {
            return cache.match(htmlKey).then(function (c) {
              if (c) return c;
              return caches.match(OFFLINE_PAGE).then(function (offline) {
                return offline || new Response("Offline", { status: 503 });
              });
            });
          });
      });
    });
    return;
  }

  // Default: cache-first for today, then network (other GETs – data, etc.)
  safeRespondWith(event, function () {
    return caches.open(getDynamicCacheName()).then(function (cache) {
      return cache.match(event.request).then(function (cached) {
        if (cached) {
          fetch(event.request).then(function (response) {
            if (response.ok && event.request.method === "GET") {
              var c = response.clone();
              safeCachePut(cache, event.request, c);
            }
          }).catch(function () {});
          return cached;
        }
        return fetch(event.request).then(function (response) {
          if (response.ok && event.request.method === "GET") {
            var c = response.clone();
            safeCachePut(cache, event.request, c);
          }
          return response;
        }).catch(function () {
          return cache.match(event.request).then(function (c) {
            return c || new Response("Offline", { status: 503 });
          });
        });
      });
    });
  });
});

// Push notifications
self.addEventListener("push", function (event) {
  const p = (async function () {
    let data = {};
    try {
      data = event.data ? await event.data.json() : {};
    } catch (e) {
      // Some platforms may deliver non-JSON payloads; try text+JSON fallback.
      try {
        const text = event.data ? await event.data.text() : "";
        if (text) data = JSON.parse(text);
      } catch {
        // ignore; we will fall back to defaults below
      }
    }

    const title = (data && typeof data === "object" && data.title) ? data.title : "NEUROHQ";
    const options = {
      body: (data && typeof data === "object" && data.body) ? data.body : "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: (data && typeof data === "object" && data.tag) ? data.tag : "neurohq",
      data:
        data && typeof data === "object" && data.url
          ? { url: data.url }
          : {},
    };

    let show = self.registration.showNotification(title, options);
    if (
      typeof self.setAppBadge === "function" &&
      (!data || typeof data !== "object" || data.badge === undefined || data.badge > 0)
    ) {
      const count =
        data && typeof data === "object" && typeof data.badge === "number"
          ? Math.min(99, Math.max(1, data.badge))
          : 1;
      show = Promise.all([show, self.setAppBadge(count)]);
    }

    return show;
  })();

  event.waitUntil(p);
});

// Notification click handler: open app and clear badge
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  var p = clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
    if (clientList.length) clientList[0].focus();
    if (clients.openWindow) return clients.openWindow(url);
  });
  if (typeof self.clearAppBadge === "function") {
    p = Promise.all([p, self.clearAppBadge()]);
  }
  event.waitUntil(p);
});
