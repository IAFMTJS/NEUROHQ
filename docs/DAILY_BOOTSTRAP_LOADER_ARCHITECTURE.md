## Daily Bootstrap Loader Architecture

### Overview

The legacy loading model used many per-route skeletons (`loading.tsx`, Suspense fallbacks, dynamic import loaders, ad‑hoc `isLoading` branches). These have been removed and replaced with a single cinematic daily loader driven by a centralized `DailySnapshot`. First paint is now “snapshot‑first”: the UI renders from cached or preloaded daily data, then refreshes in the background.

Key pieces:
- `DailySnapshot` type (`types/daily-snapshot.ts`) with slices: `dashboard`, `missions`, `xp`, `strategy`, `learning`, `budget`, `analytics`, plus `ui`.
- `initializeDailySystem` (`lib/daily-initialize.ts`) which:
  - Tries to load a same‑day snapshot from `lib/daily-snapshot-storage.ts`.
  - If missing or stale, builds a fresh snapshot for today and runs all preload steps (`fetchDashboard`, `fetchMissions`, `fetchXP`, `fetchStrategy`, `fetchLearning`, `fetchBudget`, `fetchAnalytics`, `preloadPages`, `preloadAssets`, `prepareCache`).
  - Persists the result to localStorage.
- `BootstrapGate` + `BootstrapLoader` (`components/bootstrap`) which:
  - Call `initializeDailySystem()` once on app start.
  - Show a full‑screen cinematic loader with step progress until the snapshot is ready.
  - Expose the resolved `DailySnapshot` via React context and `useDailySnapshot()`.

The dashboard layout wraps all dashboard routes in `BootstrapGate`, so every route under `(dashboard)` can read from the same snapshot.

### Data Sources and Steps

`initializeDailySystem` executes the following steps in order (each updates the snapshot in place):

- **`fetchDashboard`**
  - Endpoint: `/api/dashboard/data?part=all`.
  - Populates `snapshot.dashboard.critical` and `snapshot.dashboard.secondary`.
  - Used by `DashboardLayoutClient` → `DashboardDataProvider` for first‑paint dashboard cards.

- **`fetchMissions`**
  - Endpoint: `/api/bootstrap/today`.
  - Populates:
    - `snapshot.missions`:
      - `dateStr`
      - `tasksByDate`
      - `completedToday`
      - `energyBudget`
      - `dailyState`
    - `snapshot.learning` slice (learning minutes, streak, reflection, etc.).
    - `snapshot.budget` slice (see Budget section below).
  - Single source of truth for daily bootstrap data; legacy `useDailyBootstrap` is removed.

- **`fetchXP`**
  - Endpoint: `/api/xp/context?date=YYYY-MM-DD`.
  - Populates `snapshot.xp` with the cached XP context (`XPCachePayload`).
  - Used by `XPPageClient` → `XPDataProvider` for snapshot‑first XP page rendering.

- **`fetchStrategy`**
  - Endpoint: `/api/strategy/snapshot`.
  - Populates `snapshot.strategy` with `{ today, payload: { strategy, completion } }`.
  - Designed for future snapshot‑first strategy clients.

- **`fetchAnalytics`**
  - Endpoint: `/api/analytics/snapshot`.
  - Populates `snapshot.analytics` with `{ today, payload: { xpContext, currentReport, funnelCounts, graph30Data, xpBySource30, analyticsEventsSummary, metaInsights30, heatmap30Days, thirtyDayMirror, consistencyMap, hourHeatmap, dropOff, correlation, radar, comparative, friction40, recentRanks } }`.
  - Enables snapshot‑first Insights/Report views.

- **`preloadPages`**
  - Pre‑fetches main routes (`/dashboard`, `/tasks`, `/xp`, `/report`, `/strategy`, `/learning`, `/learning/analytics`, `/budget`, `/help`, `/assistant`) with `fetch(..., cache: "force-cache")`.
  - Updates `snapshot.ui.pagesPrefetched`.

- **`preloadAssets`**
  - Warm‑loads mascot images used in cinematic HUD (`/mascots/dashboard.png`, `/mascots/tasks.png`, `/mascots/xp.png`, `/mascots/budget.png`).
  - Sets `snapshot.ui.assetsPrefetched = true`.

- **`prepareCache`**
  - Reserved for future cross‑slice cache preparation. Currently a no‑op that returns the snapshot unchanged.

On any step failure, the loader either:
- Falls back to a previous‑day snapshot (marking `snapshot.ui.offlineMode = true`) if one exists.
- Or throws, surfacing a hard error when no usable data is available.

### Slice‑Specific Consumption

#### Dashboard
- **Server side**: `DashboardLayout` wraps `(dashboard)` children in `BootstrapGate` and passes `snapshot.dashboard` into `DashboardLayoutClient` as `initialDashboardSnapshot`.
- **Client side**: `DashboardLayoutClient`:
  - Hydrates `todayDate` in the HQ store from `snapshot.date`.
  - Seeds `DashboardDataProvider` with `initialCritical` and `initialSecondary` from the snapshot.
  - All dashboard widgets read from the provider and then refresh via React Query / server actions as needed.

#### Missions / Tasks
- **Missions snapshot**:
  - Structure: `MissionsSnapshot` with `dateStr`, `tasksByDate`, `completedToday`, `energyBudget`, `dailyState`.
  - Filled by `/api/bootstrap/today` → `fetchMissions` step.
- **Client usage**:
  - `MissionsProvider` reads `snapshot.missions` via `useDailySnapshot()` and:
    - Hydrates the HQ store (tasks, energy budget, daily state).
    - Exposes `useMissionsSnapshot()` for components that want read‑only access to the missions slice.
  - `useTasksBootstrap` first checks `useMissionsSnapshot()` before hitting the network, so tasks can render instantly from the snapshot even on cold start.

#### XP
- **XP snapshot**:
  - Structure: `XPSnapshot` with `today` and `cache: XPCachePayload`.
  - Filled by `fetchXP` calling `/api/xp/context`.
- **Client usage**:
  - `XPPageClient` reads `snapshot.xp.cache` from `useDailySnapshot()` and:
    - Seeds `XPDataProvider` with `initialDateStr` and `initialData`.
    - Renders `XPPageContent` once data is present (no `isLoading` branch).

#### Learning
- **Learning snapshot**:
  - Structure: `LearningSnapshot` (weekly minutes, target, streak, focus, streams, consistency, reflection).
  - Filled from `/api/bootstrap/today` in `fetchMissions`.
- **Client usage**:
  - `LearningContentClient`:
    - Reads `snapshot.learning` via `useDailySnapshot()`.
    - Falls back to server `fallback` props when the snapshot is missing or for non‑today dates.

#### Budget
- **Budget snapshot**:
  - Structure: `BudgetSnapshot`:
    - `today`, `settings`, `currentMonthExpenses`, `currentMonthIncome`, `budgetRemainingCents`
    - `currency`, `isWeekly`, `periodLabel`, `isPaydayCycle`
    - `disciplineScore`, `disciplineXpThisWeek`, `disciplineCompletedToday`
    - `daysUnderBudgetThisWeek`, `unplannedSummary { count, totalCents }`
  - Filled from `/api/bootstrap/today` by `fetchMissions`.
- **Client usage**:
  - `BudgetSnapshotProvider`:
    - Reads `snapshot.budget` via `useDailySnapshot()`.
    - Hydrates the HQ store’s budget slice (amounts, currency, discipline metrics, unplanned summary).
  - `BudgetPage` still computes deep analytics on the server; hero and summary components can be wired to use the HQ store (which is already primed from the snapshot).

#### Strategy & Analytics
- **Strategy**:
  - `StrategySnapshot` contains `today` and a `payload` wrapping `{ strategy, completion }` from `/api/strategy/snapshot`.
  - Intended for snapshot‑first strategy hero/summary components.
- **Analytics / Report**:
  - `AnalyticsSnapshot` contains `today` and a `payload` object with all data needed for the Insights/Report page hero, graphs, funnels, and 30‑day cards.
  - A future `AnalyticsPageClient` can read this slice via `useDailySnapshot()` and avoid cold‑start waterfalls.

### Removal of Legacy Loaders

As part of this architecture, the following were removed or neutralized:
- All `app/(dashboard)/*/loading.tsx` files.
- Skeleton components and `Suspense` fallbacks on dashboard routes.
- Dynamic import `loading` components were changed to `() => null`.
- Per‑suffix daily snapshots in `lib/client-cache.ts`:
  - `loadDailySnapshot` / `saveDailySnapshot` / `isLocalSnapshotNewerThan` removed.
  - Only mutation queue and UI preference helpers remain.
- `useDailyBootstrap` and its localStorage cache for `/api/bootstrap/today`:
  - Initial bootstrap now flows exclusively through `initializeDailySystem` + `BootstrapGate`.
  - `lib/daily-bootstrap.ts` now exposes only `usePeriodicBootstrapRefresh` for optional background refreshes.

### Behavioral Expectations / QA Checklist

Use this checklist when verifying the loader:

1. **Cold start (no snapshot)**
   - Clear `localStorage` keys beginning with `neurohq-daily-snapshot-v1`.
   - Hard‑refresh `/dashboard`.
   - Expected:
     - `BootstrapLoader` shows immediately with step progress.
     - After steps complete, dashboard appears with no skeletons or `isLoading` flashes.
     - Navigating to `/tasks`, `/xp`, `/learning`, `/budget`, `/report`, `/strategy` uses the same snapshot (no additional full‑page loaders).

2. **Same‑day reopen**
   - With a valid same‑day snapshot in localStorage, refresh `/dashboard`.
   - Expected:
     - `initializeDailySystem` returns `{ kind: "fromCache" }`.
     - Loader either does not show or appears only very briefly.
     - Missions, XP, Learning, Budget hero/summary sections render from cached data instantly.

3. **Offline / degraded**
   - With a valid snapshot stored, switch the browser to offline mode.
   - Hard‑refresh `/dashboard`.
   - Expected:
     - `initializeDailySystem` fails network steps but falls back to the previous snapshot.
     - `snapshot.ui.offlineMode === true`.
     - Core pages render from cached data; no skeletons.

4. **Background refresh**
   - On long‑lived sessions, enable `usePeriodicBootstrapRefresh()` in the shell (if desired).
   - Expected:
     - Periodic calls to `/api/bootstrap/today` update headline metrics without interfering with the initial snapshot.

