# NeuroHQ — Architecture-Level Improvement Plan

**Document owner:** Lead Systems Architect  
**Scope:** Full system improvements derived from product/UX issues.  
**Approach:** Principal-engineer level; stable product design, not tactical patches.

---

## 1. Executive summary

The following plan addresses 11 improvement areas by introducing clear **ownership of user-specific settings**, **undo/audit for critical actions**, **snapshot and state consistency**, **mission/backlog/routine semantics**, **budget card orchestration**, **PWA badging**, **hobby commitment extension**, **help and assistant gating**, and **production feature visibility**. Each section states the problem, the architectural direction, and concrete implementation steps.

---

## 2. Settings: user-specific control and consistency

### 2.1 Problem

Settings changes (e.g. new “loon ontvangen” date, personality, payday day) must be **user-specific** and consistently reflected everywhere. Today, payday is stored in `users` (server) and `client-persisted-payday` (localStorage); preferences live in `user_preferences`. There is no single “settings authority” and no guarantee that all surfaces (budget cards, dashboard, strategy) read the same source after a change.

### 2.2 Architectural direction

- **Single source of truth per setting:** Server (Supabase) is the authority; client state is cache with clear invalidation.
- **User-scoped only:** All settings are keyed by `user_id`; no device-only or anonymous overrides without explicit design.
- **Reactive refresh:** After any settings mutation, trigger a minimal refresh path (e.g. React Query invalidation, or `router.refresh()` with scoped revalidation) so dashboard, budget, and strategy see the update without full reload.

### 2.3 Implementation steps

1. **Audit all settings surfaces**  
   List every place that reads: payday (last_payday_date, payday_day_of_month), personality (push_personality_mode), usual_days_off, day_off_mode, budget_period, etc. Document whether they read from server, from persisted client, or from both with a merge rule.

2. **Define a Settings Read-Through layer**  
   - Server: keep `user_preferences` and `users` (payday, budget columns) as the only persisted source.  
   - Client: introduce a small **settings context or React Query layer** that (a) fetches user preferences + user budget fields once per session or on focus, (b) exposes them to the app, (c) invalidates on save so all consumers re-read from server.  
   - Deprecate or narrow the role of `client-persisted-payday` to “optimistic UI only” (show immediately on “Vandaag loon gehad”, then sync and replace with server state).

3. **Ensure mutations always update server first**  
   All preference/budget setting mutations (preferences page, PaydayCard, BudgetSummaryCard, etc.) must call the same server actions (`savePrefs`, `updateBudgetSettings`, `setPaydayReceivedToday`). After success, invalidate the settings read-through and run `router.refresh()` (or equivalent) so server components and data fetchers see new data.

4. **Optional: settings version or `updated_at`**  
   Store `user_preferences.updated_at` (and optionally a similar marker for payday) and use it to detect staleness; if client cache is older than server, force refetch on next load.

---

## 3. Help page: structure and maintainability

### 3.1 Problem

The help page is a large static React page. Updating it is manual and error-prone; content can drift from actual UI and behaviour.

### 3.2 Architectural direction

- Treat help as **documentation that must stay in sync with the product**.  
- Prefer a **structured content model** (sections, steps, screenshots/placeholders) so that adding or changing a feature implies a single place to update help.  
- Keep implementation in-repo (no CMS dependency) but make it easy to extend.

### 3.3 Implementation steps

1. **Audit current help page**  
   List all sections (tasks, backlog, calendar, streaks, assistant, settings, etc.) and map each to app routes or features. Identify outdated or missing sections.

2. **Introduce a help content structure**  
   - Move copy into a **data structure or MDX** (e.g. `content/help/sections.ts` or `content/help/*.mdx`) with sections keyed by topic.  
   - Each section: title, short description, steps (optional), “See also” links to routes.  
   - Render the help page by iterating over this structure so adding a new section is one entry + optional route link.

3. **Add “last updated” or “version”**  
   Either per section or for the whole help, so support and future you can see when help was last aligned with the app.

4. **Document ownership**  
   In CONTRIBUTING or README, state that feature changes should include a help update when they affect user-facing behaviour (tasks, budget, assistant, settings).

---

## 4. Undo for critical actions (“grote oepsie”)

### 4.1 Problem

Irreversible or high-impact actions (e.g. “Vandaag loon gehad” by mistake) have no undo. Users cannot restore the previous state without manual support or DB access.

### 4.2 Architectural direction

- **Critical actions** are those that change user or budget state in a way that is hard to reverse (e.g. payday received, possibly future: “reset week”, “archive all backlog”).  
- Introduce an **undo system**: after such an action, store a small **undo token** (previous value + action type) in memory and optionally in a short-lived table or localStorage; show a toast/snackbar with “Undo” for a time window (e.g. 10–30 s).  
- Undo executes the inverse mutation (e.g. set `last_payday_date` back to previous value) and then invalidates caches.

### 4.3 Implementation steps

1. **Define the set of critical actions**  
   - `setPaydayReceivedToday` (undo = restore previous `last_payday_date`).  
   - Optionally: bulk complete, bulk delete, or future “reset period” actions.  
   For each: define (a) the mutation, (b) the payload to store for undo (e.g. previous last_payday_date), (c) the inverse mutation.

2. **Implement an Undo Registry (client)**  
   - After a critical action, push an entry `{ id, actionType, payload, expiresAt }` into a small store (e.g. Zustand slice or React context).  
   - Show a toast: “Loon gehad geregistreerd. [Undo]” with a 15–30 s TTL.  
   - If user clicks Undo, call the inverse server action with the stored payload, then remove the entry and refresh.

3. **Server support for undo**  
   - Add an action e.g. `undoPaydayReceived(previousLastPaydayDate: string | null)` that sets `users.last_payday_date` to the given value (with auth and validation).  
   - Do not store full history in DB for V1; undo is “one step back” from the last critical action only.

4. **Optional: audit log**  
   For future compliance or support, consider a minimal `user_actions_audit` table (user_id, action_type, payload, created_at) and write critical actions there; undo can remain in-memory only for V1.

---

## 5. Budget cards: optimisation and mutual consistency

### 5.1 Problem

Budget cards (PaydayCard, RecurringBudgetCard, ProgressionPrimeBudgetCard, BudgetQuickLogCard, BudgetAchievementsCard) are not fully optimised and do not always “work with each other”: different sources of truth (server vs client-pending vs persisted payday) can show conflicting numbers or periods.

### 5.2 Architectural direction

- **Single budget “context” per view:** One place that resolves: period bounds, payday, income sources, remaining amount, discipline state. All cards in that view consume from that context (or from the same React Query / server cache key).  
- **Clear precedence:** Server (finance state + user settings) is truth; `client-pending-budget` and `client-persisted-payday` are **optimistic overlays** with a short TTL and explicit “synced” state; when synced, discard overlay and show server data.  
- **No duplicate fetches:** Dashboard and budget page should not each trigger separate finance-state fetches; one fetch (or one cached query) per layout or page, then pass down.

### 5.3 Implementation steps

1. **Map data flow per card**  
   For each budget card, document: which props it receives, whether it uses `usePersistedPayday`, `usePendingBudgetSnapshot`, server-only props, or a mix. Identify conflicting sources (e.g. period label from server, “days until next income” from persisted payday).

2. **Introduce a Budget Dashboard Context (or query)**  
   - One provider or one React Query key that loads: `getFinanceState` (or equivalent), payday settings, and optionally pending snapshot.  
   - Expose: periodStart, periodEnd, periodLabel, budgetRemainingCents, daysUntilNextIncome, lastPaydayDate, paydayDayOfMonth, incomeSources, discipline metrics.  
   - Cards read from this context (or from the same query); no card directly calls `usePersistedPayday` for “authoritative” display—only for optimistic UI before sync.

3. **Unify optimistic flow**  
   When user clicks “Vandaag loon gehad” or changes payday day: (a) update optimistic state (pending + persisted payday), (b) call server, (c) on success invalidate budget context/query and clear optimistic overlay for that field so the next read comes from server.

4. **RecurringBudgetCard and ProgressionPrimeBudgetCard**  
   Ensure they use the same period bounds and currency as the rest (from the shared context). Recurring templates and progression rank should be computed from the same finance state and strategy data.

5. **Performance**  
   Avoid duplicate getFinanceState or getBudgetPeriodBounds calls on the same page; use a single fetch and cache (e.g. React Query with a stable key like `budget-dashboard-${userId}` and invalidation on mutation).

---

## 6. PWA app icon badges

### 6.1 Problem

PWA icon badges (e.g. count of pending missions or unread items) are not implemented. The Badging API exists for installed PWAs and improves engagement.

### 6.2 Architectural direction

- Use the **Badging API** (`navigator.setAppBadge(count)` / `clearAppBadge()`) when the app is running and when receiving push notifications.  
- Define a **badge policy**: what number to show (e.g. today’s incomplete mission count, or unread notifications), when to clear (e.g. on open, or when count is 0).  
- Service worker: when a push notification is displayed, set badge to 1 or to the count from the payload; when user opens the app from the notification, clear or update badge.

### 6.3 Implementation steps

1. **Feature detection and fallback**  
   Check `navigator.setAppBadge`; if not available (e.g. older browsers), no-op. Only set badge when the document is visible or when handling push (in SW) so we don’t leave stale badges.

2. **Badge count source**  
   Decide the canonical source: e.g. “incomplete tasks for today” from the same data that drives the dashboard. Expose a small function or hook that returns “badge count” and call `navigator.setAppBadge(count)` when that count changes (e.g. after task completion or when today’s tasks load). Cap at 99.

3. **Service worker**  
   In `public/sw.js`, on push notification: if the payload includes a count or “badge” field, call `event.waitUntil(self.setAppBadge(...))` if available. On `notificationclick`, open the app and clear badge (or set to 0) so the user sees a clean icon after engaging.

4. **Clear on open**  
   In the root layout or dashboard, when the app becomes visible and the user has “seen” the main view, optionally clear the badge or set it to the current live count so the badge reflects reality.

5. **Documentation**  
   Document badge behaviour in the help or settings (e.g. “The app icon can show the number of missions for today”).

---

## 7. Hobby commitment: extend scope and behaviour

### 7.1 Problem

Hobby commitment is currently limited (e.g. fitness, music; DB: `hobby_tag` on tasks, `behavior_profile.hobby_commitment`). It must be “uitgebreid” (extended): more hobbies, clearer impact on missions and suggestions, and possibly UI to manage and view commitment over time.

### 7.2 Architectural direction

- **Extensibility:** Allow more hobby keys (e.g. language, creative are already in schema; add others as needed) and drive them from a single config (e.g. `HOBBY_KEYS` in one place) so adding a new hobby is a config change + migration + UI.  
- **Behaviour:** Commitment continues to drive suggestion text, mission picking (e.g. master mission pool “identity_courage_hobby” slot), and decay after inactivity; extend decay and suggestion logic so all keys are first-class.  
- **Visibility:** Users should see their commitment per hobby and, optionally, a simple history or “last done” so they understand why certain missions are suggested.

### 7.3 Implementation steps

1. **Centralise hobby config**  
   - Single source of truth for hobby keys (e.g. `lib/hobby-commitment.ts` or `types/behavior-profile.ts`) and ensure DB constraint and `hobby_tag` CHECK match.  
   - Add any new keys (e.g. language, creative) to the pool and to `BehaviorProfileSettings` sliders.

2. **Extend behavior_profile and tasks**  
   - Ensure `behavior_profile.hobby_commitment` is a JSONB object with all keys; default new keys to 0.  
   - Ensure `tasks.hobby_tag` allows the same set (migration if needed).  
   - Master mission pool and behavior suggestions (e.g. `buildHobbySuggestion`, `createBehaviorMission`) should iterate over all keys with non-zero commitment.

3. **Decay and “last done”**  
   - `hobby-commitment-decay` cron already decays by tag; ensure it runs for all keys and that “last completed hobby task per tag” is computed for every key.  
   - Optionally expose “last done” per hobby in settings or XP page so users see why commitment might have dropped.

4. **UI in settings**  
   - In BehaviorProfileSettings, show one slider per hobby key (fitness, music, language, creative, …). Add short labels and, if desired, a link to “See missions with this hobby tag”.

5. **Optional: commitment history**  
   - For a later phase, consider storing a lightweight history (e.g. weekly snapshot of hobby_commitment) so we can show a simple “commitment over time” or explain decay in the UI.

---

## 8. Mission page: routine / scheduled task schedule (“minstens 1x per maand”)

### 8.1 Problem

Besides “Missions” and “Calendar”, users need a **routine/schedule** view: things that must be done at least once per month (or per week), with the app suggesting **best days** to do them in the current period.

### 8.2 Architectural direction

- **Routine tasks** are a semantic layer on top of tasks: recurrence (e.g. monthly) + optional “minimum frequency” (e.g. at least 1x per month). The app already has `recurrence_rule` and `recurrence_weekdays`; extend with a clear notion of “monthly minimum” or “routine” and a way to list them.  
- **Best-day suggestion:** Use existing signals (energy, load, strategy, day-off preferences) to rank days in the current week/month; suggest “best days” for each routine task (e.g. “Do this by Friday” or “Best: Mon, Wed”).  
- **New tab or section:** “Routine” (or “Schema”) alongside Missions and Calendar, showing routine tasks and suggested slots.

### 8.3 Implementation steps

1. **Model routine tasks**  
   - Option A: Use existing recurrence (e.g. `recurrence_rule: "monthly"`) and add an optional `routine_min_frequency` (e.g. “1 per month”) or a tag `is_routine: true`.  
   - Option B: New table `routine_templates` (user_id, title, period: week|month, min_count, domain, energy_estimate) and generate “instance” tasks from it.  
   - Prefer Option A first: tag existing recurring tasks as “routine” and interpret “monthly” + “at least 1” as routine; no new table for V1.

2. **API: list routine tasks and suggested days**  
   - New server function (e.g. `getRoutineTasksWithSuggestions(dateStr)`) that: (a) returns tasks that are “routine” (recurrence + optional flag), (b) for the current week or month, computes which days are already “covered” (task done or scheduled), (c) for uncovered routines, suggests best days using existing logic (getWeekPlannedLoad, day-off, energy, pressure).  
   - Return shape: e.g. `{ routineTasks: [...], suggestedDays: { [taskId]: string[] } }`.

3. **UI: Routine tab**  
   - New tab on the mission page: “Routine” or “Schema”.  
   - List routine tasks with “Do by …” or “Best days: …”. Allow “Plan for [date]” to schedule the task on a suggested day (calls existing reschedule/schedule API).  
   - Reuse existing task components where possible (e.g. same card, different context).

4. **Best-day algorithm**  
   - Reuse `getWeekPlannedLoad`, strategy allocation, and day-off logic. Score each day for “capacity” and “fit”; return top 2–3 days per routine task. Keep the algorithm in a single place (e.g. `lib/routine-suggestions.ts`) so it can be tuned later.

---

## 9. Mission backlog: max 30 days back, sort newest-first

### 9.1 Problem

Backlog currently returns tasks with `due_date < today` or null, ordered by `due_date` ascending and `created_at` ascending, limit 100. Requirements: **max 30 days back** (exclude tasks older than 30 days from today) and **sort newest-first** (so the most recently due or created appear first).

### 9.2 Architectural direction

- Backlog is “recent overflow”: things the user still cares about, not an unbounded history.  
- **Horizon:** Only include tasks whose `due_date` is either null or within the last 30 days (i.e. `due_date >= today - 30`). Older tasks are either auto-archived or excluded from backlog (product decision: exclude for now).  
- **Order:** Newest-first: primary sort by `due_date` descending (nulls last), then `created_at` descending so the most recent work appears at the top.

### 9.3 Implementation steps

1. **Change `getBacklogTasks(todayDate)`**  
   - Add a computed `cutoffDate = today - 30 days`.  
   - Filter: `(due_date is null) or (due_date >= cutoffDate)`. In Supabase: `.or(\`due_date.is.null,due_date.gte.${cutoffDate}\`)` and remove the current `.or(\`due_date.is.null,due_date.lt.${todayDate}\`)`; then add `.gte("due_date", cutoffDate)` for non-null due_date. Actually: backlog = incomplete, no parent, not deleted, and (due_date is null OR (due_date < today AND due_date >= cutoff)). So:  
     - `due_date.is.null,due_date.lt.${todayDate}` stays for “overdue or no date”,  
     - and add `.gte("due_date", cutoffDate)` for rows that have a due_date (so we exclude due_dates before cutoff).  
   - Simplest: `.or(\`due_date.is.null,and(due_date.lt.${todayDate},due_date.gte.${cutoffStr})\`)` or two filters: for null due_date include; for non-null require due_date >= cutoff and due_date < today.  
   - Implementation: filter where (due_date is null OR due_date < today) AND (due_date is null OR due_date >= cutoff). So:  
     `(due_date.is.null || due_date.lt.today) && (due_date.is.null || due_date.gte.cutoff)` → in Supabase: `.filter('due_date', 'or', 'is.null,lt.'+today).filter('due_date', 'or', 'is.null,gte.'+cutoff)` or use a single RPC if needed.  
   - **Sort:** `.order("due_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })`.  
   - Keep limit 100 or reduce to 50 if 30-day window is small.

2. **Migration / backfill**  
   No schema change required. Optionally: add a comment or a small “backlog_horizon_days” constant in code (e.g. 30) so it’s easy to change later.

3. **Frontend**  
   Backlog list already consumes `getBacklogTasks`; no change needed if the API contract (array of tasks) is unchanged. If you previously relied on “oldest first”, update any “load more” or scroll behaviour to match newest-first.

---

## 10. Mission rank: better automatic determination

### 10.1 Problem

Mission rank (S/A/B/C/D) should be determined more reliably and transparently. Currently UMS (Unified Mission Score) drives rank via `getMissionDifficultyRank`; the weights and inputs may need tuning and the rank should feel consistent to the user.

### 10.2 Architectural direction

- **Single ranking pipeline:** All “rank” or “priority” display for missions comes from one pipeline: inputs (strategy alignment, completion probability, ROI, energy match, pressure impact, recency/diversity) → UMS (or updated formula) → rank letter.  
- **Stability:** Rank should not flip randomly between loads; use deterministic inputs (e.g. same date, same strategy, same task metadata). Cache or memoize UMS per (taskId, date) where appropriate.  
- **Explainability (optional):** Store or expose a short “why this rank” (e.g. “High strategy alignment, good energy match”) so users can trust and learn from the system.

### 10.3 Implementation steps

1. **Review UMS formula**  
   In `app/actions/missions-performance.ts`, the current UMS = strategyAlignment×0.3 + completionProbability×0.2 + roi×0.2 + energyMatch×0.15 + pressureImpact×0.15. Review with product: do these weights match “what we want to prioritise”? Add or tune factors (e.g. “diversity”, “hobby commitment match”) if needed.

2. **Stabilise inputs**  
   Ensure strategy focus, pressure index, and behavior profile are loaded once per request and passed through; avoid re-fetching inside loops. Consider caching `getDecisionBlocks` or the UMS inputs for the same (userId, dateStr) with a short TTL so repeated calls (e.g. from dashboard and mission page) get the same ranking.

3. **Rank ladder consistency**  
   `lib/mission-difficulty-rank.ts`: ensure thresholds (e.g. S ≥ 0.85) are documented and, if needed, configurable. Optionally store the computed rank on the task or in a cache so the mission grid and backlog show the same rank without recomputing.

4. **Optional: store rank on task**  
   For performance, consider a nightly or on-save job that writes `suggested_rank` (or `ums`) to a column or cache so the UI can read rank without running the full pipeline every time. Start without this; add if ranking becomes a bottleneck.

---

## 11. Assistant (and nav): hide on production until ready

### 11.1 Problem

The Assistant page and its nav entry must be hidden in production until the feature is finished in development, without breaking dev or staging.

### 11.2 Architectural direction

- **Environment-based feature visibility:** Use a build-time or runtime flag (e.g. `NEXT_PUBLIC_ASSISTANT_ENABLED` or a feature-flag from Supabase) to control (a) visibility of the Assistant nav item, (b) access to `/assistant` (redirect or 404 if disabled).  
- **Single gate:** One place that defines “assistant enabled”; nav and route guard both depend on it so we don’t leave the route accessible when nav is hidden.

### 11.3 Implementation steps

1. **Define the gate**  
   - Option A: Env var `NEXT_PUBLIC_ASSISTANT_ENABLED=true` only in dev/staging; production leaves it unset or false.  
   - Option B: Feature-flag table in Supabase (e.g. `feature_flags(name, enabled)` or per-user `user_feature_flags`) and a server/client helper `isAssistantEnabled()`.  
   - Prefer Option A for simplicity: one env var, no DB round-trip for nav.

2. **Nav**  
   In `components/ui/BottomNavigation.tsx`, filter `navLinks`: if Assistant is disabled, exclude the item with `href: "/assistant"`. Use the same gate in any other nav (e.g. dashboard CTAs, keyboard shortcut “A”) so the entry point is consistent.

3. **Route guard**  
   In `app/(dashboard)/assistant/page.tsx` (or a layout), if the gate is false, redirect to dashboard (or show “Coming soon”) so direct URL access to `/assistant` in production does not expose the unfinished feature.

4. **API**  
   Optionally guard `app/api/assistant/message/route.ts`: if the feature is disabled, return 403 or 404 so external calls cannot use the assistant when it’s off.

5. **Documentation**  
   In README or env.example, document `NEXT_PUBLIC_ASSISTANT_ENABLED` and when to turn it on (e.g. “Set to true in development and staging; leave false in production until GA”).

---

## 12. Snapshot coverage: insights and settings in snapshot

### 12.1 Problem

Not every page is fully covered by the daily snapshot; e.g. Insights (report/analytics) and Settings are not fully included, so first-paint or offline experience for those pages can be incomplete or blank.

### 12.2 Architectural direction

- **Snapshot = first-paint and offline data** for the main surfaces the user might open. Extend the snapshot to include analytics and settings (or minimal “safe” subsets) so that when the user opens Insights or Settings from a cached snapshot, they see something useful instead of loading spinners or errors.  
- **Privacy:** Settings and preferences are user-specific; include only what’s needed for UI (e.g. theme, compact_ui, push_personality_mode) and avoid sensitive data in the snapshot.  
- **Size and performance:** Snapshot is stored in localStorage; keep analytics payload small (e.g. aggregates, not raw events). If needed, add a separate “insights” snapshot key or compress.

### 12.3 Implementation steps

1. **Current snapshot coverage**  
   In `lib/daily-initialize.ts`, `ALL_STEPS` includes fetchDashboard, fetchMissions, fetchXP, fetchStrategy, fetchLearning, fetchBudget, fetchAnalytics, preloadPages, preloadAssets, prepareCache. The types in `types/daily-snapshot.ts` already have `AnalyticsSnapshot` and the snapshot has `analytics`. So analytics is fetched in `fetchAnalytics`; the gap may be that the **Insights/Report page** does not hydrate from `snapshot.analytics` on first paint. Verify: does the report page read from DailySnapshot or only from a live API call?

2. **Insights/Report**  
   - Ensure the report (or analytics) page has a **snapshot-first** path: if `DailySnapshot` is available and has `analytics` for today, render from that first; then optionally refetch in the background and update.  
   - If the report page uses different data (e.g. different API), add a corresponding snapshot slice (e.g. `report` or extend `analytics`) and a preload step that fills it.

3. **Settings**  
   - Add a **minimal settings snapshot**: e.g. `SettingsSnapshot { theme, compact_ui, push_personality_mode, usual_days_off, ... }` in `DailySnapshot` (or a separate key).  
   - In daily bootstrap, add step `fetchSettings`: call an API that returns public preference fields (no secrets); store in snapshot.  
   - On the Settings page, on first render use snapshot if available so theme and toggles render immediately; then fetch full preferences and replace.

4. **preloadPages**  
   `preloadPages` already includes `/report` and other routes; ensure `/settings` and the insights route are in the list so HTML is cached. The missing piece is **data** for those pages (analytics + settings), not just HTML.

5. **Version and compatibility**  
   If you add new snapshot fields, bump `LATEST_SNAPSHOT_VERSION` and handle old snapshots (ignore new keys or merge safely) so existing users don’t break.

---

## 13. Task state after app close: completed tasks reappear until new snapshot

### 13.1 Problem

User completes tasks, closes the app, reopens: completed tasks show again as incomplete until a new snapshot (or fresh load) is applied. So the persisted state is wrong until refresh.

### 13.2 Root cause (summary)

Two sources of truth conflict:  
1. **Zustand store** (`tasksByDate`) is persisted to localStorage and rehydrated on open. When the user completes a task, we `upsertTask` with `completed: true`, so in memory the task is completed.  
2. **Daily snapshot** is also stored (e.g. `neurohq-daily-snapshot-v1`) and is used by `StoreHydrator` / `MissionsProvider` to **hydrate the store** on app init. That snapshot was saved at last **bootstrap** (e.g. morning), so it still has **old** `tasksByDate` (tasks not yet completed).  
3. On reopen, the app loads the **daily snapshot** and overwrites the store with snapshot data, including stale `tasksByDate` for today. So completed tasks reappear as incomplete. Only when a **new** snapshot is loaded (or when tasks-bootstrap fetches today and overwrites) does the list show correctly.

So the bug is: **hydration from snapshot overwrites today’s tasks with stale data**.

### 13.3 Architectural direction

- **Today is special:** For the “today” date, the **server** (or the most recent client update after completions) is the source of truth, not the daily snapshot that was saved earlier in the day.  
- **Hydration rule:** When hydrating from a cached daily snapshot, **do not overwrite `tasksByDate[today]`** with snapshot data; leave today to be filled by a dedicated “today” fetch (tasks-bootstrap or equivalent). Alternatively: always fetch today’s tasks on app load and merge into the store, and use snapshot only for other days or for dashboard/secondary data.  
- **Persistence:** Ensure that when the user completes a task, the store update (upsertTask) is persisted (Zustand persist); and that on re-open we don’t overwrite that persisted “today” with an older snapshot.

### 13.4 Implementation steps

1. **Identify hydration entry points**  
   Find every place that writes to `tasksByDate` from snapshot data: likely `StoreHydrator.tsx` and `MissionsProvider.tsx`. They receive snapshot and call `setTasksForDate(day, tasks)` for each day in the snapshot.

2. **Exclude “today” when hydrating from snapshot**  
   When applying snapshot missions to the store, **skip** the key that equals `getTodayKey()` (or the current “today” in app state). So: for each `day` in `snapshot.missions.tasksByDate`, if `day === todayKey`, do not call `setTasksForDate(day, ...)` from snapshot; leave today to be filled by `useTasksBootstrap(today)` or by a dedicated initial fetch.  
   Result: after reopen, today’s list is either (a) still empty until bootstrap runs, or (b) loaded from **Zustand persist** (tasksByDate) if the persist layer rehydrates before the snapshot. So we must ensure **order of operations**: rehydrate Zustand first, then apply snapshot but skip today. That way, the persisted “today” (with completions) is kept.

3. **Ensure today is always refreshed when possible**  
   On app load, always run the “today” tasks fetch (e.g. `useTasksBootstrap(today)`) so that even if we didn’t have a persisted today, we get fresh data. If we did have a persisted today, the fetch can overwrite with server truth (so server is final). So: (a) rehydrate Zustand, (b) apply snapshot for all days **except** today, (c) run tasks-bootstrap for today so server data fills today. That way we never show stale snapshot data for today.

4. **Optional: persist snapshot only for non-today**  
   When saving the daily snapshot, you could omit `tasksByDate[today]` from the stored snapshot so that the snapshot never contains “today” and today always comes from fetch or from Zustand persist. That’s a larger change; the minimal fix is step 2 + 3.

5. **Test scenarios**  
   - Complete a task → close app (wait for persist) → reopen: today should show the task completed.  
   - Open app offline with old snapshot: today should still come from persisted store if available; otherwise show “offline” state and don’t overwrite with stale snapshot for today.

---

## 14. Implementation order and dependencies

Suggested order to implement without blocking:

| Priority | Theme | Items | Notes |
|----------|--------|--------|------|
| P0 | State correctness | §13 Task state after close | Fixes user-visible bug first. |
| P0 | Production safety | §11 Assistant hidden in prod | Quick gate for production. |
| P1 | Data consistency | §9 Backlog 30 days + sort | Single API change. |
| P1 | Data consistency | §2 Settings user-specific | Reduces confusion and support. |
| P2 | Critical actions | §4 Undo “grote oepsie” | Payday undo first. |
| P2 | Budget | §5 Budget cards | Context + single source of truth. |
| P2 | Snapshot | §12 Insights/settings in snapshot | Improves first-paint. |
| P3 | Missions | §8 Routine tab + best days | New tab and API. |
| P3 | Missions | §10 Rank auto-determination | Tuning + stability. |
| P3 | Hobby | §7 Hobby commitment extended | Config + UI. |
| P3 | PWA | §6 App icon badges | Badging API + SW. |
| P3 | Content | §3 Help page | Structure and ownership. |

Dependencies: §2 (settings) supports §5 (budget) and §4 (undo payload). §12 (snapshot) can be done in parallel with §13. §8 (routine) can build on existing recurrence and week-load APIs.

---

## 15. Success criteria (high level)

- **Settings:** All surfaces show the same payday, personality, and key prefs after a change; no “device A vs device B” inconsistency for user-scoped settings.  
- **Undo:** User can undo “Vandaag loon gehad” within the time window.  
- **Budget:** All budget cards on a page show the same period and remaining amount; one fetch per page.  
- **Backlog:** Only last 30 days, newest-first; no unbounded list.  
- **Tasks after close:** Completed tasks stay completed after app reopen without needing to trigger a new snapshot.  
- **Assistant:** Not visible or accessible in production until enabled.  
- **Snapshot:** Insights and Settings render from snapshot on first paint where applicable.  
- **Routine:** Users can see “at least 1x per month” tasks and suggested days.  
- **Rank:** Mission rank is stable and, if desired, explainable.  
- **Hobby:** More hobbies supported and visible in settings; commitment and decay work for all.  
- **PWA:** Badge shows on icon when applicable.  
- **Help:** Up-to-date and easy to extend.

---

*End of Architecture Improvement Plan.*
