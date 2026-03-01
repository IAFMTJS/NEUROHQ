# Dashboard page load – thorough analysis

Why the dashboard feels slow and where time is spent.

---

## Executive summary: why the page is slow

| Layer | Main causes |
|-------|----------------|
| **Server (page)** | `force-dynamic` → every visit runs auth + full server render; no cache. |
| **Server (API)** | One `getUser()` + `ensureUserProfile` block the response; then **critical** runs 20+ parallel calls with **duplicate work** (daily_state 3×, tasks 2–3×, getTodayEngine still does extra DB); **secondary** re-runs getTodayEngine, getDailyState, getEnergyBudget. |
| **Client** | **Bootstrap** and **dashboard API** both load XP, economy, daily state, preferences → same data fetched twice. First paint waits on **critical**; bento waits on **secondary**. Even with parallel critical+secondary from the shell, the server does duplicate work across the two parts. |
| **Net** | Time to first meaningful paint ≈ **server render + critical API** (often 1–3+ s). Full dashboard ≈ that + **secondary** (another 1–2+ s). Duplicate DB and auth work lengthen both. |

---

## State-first loading (pattern)

**Goal:** Every page should be as fast as possible, with as much data as possible coming from **state** so we avoid duplicate fetches and improve perceived speed.

- **Single preload:** `DashboardDataProvider` starts fetching `critical` + `secondary` **immediately** when the layout mounts (no delay). That puts today’s mode, tasks, state, XP, economy, etc. in React state before the user navigates.
- **Typed critical:** `DashboardCritical` in `types/dashboard-data.types.ts` matches `GET /api/dashboard/data?part=critical`. Any page that needs mode, `todaysTasks`, `state`, `carryOverCount`, etc. should **read from `useDashboardData().critical`** when available instead of calling server actions or refetching.
- **Reuse, don’t refetch:** Dashboard page and any other route under `(dashboard)` can use `critical` and `secondary` from context. For new pages, prefer consuming from `useDashboardData()` first; only fetch when the data isn’t in state (e.g. page-specific data that isn’t in critical/secondary).

---

## 1. Request waterfall (high level)

```
User navigates to /dashboard
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SERVER (dashboard/page.tsx)                                             │
│   export const dynamic = "force-dynamic"  → no cache, every hit to server│
│   createClient() + auth.getUser()        → blocks first byte             │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼  HTML + layout + DashboardClientShell (no data yet)
    │
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENT – layout mounts                                                   │
│   • BootstrapProvider: getAppBootstrap() (server action)                  │
│     → getXP, getUserEconomy, getDailyState, getUserPreferencesOrDefaults│
│   • DashboardDataProvider: preloadDashboard() runs immediately on mount  │
│     → fetchCritical + fetchSecondary in parallel (data in state ASAP)    │
└─────────────────────────────────────────────────────────────────────────┘
    │
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENT – DashboardClientShell mounts                                     │
│   • useDashboardData() → cache is usually null on first visit             │
│   • useEffect: fetchCritical()  → GET /api/dashboard/data?part=critical  │
│   • UI shows <DashboardSkeleton /> until critical returns                │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼  When critical responds (often 1–3+ seconds)
    │
│   • setCritical(data) → re-render with real content                      │
│   • fetchSecondary()  → GET /api/dashboard/data?part=secondary           │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼  When secondary responds (another 1–2+ seconds)
    │
│   • Bento section (identity, momentum, today engine, etc.) gets data     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Net effect:** First meaningful paint is gated on the **critical** API response. Until then the user only sees the skeleton. Then **secondary** runs sequentially after critical, so the full dashboard (bento, identity, momentum) appears only after both requests finish.

---

## 2. Server-side bottlenecks

### 2.1 Dashboard page (`app/(dashboard)/dashboard/page.tsx`)

- **`export const dynamic = "force-dynamic"`**  
  Disables static/cache; every dashboard visit hits the server and runs auth + render. Comment says it avoids a “white empty page” on post-login redirect; the cost is no caching.

- **Auth before shell**  
  `createClient()` then `getUser()` block the server render. Until that completes, the shell (and thus the client) doesn’t start.

### 2.2 API route preamble (`app/api/dashboard/data/route.ts`)

Before building the critical response, the handler runs **sequentially**:

| Step | What | Cost |
|------|------|------|
| 1 | `createClient()` | 1× Supabase client (cookies, etc.) |
| 2 | `getUser()` | 1× auth round-trip |
| 3 | `ensureUserProfileForSession(user)` | 1× `users` select + 0–1× insert (user passed in, no extra getUser) |
| 4 | `void ensureIdentityEngineRows(user.id)` | Fire-and-forget; 2× upserts don’t block the response |

So before the main `Promise.all` for critical: **getUser()** is called **once** in the route. The main cost is the blocking **ensureUserProfileForSession** (DB read + possible insert). Only after that does the large `Promise.all` for critical start.

### 2.3 Critical response – size and duplicate work

`criticalResponse()` runs a single `Promise.all` with **20+ functions**, then **sequentially** runs `getTodaysTasks` and `getTodayEngine`. Many calls hit Supabase. Even in parallel, the slowest call sets the lower bound for the response time.

**Duplicate work in critical (verified in code):**

- **Tasks for today**
  - The route calls **`getCarryOverCountForDate(dateStr)`** in the big `Promise.all`, then **`getTodaysTasks(dateStr, taskMode)`** after (which **also** computes and returns `carryOverCount`). So carry-over count is derived twice.
  - **`getEnergyBudget(dateStr)`** does its own Supabase queries for **completed** and **incomplete** tasks for the same day. So the **tasks** table for today is hit at least **twice** (getTodaysTasks + getEnergyBudget).
  - Net: **tasks for the same date loaded 2×**, **carryOverCount** computed 2×.

- **daily_state for today**
  - **`getDailyState(dateStr)`** in the main `Promise.all`.
  - **`getEnergyBudget(dateStr)`** runs its own `daily_state` select (inside `unstable_cache` callback).
  - **`getTodayEngine(dateStr, preFetched)`** is called with preFetched (so it does *not* call getMode/getTodaysTasks again), but it still runs an **internal** `supabase.from("daily_state").select(...).eq("date", dateStr)` for brain mode/headroom.
  - So **daily_state for today is read 3×** in one critical request (getDailyState, getEnergyBudget, getTodayEngine internal).

- **getTodayEngine**
  - With `preFetched` it skips getMode/getTodaysTasks but still does: getBehaviorProfile(), user_streak query, and the daily_state query above. So it remains a composite call and its inputs (daily_state) are still duplicated.

So the critical response does a lot of work and repeats the same logical data (tasks, daily_state) multiple times. That increases DB load and latency.

### 2.4 Secondary response – again heavy and duplicate

- **getTodayEngine(dateStr)** is called **again** (already run in critical).
- **getDailyState(dateStr)** and **getDailyState(yesterdayStr)** are called again (lines 308–309), although similar data was already in critical.
- **getEnergyBudget(dateStr)** is called again at the end (line 318), so daily_state + tasks + calendar_events are fetched again.

So secondary re-does a lot of work that critical already did, and adds many more calls (identity, momentum, heatmap, report, strategy, etc.). Dynamic imports in secondary (`import("@/app/actions/...")`) add module resolution cost on top of the actual work.

### 2.5 Bootstrap vs critical overlap

- **BootstrapProvider** (layout): `getAppBootstrap()` runs `getXP`, `getUserEconomy`, `getDailyState(todayStr)`, `getUserPreferencesOrDefaults`.
- **Critical** also runs `getDailyState(dateStr)`, `getXP`, `getUserEconomy`, `getUserPreferencesOrDefaults`.

So on a fresh load, **daily state, XP, economy, and preferences** are loaded both by bootstrap (for layout/global state) and by the dashboard API. That’s duplicate work and extra latency from the user’s perspective.

---

## 3. Client-side bottlenecks

### 3.1 Data flow and cache

- **DashboardDataProvider** starts **preload immediately** on mount (`useEffect` → `preloadDashboard()` with no delay). So critical + secondary start as soon as the layout is active.
- **DashboardClientShell** reads `useDashboardData()`. If **cache already has critical**, it uses it. If **cache is loading** (`loadingCritical`), it shows skeleton and does **not** start a second fetch. Otherwise it calls **`preloadDashboard()`** (reusing the provider’s single in-flight load) or, if no provider, fetches **critical and secondary in parallel**.
- So duplicate in-flight requests are largely avoided. First paint is still gated on **critical** arriving (skeleton until then); full bento on **secondary**.

### 3.2 Critical vs secondary and first paint

- The shell (or provider preload) fires **critical and secondary in parallel**. Total time to full dashboard is roughly max(critical, secondary) plus client render.
- So total time to “full” dashboard ≈ **critical latency + secondary latency** (plus any client render cost). There is no overlapping of these two requests from the shell’s perspective (even if the provider preload runs in parallel with something else).

### 3.3 Large component tree and static imports

- **DashboardClientShell** imports many components directly (HQHeader, BrainStatusCard, CommanderHomeHero, SciFiPanel, etc.). Only some cards are dynamic (IdentityBlock, MomentumScore, TodayEngineCard, etc.) with loading placeholders.
- The initial JS bundle for the dashboard is still sizable; hydration and first render have to process the full tree. Dozens of dynamic imports for heavier cards help code-split but don’t reduce the number of client fetches or the critical path for data.

### 3.4 No streaming or partial data

- The UI does not show “partial” dashboard data. It’s either skeleton (no critical) or full above-the-fold content (critical). Then secondary fills the bento. There’s no incremental rendering (e.g. show hero + top strip as soon as a minimal subset of critical is available).

---

## 4. Summary: why it feels slow

| Cause | Impact |
|-------|--------|
| **force-dynamic** | No caching; every visit hits server and runs full auth + API. |
| **API preamble** | createClient + getUser + ensureUserProfile block before the main Promise.all. |
| **Duplicate work in critical** | Tasks 2–3×, daily_state 3–4×, getTodayEngine + getTodaysTasks + getEnergyBudget overlap. |
| **Duplicate work in secondary** | getTodayEngine, getDailyState, getEnergyBudget run again. |
| **First paint gated on critical** | Skeleton until critical; bento when secondary arrives (requests can be in parallel). |
| **Bootstrap + critical overlap** | Same data (XP, economy, daily state, preferences) loaded in layout and in dashboard API. |
| **Heavy critical Promise.all** | 20+ parallel calls; slowest one and DB load set response time. |
| **Heavy secondary** | Many more actions + dynamic imports; re-runs getTodayEngine, getDailyState, getEnergyBudget. |
| **No request-scoped cache** | Same functions (e.g. getDailyState, getTodaysTasks) called multiple times in one request without sharing results. |

---

## 5. Recommended improvements (priority order)

### 5.1 Reduce duplicate work in one request (high impact)

- **Critical**
  - Call **getTodaysTasks** once. Derive `todaysTasks` and `carryOverCount` from that result (or from a single “today context” that getTodayEngine can return). Remove the second `getTodaysTasks` and avoid getEnergyBudget loading tasks again for the same purpose if possible.
  - Load **daily_state for today** once (e.g. `getDailyState(dateStr)`), and pass it into getMode, getTodayEngine, and getEnergyBudget (or a shared “today context”) so they don’t each fetch it again.
- **Secondary**
  - Do **not** call getTodayEngine, getDailyState, getEnergyBudget again. Reuse the same date and, if possible, the same in-memory results from critical (e.g. pass through or re-expose from a single “dashboard context” built once).
- Implement a **request-scoped “today context”** (tasks + daily_state + optional mode/energy summary) built once and reused by critical and, where needed, by secondary.

### 5.2 Trim API preamble (medium impact)

- Call **getUser()** once in the route; pass `user` into ensureUserProfileForSession and ensureIdentityEngineRows (or refactor them to accept `userId` and optional email) so they don’t call getUser again.
- Consider making **ensureIdentityEngineRows** conditional (e.g. only when identity engine is first used or behind a feature flag) or moving it off the critical path (e.g. fire-and-forget after first response) so the first byte isn’t blocked by 2 upserts.

### 5.3 Single dashboard data request or parallel critical + secondary (high impact)

- **Option A:** One endpoint that returns both “above-the-fold” and “bento” data in one response (with one shared “today context” and no duplicate getTodayEngine/getDailyState/getEnergyBudget). Client parses once and renders in two phases if desired.
- **Option B:** Keep two parts but start **secondary in parallel** with critical (e.g. shell fires both on mount). Show skeleton only for the parts that need critical; show bento when secondary arrives. Reduces “critical + secondary” sequential wait.

### 5.4 Align bootstrap and dashboard data (medium impact)

- Avoid loading the same data twice (daily state, XP, economy, preferences). For example:
  - Have the dashboard API be the source of truth for “dashboard + today” and expose a minimal bootstrap from it, or
  - Have bootstrap load only what the layout needs (e.g. preferences, theme) and let the dashboard API provide XP, economy, daily state for the dashboard page only.

### 5.5 Cache and dynamic (lower impact, more care)

- Consider relaxing **force-dynamic** for the dashboard page if you can make post-login redirect show a loading state instead of “white page” (e.g. loading.tsx + client fetch). Then you can use short revalidation or ISR for the shell.
- Use **unstable_cache** (or similar) for heavy, rarely-changing data in the dashboard API (e.g. strategy, identity engine) with short TTL and a key that includes user + date where relevant.

### 5.6 Client: use provider cache and avoid double fetch (medium impact)

- Make **DashboardClientShell** prefer **DashboardDataProvider**’s cache: if the provider has already started or finished loading critical/secondary, the shell should reuse that instead of firing its own fetchCritical in useEffect. That avoids duplicate in-flight requests and can make first paint faster when the preload wins.
- Optionally start **secondary** from the provider in parallel with critical (same as 5.3 Option B) so both run as soon as the user hits the dashboard.

---

## 6. Files to change (concise)

| Goal | Files |
|------|--------|
| Remove duplicate tasks/daily_state in API | `app/api/dashboard/data/route.ts` |
| Reuse user in preamble | `app/api/dashboard/data/route.ts`, `app/actions/auth.ts`, `app/actions/identity-engine.ts` |
| Single “today context” or pass-through | New helper or in `route.ts`; optionally `app/actions/dcic/today-engine.ts` |
| Parallel critical + secondary or single endpoint | `app/api/dashboard/data/route.ts`, `components/dashboard/DashboardClientShell.tsx` |
| Shell uses provider cache / no double fetch | `components/dashboard/DashboardClientShell.tsx`, `components/providers/DashboardDataProvider.tsx` |
| Bootstrap vs dashboard overlap | `app/actions/bootstrap.ts`, layout, dashboard API |

Implementing 5.1 and 5.2 (and optionally 5.3) should give the largest perceived improvement; then 5.4 and 5.6 to avoid duplicate work and duplicate requests.

---

## 7. What else we can do (after the first round)

### 7.1 Defer ensureIdentityEngineRows (quick win)

- Run `ensureIdentityEngineRows(user.id)` **fire-and-forget** (don’t await) so the first byte isn’t blocked by the 2 upserts. Rows are created a moment later; first load is slightly faster.
- **Risk:** Very low. Identity engine tables are “ensure exists”; a short delay is acceptable.

### 7.2 Provider preload earlier + avoid double fetch (medium win)

- **Start preload sooner:** Run preload after a short delay (e.g. 200–300ms) or immediately when the provider mounts, instead of 1000–1500ms. When the user navigates to `/dashboard`, the cache is more likely to already have (or be loading) data.
- **Expose loading state:** Add `loadingCritical: boolean` (and optionally `loadingSecondary`) to the context. When the shell mounts and sees “no critical but loadingCritical”, it shows the skeleton and **does not** start its own fetch; it waits for the provider’s result. That avoids two in-flight critical requests and can make first paint faster when the provider’s preload wins.

### 7.3 Single combined endpoint (high impact, more work)

- Add `GET /api/dashboard/data` (no `part`) or `?part=all` that builds **critical** and **secondary** in one handler: one “today context” (state, tasks, mode, energy budget), reuse it for both payloads, return `{ critical, secondary }`.
- Client calls this once; first paint uses `critical`, bento uses `secondary`. One round-trip, no duplicate getTodayEngine/getDailyState/getEnergyBudget between two requests.
- **Trade-off:** Response is larger and takes longer than “critical only”; but total time to full dashboard can be lower than critical + secondary sequentially (or even parallel) because the server does the work once.

### 7.4 Bootstrap vs dashboard overlap (medium impact)

- **Option A:** On the dashboard route (or layout when path is dashboard), don’t run the full bootstrap; have the dashboard API be the source for XP, economy, daily state for that page. Layout still needs preferences (theme) — e.g. bootstrap loads only preferences when on dashboard, or we pass them from the dashboard response into a small context.
- **Option B:** Keep bootstrap as-is but have the dashboard API **skip** getXP, getUserEconomy, getDailyState, getUserPreferencesOrDefaults when they’re already in bootstrap (e.g. pass them from client). That’s awkward because the API doesn’t have the bootstrap result.
- **Practical:** Prefer Option A: bootstrap loads only what the layout needs (e.g. preferences + maybe user id); dashboard page fetches dashboard data (which includes XP, economy, daily state) and doesn’t duplicate bootstrap’s full load when we’re on dashboard.

### 7.5 Cache heavy secondary data (medium win)

- Use **unstable_cache** (or similar) in the actions that feed **secondary**: e.g. strategy, identity engine, heatmap, with keys like `dashboard-secondary-strategy-{userId}-{quarter}` and short TTL (e.g. 60s). Repeat visits or quick reopens get cached data and secondary responds faster.
- **Care:** Invalidate or use short TTL so updates (e.g. new strategy) show soon.

### 7.6 Defer non-critical work in secondary (small win)

- **upsertDailyAnalytics(dateStr)** in secondary doesn’t need to block the JSON response. Run it fire-and-forget after starting the response, or in a separate microtask, so the secondary payload is sent as soon as the rest of the data is ready.
- Same for other “write” or non-essential work in secondary if any.

### 7.7 Reduce dynamic imports in secondary (small win)

- Replace `import("@/app/actions/...").then(m => m.fn())` with static imports at the top of the route so the module is resolved once. Saves per-request resolution cost; may slightly increase cold start. Measure to confirm.

### 7.8 Relax force-dynamic (experimental)

- Remove `force-dynamic` from the dashboard page and rely on `loading.tsx` + client fetch so the shell is static/cached. Ensures post-login redirect still shows loading state (e.g. skeleton) instead of a white page. Enables short revalidation or ISR for the shell if needed later.
