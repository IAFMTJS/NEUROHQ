# Site-wide optimization analysis

Summary of duplicate/redundant logic and changes made for a faster user experience.

---

## Changes already applied

### 1. Centralized `scale1To10ToPct`

- **Before:** Same 1→10 to percentage logic lived in 4 places: `lib/dashboard-utils.ts`, `lib/brain-mode.ts`, `components/hq/BrainStatusModal.tsx`, `components/hq/BrainStatusCard.tsx`.
- **After:** Single implementation in `lib/dashboard-utils.ts`; `brain-mode.ts`, `BrainStatusModal.tsx`, and `BrainStatusCard.tsx` import it.
- **Benefit:** One place to fix or tune; smaller bundle and less drift.

### 2. Unified week bounds

- **Before:** `app/actions/weekly-performance.ts` had its own `getWeekBounds` returning `{ weekStart, weekEnd }`; `lib/utils/learning.ts` had `getWeekBounds` returning `{ start, end }` (same week math).
- **After:** `weekly-performance.ts` uses `getWeekBounds` from `lib/utils/learning.ts` and maps `{ start: weekStart, end: weekEnd }`.
- **Benefit:** One implementation of “Monday–Sunday week”; consistent behaviour and less code.

---

## Data flow (no duplicate calls when used as intended)

- **Dashboard:** Server page calls `getDashboardPayload()` once and passes `initialCritical` / `initialSecondary` to `DashboardDataProvider`. Client only calls `fetch("/api/dashboard/data?part=all")` when there is **no** initial data (e.g. client-only navigation).
- **API route** `GET /api/dashboard/data` delegates all `part` values to `getDashboardPayload()`; no extra duplicate logic in the route.
- **Preferences:** `getUserPreferences` in `app/actions/preferences.ts` is wrapped in React `cache()`, so multiple callers in the same request (dashboard-data, bootstrap, settings, theme) share one read.

---

## Additional optimizations applied (follow-up)

### 4. ThemeHydrate uses bootstrap preferences when available

- **Change:** `ThemeHydrate` now reads `useBootstrap()?.bootstrap?.preferences` and only calls `getUserPreferencesOrDefaults()` when bootstrap has not loaded preferences yet.
- **Benefit:** After the first bootstrap fetch, theme hydration no longer triggers a second preferences fetch on the same load.

### 5. Request-scoped cache for getTodaysTasks and getEnergyBudget

- **Change:** `getTodaysTasks` (in `app/actions/tasks.ts`) and `getEnergyBudget` (in `app/actions/energy.ts`) are wrapped in React `cache()` so that multiple calls with the same arguments in the same request return the same result.
- **Benefit:** When `getDashboardPayload()` (or any other caller) invokes these multiple times in one request (e.g. dashboard building critical + tasks page), the work is deduplicated.

### 6. Revalidate XP page after task mutations

- **Change:** All task mutation paths in `app/actions/tasks.ts` that already revalidate `/dashboard` and `/tasks` now also call `revalidatePath("/xp")`.
- **Benefit:** Completing or updating tasks keeps the XP page in sync without requiring a full refresh; dashboard, tasks, and XP stay consistent.

---

## Further optimization opportunities

### 1. Reuse dashboard data on Tasks and XP pages

- **Current:** Tasks page and XP page each call `getTodaysTasks` and `getEnergyBudget` (and related actions) on load. If the user opened the dashboard first, the same data was already loaded in the dashboard critical payload.
- **Idea:** When Tasks or XP are rendered inside the same session as the dashboard (e.g. layout or provider already has `critical` for today), consider:
  - Passing `todaysTasks` and energy from `useDashboardData()?.critical` into these pages (e.g. via layout or context), and
  - Only calling `getTodaysTasks` / `getEnergyBudget` when that data is missing or for a different date.
- **Caveat:** Requires a clear “for date” contract and invalidation when the user changes date or when mutations (e.g. complete task) occur.

### 2. Single “prefs” source on first load

- **Current:** `getUserPreferencesOrDefaults` is called from BootstrapProvider, ThemeHydrate, settings page, dashboard-data, and master-missions. Thanks to `cache()`, within one request it’s deduplicated; across different navigations each page can call again.
- **Idea:** Where possible, have the root layout or BootstrapProvider be the single place that fetches preferences and pass them down (or expose via context) so settings and theme don’t each trigger a separate call on the same load. The existing bootstrap payload already includes preferences; ensuring theme and settings consume that when available would avoid extra calls.

### 3. Dangerous modules fetch

- **Current:** `DangerousModulesCard` fetches `/api/dashboard/dangerous-modules` (with and without `date`). Single component; no cross-component duplicate.
- **Idea:** Avoid refetching for the same `date` (e.g. simple in-memory cache or request dedup by date).

### 4. Task mutations and revalidation

- **Done:** All task mutations in `app/actions/tasks.ts` now revalidate `/dashboard`, `/tasks`, and `/xp` (§6 above). Validation and side-effects remain in the actions.
- **Optional:** If more routes display task-derived data, add them to the same revalidatePath set.

---

## Duplicate / merge reference

| Item | Location(s) | Status |
|------|-------------|--------|
| `scale1To10ToPct` | `lib/dashboard-utils.ts` (canonical), brain-mode, BrainStatusModal, BrainStatusCard | ✅ Centralized in dashboard-utils |
| `getWeekBounds` | `lib/utils/learning.ts` (canonical), `app/actions/weekly-performance.ts` | ✅ weekly-performance uses learning util |
| Dashboard payload building | `app/actions/dashboard-data.ts` only | ✅ API route delegates to it; no duplicate block in route |
| `getTodayEngine` vs `getTodayEngineData` | Same file `app/actions/dcic/today-engine.ts` | Intentional: server dashboard vs client hook; avoid calling both when one result can be reused |

---

## Summary

- **Done:** One shared `scale1To10ToPct`, one shared week-bounds implementation, clean dashboard API route, ThemeHydrate using bootstrap prefs, request-scoped cache for `getTodaysTasks` and `getEnergyBudget`, and revalidation of `/xp` after task mutations.
- **Already in good shape:** Request-level dedup for preferences via `cache()`, and dashboard data fetched once on server with client fallback only when there’s no initial data.
- **Next steps (optional):** Reuse dashboard critical data on Tasks/XP when available; have settings page consume bootstrap prefs when available.
