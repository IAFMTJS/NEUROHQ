# NeuroHQ — Execution Plan (Plan Mode)

**Purpose:** Trackable checklist of all implementation steps from [ARCHITECTURE_IMPROVEMENT_PLAN.md](./ARCHITECTURE_IMPROVEMENT_PLAN.md).  
**Usage:** Work in priority order (P0 → P1 → P2 → P3). Check off steps as done.

---

## P0 — State correctness & production safety

### §13 — Task state after app close (completed tasks reappear)

- [x] **13.1** Identify hydration entry points: find every place that writes `tasksByDate` from snapshot (`StoreHydrator.tsx`, `MissionsProvider.tsx`).
- [x] **13.2** Exclude “today” when hydrating from snapshot: when applying snapshot missions, skip key `getTodayKey()`; do not call `setTasksForDate(today, ...)` from snapshot.
- [x] **13.3** Ensure order of operations: rehydrate Zustand first, then apply snapshot (skip today); today filled by `useTasksBootstrap(today)` or server fetch.
- [x] **13.4** Ensure today is always refreshed on app load: run tasks-bootstrap for today so server is final source of truth for today.
- [x] **13.5** Test: complete task → close app → reopen → task stays completed.
- [x] **13.6** Test: open app offline with old snapshot; today from persisted store or show offline state (no stale snapshot overwrite for today).

### §11 — Assistant (and nav) hidden on production

- [x] **11.1** Define gate: add `NEXT_PUBLIC_ASSISTANT_ENABLED` (env var; true only in dev/staging).
- [x] **11.2** Nav: in `BottomNavigation.tsx`, filter out Assistant link when gate is false.
- [x] **11.3** Use same gate in dashboard CTAs and keyboard shortcut “A” (if any).
- [ ] **11.4** Route guard: in `app/(dashboard)/assistant/page.tsx` (or layout), redirect to dashboard when gate is false.
- [x] **11.5** API guard: in `app/api/assistant/message/route.ts`, return 403/404 when feature disabled.
- [x] **11.6** Document in README or env.example: when to set `NEXT_PUBLIC_ASSISTANT_ENABLED`.

---

## P1 — Data consistency

### §9 — Backlog: max 30 days back, sort newest-first

- [x] **9.1** In `getBacklogTasks(todayDate)`: compute `cutoffDate = today - 30 days`.
- [x] **9.2** Filter: include only tasks where `(due_date is null OR due_date < today) AND (due_date is null OR due_date >= cutoffDate)`.
- [x] **9.3** Sort: `.order("due_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })`.
- [x] **9.4** Add `BACKLOG_HORIZON_DAYS = 30` constant (or similar) for future tuning.
- [x] **9.5** Verify frontend backlog list still works (no “load more” / scroll assumptions for oldest-first).

### §2 — Settings: user-specific control and consistency

- [x] **2.1** Audit all settings surfaces: document every place that reads payday, personality, usual_days_off, day_off_mode, budget_period (server vs client vs merge).
- [x] **2.2** Implement Settings Read-Through: context or React Query that fetches user preferences + user budget fields once per session/on focus, exposes to app, invalidates on save.
- [x] **2.3** Narrow `client-persisted-payday` to optimistic UI only; after sync, replace with server state in read-through.
- [x] **2.4** Ensure all mutations (PaydayCard, BudgetSummaryCard, preferences page) call server actions and then invalidate read-through + `router.refresh()`.
- [ ] **2.5** Optional: use `user_preferences.updated_at` to detect staleness and force refetch when client cache is older.

---

## P2 — Critical actions, budget, snapshot

### §4 — Undo for critical actions (“grote oepsie”)

- [x] **4.1** Define critical actions: `setPaydayReceivedToday` (undo = restore previous `last_payday_date`); document payload and inverse for each.
- [x] **4.2** Implement Undo Registry (client): store `{ id, actionType, payload, expiresAt }`; toast “Loon gehad geregistreerd. [Undo]” with 15–30 s TTL.
- [x] **4.3** Add server action `undoPaydayReceived(previousLastPaydayDate: string | null)` with auth and validation.
- [x] **4.4** On Undo click: call inverse action, remove registry entry, refresh.
- [ ] **4.5** Optional: minimal `user_actions_audit` table for support (V2).

### §5 — Budget cards: optimisation and mutual consistency

- [x] **5.1** Map data flow per card: document props, use of `usePersistedPayday` / `usePendingBudgetSnapshot`, server props; identify conflicts.
- [x] **5.2** Introduce Budget Dashboard Context (or single React Query): load getFinanceState + payday + optional pending; expose periodStart, periodEnd, periodLabel, budgetRemainingCents, daysUntilNextIncome, etc.
- [x] **5.3** Cards consume from context/query; use persisted/pending only for optimistic UI before sync.
- [x] **5.4** Unify optimistic flow: on “Vandaag loon gehad” / payday change, update optimistic → call server → on success invalidate context and clear overlay.
- [x] **5.5** RecurringBudgetCard and ProgressionPrimeBudgetCard use same period/currency from shared context.
- [x] **5.6** Single fetch per page; no duplicate getFinanceState/getBudgetPeriodBounds.

### §12 — Snapshot coverage: insights and settings

- [x] **12.1** Verify report/Insights page: does it read from DailySnapshot.analytics on first paint? If not, add snapshot-first render path.
- [x] **12.2** If report uses different API, add snapshot slice and preload step for it.
- [x] **12.3** Add minimal SettingsSnapshot (theme, compact_ui, push_personality_mode, usual_days_off, …) to DailySnapshot type.
- [x] **12.4** Add `fetchSettings` step in daily bootstrap; call API that returns public preference fields only.
- [x] **12.5** Settings page: first render from snapshot if available; then fetch full preferences and replace.
- [x] **12.6** Ensure preloadPages includes `/settings` and insights route.
- [x] **12.7** If new snapshot fields added: bump `LATEST_SNAPSHOT_VERSION` and handle old snapshots (merge/ignore new keys).

---

## P3 — Missions, rank, hobby, PWA, help

### §8 — Mission page: routine / scheduled task schedule

- [x] **8.1** Model routine tasks: use recurrence + optional `is_routine` or “monthly min 1”; no new table for V1.
- [x] **8.2** New server function `getRoutineTasksWithSuggestions(dateStr)`: return routine tasks + which days covered + suggested days per task.
- [x] **8.3** Best-day algorithm in `lib/routine-suggestions.ts`: reuse getWeekPlannedLoad, day-off, strategy; score days, return top 2–3 per task.
- [x] **8.4** New tab “Routine” / “Schema” on mission page; list routine tasks with “Do by …” / “Best days: …”.
- [x] **8.5** “Plan for [date]” uses existing reschedule/schedule API.
- [x] **8.6** Reuse existing task components where possible.

### §10 — Mission rank: better automatic determination

- [x] **10.1** Review UMS formula in `missions-performance.ts` with product; tune weights if needed (e.g. diversity, hobby commitment).
- [x] **10.2** Stabilise inputs: load strategy, pressure, behavior profile once per request; avoid re-fetch in loops.
- [x] **10.3** Consider caching getDecisionBlocks / UMS inputs for (userId, dateStr) with short TTL.
- [x] **10.4** Document rank thresholds in `lib/mission-difficulty-rank.ts`; make configurable if needed.
- [x] **10.5** Optional: store computed rank on task or in cache for consistent display across dashboard and mission page.
- [x] **10.6** Optional: “why this rank” explainability (V2).

### §7 — Hobby commitment: extend scope and behaviour

- [x] **7.1** Centralise hobby config: single source (e.g. `lib/hobby-commitment.ts`) for HOBBY_KEYS; align DB constraint and tasks.hobby_tag CHECK.
- [x] **7.2** Add language, creative (and any new keys) to pool and BehaviorProfileSettings sliders.
- [x] **7.3** Ensure behavior_profile.hobby_commitment has all keys (default 0); tasks.hobby_tag allows same set (migration if needed).
- [x] **7.4** Master mission pool and buildHobbySuggestion / createBehaviorMission iterate over all keys with non-zero commitment.
- [x] **7.5** hobby-commitment-decay: run for all keys; “last completed hobby task per tag” for every key.
- [x] **7.6** Optionally expose “last done” per hobby in settings or XP page.
- [x] **7.7** BehaviorProfileSettings: one slider per hobby key; optional “See missions with this hobby tag” link.
- [x] **7.8** Optional: commitment history (weekly snapshot) for “commitment over time” (V2).

### §6 — PWA app icon badges

- [x] **6.1** Feature detection: check `navigator.setAppBadge`; no-op when unavailable.
- [x] **6.2** Define badge count source: e.g. incomplete tasks for today; hook/function that returns count; cap at 99.
- [x] **6.3** Call `navigator.setAppBadge(count)` when count changes (e.g. after task completion, when today’s tasks load); only when document visible or in SW.
- [x] **6.4** In `public/sw.js`: on push, set badge from payload if present; on notificationclick, open app and clear/set badge.
- [x] **6.5** Root layout or dashboard: on app visible, set badge to current live count (or clear).
- [x] **6.6** Document badge behaviour in help or settings.

### §3 — Help page: structure and maintainability

- [x] **3.1** Audit current help page: list sections, map to routes/features; identify outdated or missing sections.
- [x] **3.2** Introduce help content structure: data/MDX (e.g. `content/help/sections.ts` or `*.mdx`) with title, description, steps, “See also” links.
- [x] **3.3** Render help page by iterating over structure (one entry per section).
- [x] **3.4** Add “last updated” or version (per section or whole help).
- [x] **3.5** In CONTRIBUTING or README: feature changes that affect user behaviour should include help update.

---

## Summary by priority

| Priority | Section | Theme | Steps |
|----------|---------|--------|-------|
| P0 | §13 | Task state after close | 6 |
| P0 | §11 | Assistant hidden in prod | 6 |
| P1 | §9 | Backlog 30 days + sort | 5 |
| P1 | §2 | Settings user-specific | 5 |
| P2 | §4 | Undo “grote oepsie” | 5 |
| P2 | §5 | Budget cards | 6 |
| P2 | §12 | Snapshot insights/settings | 7 |
| P3 | §8 | Routine tab + best days | 6 |
| P3 | §10 | Mission rank | 6 |
| P3 | §7 | Hobby commitment | 8 |
| P3 | §6 | PWA badges | 6 |
| P3 | §3 | Help page | 5 |

**Total checkable steps:** 71

---

*Execution plan for [ARCHITECTURE_IMPROVEMENT_PLAN.md](./ARCHITECTURE_IMPROVEMENT_PLAN.md). Update this file as steps are completed.*
