# NeuroHQ — Full Action Plan

This document is the **complete action plan** for all requested points. Each section has: **goal**, **root-cause summary**, **concrete steps**, **files to touch**, and **acceptance criteria**. No half-measures.

---

## 1. Brain status: slow to set + auto-missions not assigned after setting

### Goal
- Brain status feels **instant** to the user.
- After setting brain status, **auto-missions are assigned** when the user goes to the Missions page, without confusion or “no_brain_status” when it was just set.

### Root causes (from codebase)
- **Slow to set:** Save goes to server then `router.refresh()`. No optimistic persistence to Supabase-style “instant” read path; modal may wait on server + revalidation.
- **Auto-missions not assigned:** `ensureMasterMissionsForToday()` runs on the **tasks page** (server) and reads `daily_state` from DB. That read can be **cached** (`unstable_cache` in `getDailyState`). Even though `saveDailyState` calls `revalidateTagMax(\`daily-${user.id}-${serverToday}\`)`, the **tasks page** might run in a request that still sees stale cache, or the user clicks “Vernieuw pagina” and `router.refresh()` doesn’t bust the cache the tasks page uses.
- **Recognition:** Tasks page only “sees” brain status when its server run gets fresh `daily_state`; if cache or revalidation is inconsistent, it keeps showing `no_brain_status`.

### Action plan

#### 1.1 Make brain status “instant” (align with §2)
- In **`BrainStatusModal`** (and any caller):
  - On submit: **immediately** write to **localStorage** (key e.g. `hq-daily-state-${date}`) with the same shape the app uses for “today’s state”, then call `onSaved` so the dashboard/tasks can read from local storage and show the new state **without waiting** for the server.
- Keep the existing **server save** (`saveDailyState`) but run it in the background (e.g. `startTransition` + fire-and-forget or a small queue). On success: optionally sync to a “pending sync” flag; on failure: show a non-blocking toast and retry or leave for the 5-second sync layer (§2).
- Ensure **dashboard** and **tasks** (and any component that needs “do we have brain status today?”) **read first from localStorage** for today’s date, then from server. So as soon as the user hits “Save”, the UI everywhere shows “brain status set” and auto-mission logic can use that.

#### 1.2 Ensure tasks page always sees fresh brain status when deciding auto-missions
- In **`app/actions/daily-state.ts`**:
  - For the **tasks page only**, when calling `getDailyState(today)` **from the code path that runs `ensureMasterMissionsForToday()`**, either:
    - **Option A:** Add a dedicated `getDailyStateUncached(date)` used only by `ensureMasterMissionsForToday()` that does **not** use `unstable_cache`, so the missions page always gets the latest row after a save; or
    - **Option B:** Ensure `revalidateTagMax(\`daily-${user.id}-${serverToday}\`)` is called from `saveDailyState` and that the **tasks page** is loaded in a way that respects that tag (e.g. same cache segment). Prefer **Option A** for predictability.
- In **`app/actions/master-missions.ts`**:
  - Call the **uncached** daily state getter (e.g. `getDailyStateUncached(todayDateString())`) inside `ensureMasterMissionsForToday()` so it never relies on stale cache.
- **Vernieuw pagina:** Ensure the “Vernieuw pagina” control triggers a **full re-run** of the tasks page server component. `RefreshPageButton` already uses `router.refresh()`. If the server still returns cached data, add a **cache-busting query param** when showing the no_brain_status message (e.g. “Vernieuw pagina” links to `/tasks?refresh=1`) and have the tasks page **skip or bypass** any in-memory dashboard cache for that request, or ensure `revalidatePath('/tasks')` is enough. Prefer making the uncached daily-state read in `ensureMasterMissionsForToday()` the single source of truth so that a normal refresh is enough.

#### 1.3 “Vernieuw pagina” link that actually refreshes
- In **`app/(dashboard)/tasks/page.tsx`**, the no_brain_status block currently uses `<RefreshPageButton />` (a **button**). If in the UI this is presented as a **link** or wrapped in something that prevents the click:
  - Ensure the clickable element is the **button** from `RefreshPageButton` (no `Link` wrapping it with `href="/tasks"` that would navigate without refresh).
  - If design requires a link: use `<Link href="/tasks" onClick={(e) => { e.preventDefault(); router.refresh(); }}">Vernieuw pagina</Link>` or a button styled as a link, so that “Vernieuw pagina” **always** triggers `router.refresh()` (and with 1.2, the server will then see fresh `daily_state` and assign auto-missions).

**Files to touch**
- `components/hq/BrainStatusModal.tsx` — optimistic write to localStorage, background server save, `onSaved` early.
- `app/actions/daily-state.ts` — add `getDailyStateUncached(date)`, keep existing cached `getDailyState` for other callers.
- `app/actions/master-missions.ts` — use uncached daily state inside `ensureMasterMissionsForToday()`.
- `app/(dashboard)/tasks/page.tsx` — ensure “Vernieuw pagina” is a single element that triggers refresh (button or link with preventDefault + refresh).
- Any dashboard/tasks component that reads “today’s brain state” — ensure they read from localStorage first when available (§2).

**Acceptance criteria**
- User sets brain status on dashboard → sees confirmation immediately; within one navigation to Missions (or one “Vernieuw pagina” on Missions), auto-missions appear and the no_brain_status message does not show.
- “Vernieuw pagina” click always refreshes the page and re-runs server logic so new brain status is picked up.

---

## 2. Instant UI via localStorage + background Supabase sync (5 s)

### Goal
- **All** relevant changes (brain status, tasks, budget, settings, etc.) are **visible immediately** in the UI via **localStorage** (or equivalent client cache).
- After **5 seconds** of no further changes, data is **synced to Supabase in the background**; the site always shows up-to-date state.

### Root cause
- Today the app often waits on server actions and `router.refresh()` for updates. There is no global “write to local first, sync later” pattern.

### Action plan

#### 2.1 Define a sync contract
- **Storage keys:** One namespace, e.g. `neurohq-pending-*` or per-entity: `neurohq-daily-state-${date}`, `neurohq-tasks-${date}`, `neurohq-budget-*`, etc. Document the key scheme in a small `lib/sync-pending.ts` or `lib/client-pending-writes.ts`.
- **Shape:** Stored value = same shape as the server expects (e.g. daily_state fields, task payload, budget entry). Include a `_updatedAt` timestamp for “last modified” and optional `_synced: boolean`.

#### 2.2 Reader pattern: “local first, then server”
- For each entity that should feel instant:
  - **Brain status:** Already partially done in BrainStatusModal. Extend: any reader of “today’s daily_state” (dashboard, tasks, ensureMasterMissionsForToday’s *display* logic) should:
    - Read from localStorage for today’s date first.
    - If missing or expired, use server data.
  - **Tasks (today):** When adding/editing/completing a task, write the updated list (or delta) to localStorage for today, then run server action. UI renders from localStorage; server is source of truth after sync.
  - **Budget:** Same idea: on add/edit/delete, update a local “pending budget” structure, then sync after 5 s.
- Implement a small **hook or helper**: `useDailyState()`, `useTodaysTasks()`, etc., that return “merged” data: pending local changes overlaid on server data, so the UI always shows the latest.

#### 2.3 5-second debounced sync
- **Single sync scheduler:** When any pending write is written to localStorage, start a **5-second timer** (debounce: if another write happens, reset the timer).
- When the timer fires:
  - For each pending key that has unsynced data, call the corresponding server action (e.g. `saveDailyState`, task create/update, budget upsert).
  - On success: mark that key as synced (or remove from pending); optionally update a “last synced” indicator.
  - On failure: keep in pending, retry later (e.g. exponential backoff) or show “Sync failed, will retry”.
- Run this in a **client component** that mounts in the app shell (e.g. a `PendingSyncProvider` or inside `DashboardDataProvider`), so it’s active on all relevant pages.

#### 2.4 Conflict and consistency
- **Simple strategy:** “Last write wins” per entity. Client timestamp `_updatedAt` can be used to avoid overwriting newer server data if you later add a version field.
- For **tasks**, merging can be by `id`: local updates (add/complete/edit) applied on top of server list; sync sends only the changed items.

**Files to touch**
- New: `lib/client-pending-writes.ts` or `lib/sync-pending.ts` — key scheme, read/write helpers, 5s debounce scheduler.
- New (optional): `components/providers/PendingSyncProvider.tsx` — mounts sync loop, listens to pending writes.
- `components/hq/BrainStatusModal.tsx` — write to localStorage immediately; register pending sync for daily_state.
- `app/actions/daily-state.ts` — optional: accept “from sync” flag to avoid revalidating aggressively on background sync.
- Task list / task actions — after create/update/complete, write to localStorage and register for sync.
- Budget components and `app/actions/budget.ts` — same pattern for budget entries.
- Dashboard and tasks pages — use “local first” readers so UI shows pending state.

**Acceptance criteria**
- Changing brain status, completing a task, or adding a budget entry updates the UI **immediately** without waiting for the server.
- Within 5 seconds of the last change, data is synced to Supabase; after refresh or new device, data is correct (Supabase is source of truth).

---

## 3. Budget logging: daily, detailed (supermarket, subscriptions, etc.)

### Goal
- Budget is **input daily**.
- Logging is **advanced**: per category, with **detail** (e.g. boodschappen → which supermarket; subscriptions → which subscriptions; etc.), suitable for analysis and ML later.

### Root cause
- Current model: `budget_entries` has `category`, `note`, `amount_cents`, `date`. There is no structured “subcategory” or “detail” (e.g. store name, subscription name) and no enforced “daily” flow.

### Action plan

#### 3.1 Data model (Supabase)
- **Option A — extend existing table:**
  - Add columns to `budget_entries`: e.g. `subcategory` (e.g. "boodschappen", "subscriptions", "transport"), `detail_json` (JSONB) or dedicated columns:
    - For **boodschappen:** `store_name` (e.g. "Albert Heijn", "Lidl"), optional `store_chain`.
    - For **subscriptions:** `subscription_name` (e.g. "Netflix", "Spotify"), optional `billing_interval`.
    - For **transport:** `transport_type` (e.g. "OV", "fuel", "parking"), optional `detail`.
  - Keep `category` as the high-level category; use `subcategory` + JSON or columns for specifics.
- **Option B — new table:** `budget_entry_details` (entry_id, type, key, value) for flexible key-value. Prefer **Option A** for simplicity and queryability; add JSONB if you need flexibility for more types later.
- **Migration:** Add columns (and optional `budget_entry_detail_types` or enum for subcategory) in a new migration.

#### 3.2 Daily budget flow
- **Daily prompt:** When user has not logged anything for **today** (or has not confirmed “daily budget done”), show a **daily budget card/banner** (dashboard or budget page): “Vandaag budget bijhouden” with quick categories:
  - Boodschappen (→ ask supermarket + amount)
  - Subscriptions (→ list or add subscription + amount, or “geen vandaag”)
  - Transport, Uitgaan, Huishouden, etc.
- **Input UI:** For each category that’s “daily”:
  - **Boodschappen:** Dropdown or autocomplete for **supermarket** (e.g. Albert Heijn, Jumbo, Lidl, Aldi, Plus, Dirk, other) + amount + optional note.
  - **Subscriptions:** List of known subscriptions (from settings or past entries); “Add subscription” + amount; optional date range or “monthly”.
  - **Other categories:** Same pattern: structured fields where useful, else free note.
- Store **one entry per logical spend** (one row per supermarket visit, per subscription payment, etc.) with `date = today` and the new detail fields.

#### 3.3 Settings: manage “templates”
- In **Settings → Budget**, allow user to:
  - Define **subscriptions** (name, typical amount, interval) so they appear in the daily flow.
  - Define **frequent stores** (for boodschappen) so they appear in the dropdown.
- These can live in `users` JSON, a `user_budget_templates` table, or `recurring_budget_templates` extended with type (subscription vs store).

#### 3.4 Budget page and dashboard
- **Budget page:** Default view “Vandaag”: show today’s entries with full detail (supermarket, subscription name, etc.); “Voeg toe” opens the advanced form (category → subcategory/detail fields).
- **Dashboard:** Keep or add a compact “Vandaag budget” widget that links to daily input or shows today’s total + “Log vandaag” if empty.

**Files to touch**
- New migration: extend `budget_entries` (and optionally `recurring_budget_templates` / user settings) with `subcategory`, `store_name`, `subscription_name`, or `detail_json`.
- `types/database.types.ts` — update types for new columns.
- `app/actions/budget.ts` — `addBudgetEntry` / `updateBudgetEntry` accept and persist new fields; `getBudgetEntries` return them.
- New component(s): e.g. `BudgetDailyInput.tsx`, `BudgetEntryFormAdvanced.tsx` — category selector, then dynamic fields (supermarket list, subscription list, etc.).
- Settings: new section or extend existing budget settings for “Mijn supermarkten” and “Mijn abonnementen”.
- Dashboard: “Vandaag budget” card or extend `DashboardQuickBudgetLog` to drive daily flow with detail.

**Acceptance criteria**
- User can log **daily** with clear “vandaag” focus.
- For boodschappen: can select **supermarket** and amount; for subscriptions: can select **subscription** and amount (or add new).
- Data is stored in DB with structured detail and can be used for reports and later ML.

---

## 4. Settings: “Light version” — low cinematic feel, same visuals, fast UI

### Goal
- In **Settings**, user can enable a **“Light version”** (or “Light UI”).
- Light version: **same visuals** (themes, colors, layout) but **very low cinematic feel** — minimal animations, **smooth and fast** interaction.

### Root cause
- There is already `reduced_motion` in preferences and `[data-reduced-motion="true"]` in CSS. “Light version” should go further: not only reduce motion but **shorten durations** and **prioritize snappiness** (e.g. no long transitions, instant feedback).

### Action plan

#### 4.1 Preference and data attribute
- Add a new preference: **`light_ui`** (boolean), stored in `users` or preferences table alongside `reduced_motion`.
- When `light_ui` is true, set a data attribute on `<html>` or `document.documentElement`, e.g. `data-light-ui="true"`.
- **ThemeHydrate** and **ThemeProvider** (or a small **LightUIHydrate**): read `light_ui` from server prefs and set `document.documentElement.dataset.lightUi = prefs.light_ui ? "true" : "false"`. Persist when user toggles in settings.

#### 4.2 Settings UI
- In **Settings → Weergave** (or new “Performance” / “Weergave” section): add a control **“Light version”** with short description: “Minder animaties, snellere interface, dezelfde look.”
- Toggle or checkbox that calls `updateUserPreferences({ light_ui: true/false })` and updates the data attribute.

#### 4.3 CSS and animation tokens
- In **`lib/animations.ts`** (or equivalent): define **short** durations for light UI, e.g. `DURATION_FAST_LIGHT_MS = 80`, `DURATION_NORMAL_LIGHT_MS = 120`. Keep existing tokens for non-light.
- In **`app/globals.css`** and **`app/design-system.css`**:
  - Under `[data-light-ui="true"]` (or combined `[data-reduced-motion="true"], [data-light-ui="true"]`):
    - Override animation durations to the short values (e.g. `--duration-fast: 80ms`, `--duration-normal: 120ms`).
    - Disable or drastically reduce: parallax, long transitions, staggered delays, “breathe”/pulse on cards, mascot animations.
  - Use CSS variables for all transition/animation durations so one place controls “fast UI” behavior.

#### 4.4 Component-level behavior
- **Modals:** In light UI, open/close with minimal or no transition (e.g. 80ms opacity).
- **Lists and cards:** No stagger; or stagger &lt; 20ms between items.
- **Buttons and CTAs:** Instant hover state (no 200ms delay); focus ring immediate.
- **Mascot / 3D:** If any, in light UI: hide or show a static frame only (no idle animation).
- **HUD / sci-fi panels:** Keep the same visuals (borders, colors) but remove or shorten glow pulses and transitions.

#### 4.5 Same visuals
- Do **not** change theme, colors, or layout in light mode. Only animation duration, presence of motion, and “weight” of effects. So: same components, same CSS variables for color, same structure; only motion and timing differ.

**Files to touch**
- `types/preferences.types.ts` and DB/preferences: add `light_ui`.
- `app/actions/preferences.ts` — read/write `light_ui`.
- `components/providers/ThemeHydrate.tsx` (or new provider) — set `data-light-ui` from prefs.
- `app/(dashboard)/settings/page.tsx` — add “Light version” toggle; optionally new `SettingsLightUI.tsx`.
- `lib/animations.ts` — add light-UI duration constants.
- `app/globals.css`, `app/design-system.css` — `[data-light-ui="true"]` overrides for durations and disabled/heavy animations.
- Key components that use long transitions (modals, dashboard cards, TaskList) — use CSS variables or data attribute so they respect light UI.

**Acceptance criteria**
- User can turn on “Light version” in Settings; UI keeps the same look but feels **fast** and **low cinematic** (minimal animation, instant feedback).
- No layout or theme change; only motion and timing.

---

## 5. “Nog geen missie vandaag” popup: do not show when a mission is accomplished

### Goal
- The popup **“Nog geen missie vandaag”** (after 20:00 with 0 completed tasks) must **not** appear if the user has **already completed at least one task today**.

### Root cause
- **LateDayNoTaskBanner** receives `completedTodayCount` from **dashboard critical data** (`energyBudget.completedTaskCount`). That data comes from **`/api/dashboard/data`**, which can be **cached** (client-side or server). So: user completes a task on the Missions page, then goes back to dashboard; dashboard still shows **old** critical data (e.g. 0 completed), so the banner still shows.

### Action plan

#### 5.1 Source of truth for “completed today”
- **Option A — Revalidate dashboard when returning from tasks:** When user completes a task, call `revalidatePath("/dashboard")` (already done) and ensure the **client** that shows the dashboard does not use a stale cache. When navigating from tasks → dashboard, **refetch** critical data (e.g. in `DashboardDataProvider` or `DashboardClientShell`: on route change to `/dashboard`, invalidate cache and fetch fresh data).
- **Option B — Banner fetches its own count:** When `LateDayNoTaskBanner` is about to show (hour ≥ 20 and local `completedTodayCount` is 0), do a **one-time fetch** to an endpoint that returns only “completed count for today” (e.g. `GET /api/dashboard/data?part=critical` or a tiny `GET /api/today-completed-count`). If the fetched count &gt; 0, **don’t show** the banner and set sessionStorage so we don’t ask again.
- **Option C — Shared real-time source:** Use the same “local first” layer as in §2: when user completes a task, the client updates localStorage (e.g. “today’s completed count” or today’s task list). The dashboard (and banner) read from that first; if local says “≥ 1 completed today”, don’t show the banner.

Recommendation: **Option B** is minimal and reliable: banner never trusts only the initial server payload; it double-checks before showing. Combine with **Option A** so normal navigation to dashboard gets fresh data when possible.

#### 5.2 Implement Option B in LateDayNoTaskBanner
- In **`LateDayNoTaskBanner`**: when `isLate && completedTodayCount === 0` and you’re about to set `visible = true`, first call a small API or server action **“getCompletedTodayCount()”** (or use existing dashboard API with a small payload). If result &gt; 0, **do not** set `visible` and store in sessionStorage that we’ve already checked (so we don’t keep polling). If result === 0, show the modal as now.
- This way even if the dashboard payload was stale, the banner will not show once the user has completed a task.

#### 5.3 Option A: Invalidate dashboard cache on task complete
- In **TaskList** (or wherever task completion is handled): after successful `completeTask`, invalidate dashboard cache. For example: call a client function that updates `DashboardDataProvider` cache (e.g. set `critical` to null or update `energyBudget.completedTaskCount` in cache), or trigger a refetch of critical data. So when the user is still on dashboard or returns to it, they get the new count.

**Files to touch**
- `components/dashboard/LateDayNoTaskBanner.tsx` — before showing, fetch “completed today count”; if &gt; 0, don’t show and mark checked.
- New or existing API: e.g. `getCompletedTodayCount()` in `app/actions/tasks.ts` and a tiny route, or reuse dashboard API with `part=critical` and read `energyBudget.completedTaskCount` from response.
- `components/providers/DashboardDataProvider.tsx` or `DashboardClientShell.tsx` — on focus or route change to dashboard, optionally refetch critical so `completedTodayCount` is fresh when coming from tasks.

**Acceptance criteria**
- User completes at least one task today; after 20:00, when they open the dashboard, the “Nog geen missie vandaag” popup **does not** appear.
- If they really have 0 completed, the popup still appears once per day as before.

---

## 6. Impact (reputation) never updates

### Goal
- The **Impact** value in “Level & voortgang” (reputation) **updates** when the user completes tasks, especially higher-impact/higher-XP tasks.

### Root cause
- **Reputation** is computed in **`app/actions/identity-engine.ts`** from **`behaviour_log`**. “Impact” uses **highDifficultyCompletionsLast30**: entries where `mission_completed_at` is set and **(difficulty_level >= 0.7 OR xp_gained >= 80)**.
- In **`app/actions/tasks.ts`**, when completing a task we call **`logBehaviourEntry`** with **`difficultyLevel: 0.5`** and **`xpGained: xpAwarded`**. So unless `xpAwarded >= 80`, **no** completion counts as “high difficulty”, so **impact** stays 0.

### Action plan

#### 6.1 Log real difficulty and XP in behaviour_log
- In **`completeTask`** (in `app/actions/tasks.ts`), when calling `logBehaviourEntry`:
  - **difficulty_level:** Derive from task’s **impact** (1–3). For example: `impact === 3 → 0.9`, `impact === 2 → 0.65`, `impact === 1 → 0.4`, else `0.5`. So high-impact tasks count as high-difficulty.
  - **xp_gained:** Keep passing **actual** `xpAwarded` (already done). So completions with high XP (e.g. ≥ 80) will also count as high-impact in the identity engine.
- No change to **identity-engine** formula needed; it already uses `difficulty_level >= 0.7 || xp_gained >= 80`. Fixing the **input** is enough.

#### 6.2 Optional: Recompute reputation after each completion
- Today `getIdentityEngine()` recomputes reputation when the stored row is not from today or is zero. To make impact update **immediately** after a high-impact completion, you can:
  - In **`completeTask`**, after `logBehaviourEntry`, call **`getIdentityEngine()`** (or a dedicated `recomputeAndUpsertReputation()`) so the `user_reputation` row is updated that same request. Then the next time the user sees Level & voortgang, the new impact is there.
- Alternatively, rely on “recompute when getIdentityEngine is next called” (e.g. on next dashboard/tasks load); that’s acceptable if you’ve fixed the logging so high-impact completions are recorded.

**Files to touch**
- `app/actions/tasks.ts` — in `completeTask`, when building the object for `logBehaviourEntry`, set `difficultyLevel` from `t.impact` (map 1→0.4, 2→0.65, 3→0.9) and keep `xpGained: xpAwarded`.
- Optional: `app/actions/tasks.ts` — after `logBehaviourEntry`, call `getIdentityEngine()` or a slim `recomputeReputationForUser(userId)` so `user_reputation` is updated immediately.

**Acceptance criteria**
- Completing tasks with impact 2 or 3 (or high XP) increases **Impact** in Level & voortgang over time; the value is no longer stuck at 0 when the user does meaningful tasks.

---

## 7. Auto-missies message: site doesn’t recognize brain status + “Vernieuw pagina” doesn’t refresh

### Goal
- After setting brain status, the **site** (Missions page) **recognizes** it and assigns auto-missions (or shows “already_enough” / created count), not “no_brain_status”.
- The **“Vernieuw pagina”** control **always** refreshes the page so the user sees the updated state.

### Root cause
- Same as §1: tasks page uses cached or stale `daily_state`, and/or the refresh doesn’t force a fresh server run. “Vernieuw pagina” is implemented as a **button** with `router.refresh()`; if the button is not the one the user clicks (e.g. a link elsewhere) or if refresh doesn’t invalidate cache, the issue persists.

### Action plan
- Implement **§1** in full:
  - **1.2** — `ensureMasterMissionsForToday()` uses **uncached** daily state so the Missions page always sees the latest brain status.
  - **1.3** — Ensure the only clickable “Vernieuw pagina” in the no_brain_status block is the **RefreshPageButton** (or an equivalent that calls `router.refresh()`). If the design shows a link, make it `href="#"` or `href="/tasks"` with `onClick` that prevents default and calls `router.refresh()`, so the page truly re-runs and fetches new daily_state and runs `ensureMasterMissionsForToday()` again.

**Files to touch**
- Same as §1: `app/actions/daily-state.ts`, `app/actions/master-missions.ts`, `app/(dashboard)/tasks/page.tsx`.

**Acceptance criteria**
- After setting brain status and clicking “Vernieuw pagina” on the Missions page, the message disappears and auto-missions appear (or the correct “already X toegevoegd” / “already_enough” state is shown).

---

## 8. 21:00 (9pm) popup: no task added or no task checked — ask explanation, save for ML

### Goal
- If by **21:00** (9pm) the user has **no task added for today** **or** **no task completed today**, show a **popup** asking for an **explanation** (free text or structured). Save the answer to **Supabase** for later use (e.g. machine learning, analytics).

### Root cause
- This flow does not exist yet; it’s a new feature.

### Action plan

#### 8.1 Data model
- New table (or extend existing): e.g. **`daily_explanations`** or **`no_task_explanations`**:
  - `user_id`, `date` (the day in question), `reason_type` (optional: "no_tasks_added" | "no_tasks_completed" | "both"), `explanation_text` (text), `created_at`.
  - Optional: `mood`, `busy_level` (1–5) for future ML.
- Migration to create the table and RLS.

#### 8.2 When to show
- **Time:** 21:00 (9pm) — use the same timezone as the rest of the app (`todayDateString()`, server or client 21:00 in that zone).
- **Condition:** For **today**: either (a) zero tasks added for today (no rows in `tasks` for user + today with `deleted_at` null and not from auto-master?), or (b) zero tasks completed today. So: “no task added” = no tasks due today that were created/assigned; “no task completed” = completed count for today is 0. Show one popup per day, with a message that covers both cases if both are true.

#### 8.3 Popup UI
- **Trigger:** A component similar to **LateDayNoTaskBanner** (e.g. **NoTaskExplanationBanner** or **EveningNoTaskModal**). Renders only when hour ≥ 21 and condition is met, and only once per day (sessionStorage: `neurohq-evening-no-task-${dateStr}`).
- **Content:** Title e.g. “Geen missies vandaag?” or “Geen taken afgevinkt vandaag”. Short copy: “Wil je kort aangeven waarom? (optioneel) Dit helpt ons om de app beter te maken.”
- **Form:** Textarea (and optionally dropdown: “Druk dag”, “Ziek”, “Vrije dag”, “Vergeten”, “Anders”) + “Verstuur” and “Overslaan”.
- **On submit:** Call server action **`saveNoTaskExplanation(date, reasonType, explanationText)`** which inserts into `daily_explanations`; then dismiss and set sessionStorage so the popup doesn’t show again that day.

#### 8.4 Where to mount
- Mount in **DashboardClientShell** or in the main layout for authenticated dashboard, so it shows on dashboard or any page when conditions are met. Alternatively only on dashboard to avoid interrupting tasks page.

**Files to touch**
- New migration: `daily_explanations` (or equivalent) table.
- `types/database.types.ts` — type for the new table.
- New server action: e.g. `app/actions/daily-explanations.ts` — `saveNoTaskExplanation(userId, date, reasonType?, explanationText?)`.
- New component: e.g. `components/dashboard/EveningNoTaskModal.tsx` or `NoTaskExplanationBanner.tsx` — check time ≥ 21, check “no tasks added or no completed”, show once per day, form + submit.
- `components/dashboard/DashboardClientShell.tsx` — mount the new component; pass date and “no tasks added / no completed” flags (from critical data or a tiny API).

**Acceptance criteria**
- After 21:00, if user had no task added or no task completed for today, they see the popup once; they can submit an explanation or skip; the explanation is stored in Supabase for later use.

---

## 9. Today’s mission card: “Add task” as advanced as Edit task

### Goal
- On the **Missions page**, the **“Add task”** on the **Today’s mission card** is **as advanced** as the **Edit task** form: same fields and capabilities (category, recurrence, impact, urgency, energy, focus, mental/social load, priority, notes, etc.).

### Root cause
- **Edit task** uses **EditMissionModal** with full fields (title, due_date, category, recurrence, weekdays, impact, urgency, energy_required, focus_required, mental_load, social_load, priority, notes). **Add task** on the mission page can be the **QuickAddModal** or the inline “routine & options” form in **TaskList**, which expose **fewer** fields than Edit.

### Action plan

#### 9.1 Unify “Add” with “Edit” fields
- **Option A — Reuse EditMissionModal for Add:** Create a “create mode” of **EditMissionModal** (or a wrapper): same form fields, but on submit call **`createTask`** instead of **`updateTask`**. Prefill with defaults (e.g. due_date = today, impact = 2). Use one component for both “Add” and “Edit” to guarantee parity.
- **Option B — Extend QuickAddModal / inline form:** Add every field that **EditMissionModal** has (category, recurrence_rule, recurrence_weekdays, impact, urgency, energy_required, focus_required, mental_load, social_load, priority, notes) to the add flow. This duplicates UI and logic; **Option A** is cleaner.

#### 9.2 Where “Add task” is triggered
- Identify every “Add task” entry point on the **Missions page** / Today’s mission card: e.g. “+ Taak toevoegen”, “+ Nog een missie”, quick-add button. Change them to open the **full add form** (EditMissionModal in create mode, or the extended add modal) instead of the simple quick-add.
- Keep **AddMissionModal3** for the “template / DNA” flow if you want that as a separate entry (“Add from template”); for “Add task” on the Today card, use the full form that matches Edit.

#### 9.3 Create-mode API
- **createTask** in `app/actions/tasks.ts` already accepts the same fields as **updateTask** (category, recurrence_rule, recurrence_weekdays, impact, urgency, energy_required, focus_required, mental_load, social_load, priority, notes). Ensure the add form passes all of these so the created task is as editable as an existing one.

**Files to touch**
- `components/missions/EditMissionModal.tsx` — support an optional “create mode”: no `task.id`, prefill with defaults, submit calls `createTask` and then `onAdded` callback; or extract a shared **TaskFormFields** and use it in both Edit and a new **AddTaskFullModal**.
- `components/TaskList.tsx` — where the Today’s mission card “Add task” is rendered, open the full add modal (Edit in create mode or AddTaskFullModal) instead of QuickAddModal or the minimal inline form.
- Optionally: **AddMissionModal3** remains for “Add from template”; ensure at least one prominent “Add task” on the mission page uses the full form.

**Acceptance criteria**
- From the Today’s mission card, “Add task” opens a form with **the same** fields as Edit (title, date, category, recurrence, weekdays, impact, urgency, energy, focus, mental/social load, priority, notes). Created tasks have all these fields set and are editable with the same options.

---

## Implementation order (suggested)

1. **§1 + §7** — Brain status + auto-missions + Vernieuw pagina (uncached daily state, refresh behavior). Quick win for the most reported issue.
2. **§6** — Impact/reputation (fix behaviour_log difficulty_level + xp_gained). Small change, high impact.
3. **§5** — Late-day popup only when really 0 completed (fetch count before showing).
4. **§2** — Local-first + 5s sync (foundation for instant UI everywhere).
5. **§4** — Light version (preference + CSS + tokens).
6. **§8** — 21:00 explanation popup (new table + component).
7. **§3** — Advanced budget (migration + daily flow + detail fields).
8. **§9** — Add task = same as Edit (unify modal or extend add form).

---

## Summary table

| # | Topic | Main fix |
|---|--------|----------|
| 1 | Brain status slow + auto-missions not assigned | Optimistic localStorage + uncached daily_state in ensureMasterMissionsForToday + background save |
| 2 | Instant UI + 5s Supabase sync | Local-first reads + pending-write layer + 5s debounced sync |
| 3 | Budget daily + advanced (supermarket, subscriptions) | New columns + daily flow UI + templates in settings |
| 4 | Light version (low cinematic, fast) | `light_ui` preference + data attribute + CSS overrides for duration/motion |
| 5 | “Nog geen missie” when mission done | Banner fetches completed count before showing; optionally invalidate dashboard cache on complete |
| 6 | Impact never updates | Log difficulty_level from task.impact and xp_gained in behaviour_log |
| 7 | Brain status not recognized + Vernieuw pagina | Same as §1: uncached daily_state + ensure refresh button/link triggers router.refresh() |
| 8 | 9pm popup: explanation for no task | New table + EveningNoTaskModal + save to Supabase |
| 9 | Add task as advanced as Edit | Use EditMissionModal in create mode (or full form) for “Add task” on Today card |

This plan is complete and implementation-ready. If you want, next step can be implementing one section (e.g. §1 + §7) in code step-by-step.
