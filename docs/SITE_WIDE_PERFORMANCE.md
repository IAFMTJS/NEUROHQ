# Site-wide performance: loading and rendering

Recommendations to speed up the **entire site** (every page, first load, navigation). Builds on [DASHBOARD_LOAD_ANALYSIS.md](./DASHBOARD_LOAD_ANALYSIS.md) for the dashboard.

---

## 1. Current structure (summary)

- **Routes:** `/` (home), `(auth)/login|signup|forgot-password`, `(dashboard)/*` (dashboard, tasks, budget, report, strategy, learning, analytics, settings, assistant, xp). Plus offline, test, not-found, error.
- **Root layout:** Server; loads `@fontsource/plus-jakarta-sans`, globals.css, design-system.css; client components: ServiceWorkerRegistration, StoragePersistenceManager, PwaInstallPrompt, ThemeProvider, Toaster. No async data.
- **Dashboard layout:** Client; wraps all dashboard routes with BootstrapProvider, DashboardDataProvider, BottomNavigation, etc. Dashboard data is loaded client-side via `GET /api/dashboard/data?part=all`.
- **Auth:** No middleware. Protected pages (dashboard, settings, analytics, analytics/maker) each run `createClient()` + `getUser()` + `redirect("/login")` on the server before rendering.
- **Loading boundaries:** Most dashboard routes have `loading.tsx`; missing for `/xp` and `/analytics/maker`.

---

## 2. Root layout and global assets

| Area | Current | Recommendation |
|------|---------|----------------|
| **Fonts** | `@fontsource/plus-jakarta-sans/latin.css` in layout | Use **`next/font`** (e.g. `next/font/google` with Plus Jakarta Sans) for preload, subsetting, and no FOUT. |
| **CSS** | globals.css + design-system.css on every page | Keep; consider splitting design-system into critical vs non-critical and lazy-load non-critical if it’s large. |
| **PWA / storage** | ServiceWorkerRegistration, StoragePersistenceManager, PwaInstallPrompt in body | **Defer** StoragePersistenceManager and PwaInstallPrompt until after first paint (e.g. mount + requestIdleCallback) so they don’t compete with initial render. Keep ServiceWorkerRegistration early. |
| **Toaster** | Sonner in root layout | Keep; consider lazy-loading the Toaster component if bundle size is a concern. |

---

## 3. Data loading and auth

| Area | Current | Recommendation |
|------|---------|----------------|
| **Bootstrap vs dashboard** | Bootstrap loads user + preferences; dashboard API (part=all) also loads preferences and more. | Already reduced overlap (bootstrap is user + preferences only). Optional: when on dashboard, don’t run bootstrap at all and let dashboard API be the single source (would require layout to know route). |
| **Per-page auth** | Each protected page runs `getUser()` on the server before rendering. | Add **middleware** that checks session for `/dashboard`, `/tasks`, etc. and redirects to `/login` so the server doesn’t run full page + getUser for unauthenticated users. Keeps API auth as-is. |
| **Heavy server pages** | Tasks, settings, report, strategy, learning, analytics run many server actions in parallel. | Ensure each has a **loading.tsx** so users see a skeleton immediately. Add **loading.tsx** for `/xp` and `/analytics/maker` if missing. |
| **Streaming** | Not used. | Consider **React Suspense** + streaming for heavy server pages (e.g. tasks, settings): send shell + loading states first, then stream in data. |

---

## 4. Client bundles and code-splitting

| Area | Current | Recommendation |
|------|---------|----------------|
| **Dashboard layout** | Single client layout; all providers and shell load for every dashboard route. | Already using **dynamic()** heavily for dashboard and per-route components. Optional: lazy-load some dashboard layout providers (e.g. RoutePrefetcher, OfflineQueueSync) after first paint. |
| **Per-route dynamics** | Tasks, strategy, report, settings, budget, assistant use many `next/dynamic` imports. | Keep; good pattern. Ensure **loading** placeholders are minimal (no heavy components in loading). |
| **Home page** | Server; minimal. Uses next/image with priority for LCP. | Good. Keep **priority** only on LCP images. |

---

## 5. API and server

| Area | Current | Recommendation |
|------|---------|----------------|
| **Dashboard API** | Single endpoint with part=critical | secondary | all; part=all builds one today context. | Already optimized. Prefer **part=all** from client (done). |
| **Other APIs** | Per-route server actions. | Consider **unstable_cache** for rarely changing data (e.g. strategy, identity) with short TTL and user-scoped keys. |
| **force-dynamic** | Removed from dashboard page; tasks page still has it. | Only use **force-dynamic** where truly required (e.g. tasks needs latest daily_state for auto-missions). Leave off elsewhere so Next can cache when safe. |

---

## 6. Assets and images

| Area | Current | Recommendation |
|------|---------|----------------|
| **Images** | next/image used across app; home uses priority. | Keep **priority** only for above-the-fold / LCP images. Use appropriate **sizes** to avoid loading oversized images. |
| **Fonts** | See §2. | Use next/font. |

---

## 7. Prioritized action list

**Done (or already in place):**

- Dashboard: part=all, today context, bootstrap slimmed, loading.tsx, force-dynamic removed from dashboard page.
- Per-route loading.tsx for most dashboard routes; dynamic imports for heavy sections.
- **Root layout:** `next/font` (Plus Jakarta Sans) for preload/subsetting; `DeferredRootComponents` defers PWA prompt and storage persistence until after first paint.
- **Loading boundaries:** `loading.tsx` added for `/xp` and `/analytics/maker`.

**High impact, low risk:**

1. **next/font** for Plus Jakarta Sans in root layout.
2. **loading.tsx** for `/xp` and `/analytics/maker`.
3. **Defer** PwaInstallPrompt and StoragePersistenceManager until after first paint (client wrapper with requestIdleCallback or short delay).

**Medium impact, medium effort:**

4. **Auth middleware**: protect `/dashboard`, `/tasks`, `/budget`, `/report`, `/strategy`, `/learning`, `/analytics`, `/settings`, `/assistant`, `/xp`; redirect to `/login` when no session. Use Supabase SSR middleware pattern (session check in Edge). Then remove duplicate `getUser()` + `redirect` from individual pages (or keep as fallback).
5. **Streaming**: wrap heavy server data in `<Suspense>` and stream chunks so shell appears first (e.g. tasks, settings).

**Lower priority / later:**

6. Split design-system.css into critical vs lazy if size is large.
7. unstable_cache for heavy, rarely-changing server data (strategy, identity, etc.).
8. Lazy-load non-critical dashboard layout components (RoutePrefetcher, OfflineQueueSync) after hydration.

---

## 8. Files to touch (concise)

| Goal | Files |
|------|--------|
| next/font | `app/layout.tsx` |
| loading for xp / analytics/maker | `app/(dashboard)/xp/loading.tsx`, `app/(dashboard)/analytics/maker/loading.tsx` |
| Defer PWA/storage | New `components/DeferredRootComponents.tsx` (or similar), use in `app/layout.tsx` |
| Auth middleware | New `middleware.ts`; optionally simplify protected pages |
| Streaming | Heavy page components (e.g. tasks, settings) + Suspense boundaries |

Implementing §7 items 1–3 gives quick wins across the whole site; 4–5 require a bit more work but improve perceived performance on protected routes and heavy pages.
