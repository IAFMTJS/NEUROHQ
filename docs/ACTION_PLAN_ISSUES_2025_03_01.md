# NEUROHQ — Deep Action Plan: Dashboard, Missions, Budget, Growth & Overall

**Date:** 2025-03-01  
**Scope:** All reported issues with root-cause analysis and concrete steps. No half work.

---

## 1. Dashboard page

### 1.1 Acties button does nothing

**Problem:** In the top strip there is a label/area "Acties"; when the user presses it, nothing happens.

**Root cause:**  
- `DashboardActionsTrigger` exists and opens a bottom sheet with `children` (action items), but it is **never used** in `DashboardClientShell`.  
- The shell only renders a `dashboard-mini-strip` with the text "Acties", a count, and `topQuickActions` as **links**. There is no click handler that opens the actions sheet.  
- So "Acties" is either non-clickable text or a non-interactive wrapper.

**Action plan:**

1. **Wire Acties to the bottom sheet**
   - In `components/dashboard/DashboardClientShell.tsx`, wrap the Acties strip (or replace it) with `DashboardActionsTrigger` from `@/components/dashboard/DashboardActionsTrigger`.
   - Pass `count={actionsCount}` and as `children` render the same actionable content: e.g. list of `topQuickActions` as links plus short labels for each reason (e.g. "Energy over budget", "Streak at risk", "Strategy check-in").
   - Ensure the strip has a clear click target (button or clickable region) that opens the sheet; keep the badge and label inside that target.

2. **Optional: enrich API payload**
   - In `app/api/dashboard/data/route.ts`, the response already has `actionsCount` and `topQuickActions`. If you want the sheet to show human-readable reasons (e.g. "Je bent over je energy budget"), add an optional `actionReasons: string[]` (or reuse existing flags) and pass them into the trigger’s children so the sheet is more than just duplicate links.

**Acceptance criteria:**

- [ ] Clicking "Acties" (or the Acties area) in the dashboard top strip opens the bottom sheet.
- [ ] Sheet shows at least the same quick actions as the strip (e.g. Streak, Licht, 1 Actie, Strategy, Micro, Carry, Tip) as links.
- [ ] Sheet closes on overlay click or close button; accessibility (focus trap, aria) is correct.

---

### 1.2 Cards minimizable like Energy budget (Vandaag door de app, Systeem modus, Active missions, Level specifics)

**Problem:** The cards "Vandaag door de app bepaald" (TodayEngineCard), "Systeem modus" (BrainStatusCard / mode), "Active missions" (ActiveMissionCard), and "Level specifics" (IdentityBlock / level card) should be minimizable with an option to maximize again, like the Energy budget card.

**Root cause:**  
- Only `EnergyBudgetBar` implements expand/collapse (`isExpanded` state and "Expand" / "Minimize" button).  
- Other dashboard cards are always fully expanded with no collapse UI.

**Action plan:**

1. **Create a reusable collapsible card wrapper**
   - Add a small component, e.g. `CollapsibleDashboardCard`, in `components/dashboard/` that:
     - Takes `title`, `subtitle` (optional), `children`, and optional `defaultExpanded` (e.g. `true`).
     - Renders a header row with title + "Expand" / "Minimize" button (same pattern as `EnergyBudgetBar`).
     - When collapsed: only header is visible; when expanded: header + children.
     - Uses local state (e.g. `useState(defaultExpanded)`); optionally persist per-card key in `localStorage` so user preference survives refresh.

2. **Wrap the four cards**
   - **TodayEngineCard** (Vandaag door de app bepaald): wrap in `CollapsibleDashboardCard`; id e.g. `dashboard-card-today-engine`.
   - **BrainStatusCard** (Systeem modus / brain status): wrap in `CollapsibleDashboardCard`; id e.g. `dashboard-card-brain-status`.
   - **ActiveMissionCard**: wrap in `CollapsibleDashboardCard`; id e.g. `dashboard-card-active-missions`.
   - **IdentityBlock + MomentumScore** (level/identity and momentum): these sit in one section; either wrap the combined section in one collapsible ("Level & momentum") or wrap IdentityBlock and MomentumScore separately. Prefer one "Level specifics" card that contains both, id e.g. `dashboard-card-level`.

3. **Consistency**
   - Reuse the same button/label style as Energy budget ("Expand" / "Minimize") and same aria attributes (`aria-expanded`, `aria-label`).

**Acceptance criteria:**

- [ ] Each of the four areas (Today engine, Systeem modus, Active missions, Level specifics) has a visible "Minimize" / "Expand" control in the header.
- [ ] Collapsed state shows only the header; expanded state shows full content.
- [ ] Optional: collapsed/expanded state persists per card across page refresh (e.g. via localStorage).

---

### 1.3 Quick budget log button under Command dashboard and Level card

**Problem:** Under the Command dashboard card and the Level card there should be a small "quick budget log" button for faster use.

**Root cause:**  
- Budget logging is reached via navigation to the Budget page and then adding an entry; there is no one-click shortcut from the dashboard.

**Action plan:**

1. **Add a compact CTA component**
   - Create `DashboardQuickBudgetLog.tsx` (or add to an existing dashboard component): a small button or link that:
     - Links to `/budget#add-entry` (or to a budget quick-log route if you add one).
     - Uses a clear label, e.g. "Log uitgave" or "Quick log" with a small icon.
     - Styling: same family as other dashboard mini-actions so it doesn’t dominate.

2. **Placement**
   - In `DashboardClientShell.tsx`, add this component in **two** places as requested:
     - Directly under the Command bridge frame (SciFiPanel with CommanderHomeHero).
     - Directly under the Level/identity section (under the IdentityBlock + MomentumScore block, or under the collapsible "Level specifics" card once that exists).
   - Keep the same component in both places for consistency (same href and behavior).

**Acceptance criteria:**

- [ ] A small "Quick budget log" (or equivalent) button appears under the Command dashboard card.
- [ ] The same (or equivalent) button appears under the Level card / level specifics section.
- [ ] Clicking it takes the user to the budget page with focus or scroll to add-entry (e.g. `#add-entry`).

---

## 2. Mission page (Tasks)

### 2.1 Tasks vs Todays missions card + "ace" in top right

**Problem:** Between the "Energy vandaag" card and the "Todays missions" card there are tasks (the main TaskList). If tasks are shown there, the same missions should not also appear in the "Todays missions" card — that’s visual overkill. Also, in the top-right corner there is something with text "ace".

**Root cause:**  
- **Duplicate content:** The missions page shows both (1) the main task list (TaskList) and (2) a "Todays missions" / mission-cards section (e.g. CommanderMissionCard grid). When both show the same day’s missions/tasks, it’s redundant.  
- **"ace" text:** Likely sources: (a) "Today" in the glow-pill truncated or styled in a way that looks like "ace"; (b) a WebGL/Three.js context (e.g. `ACESFilmicToneMapping` in `MissionButton.tsx`) leaking into a label or dev overlay; (c) another small label or CSS pseudo-element. Needs a quick visual/dom check.

**Action plan:**

1. **Avoid showing missions twice when tasks are present**
   - In `app/(dashboard)/tasks/page.tsx`, the layout order is: header → EnergyCapBar / ConsequenceBanner / … → mission cards (CommanderMissionCard) → TaskList.
   - Decide a single rule, e.g.:
     - **Option A:** If there are tasks for today (`tasks.length > 0`), hide the "Todays missions" mission-cards section (the CommanderMissionCard grid) so only the TaskList represents "what to do today". Mission cards can still be shown when there are no tasks (e.g. empty state).
     - **Option B:** Keep mission cards but only for non-task items (e.g. auto-missions that are not in the task list), and ensure the task list is the single source of truth for "today’s tasks". That requires a clear data split (tasks vs other missions) and may be more complex.
   - Recommended: **Option A** — when `tasks.length > 0`, do not render the mission-cards section; when zero tasks, show the mission cards as today’s entry point. Optionally show a short line like "X taken vandaag" above the TaskList instead of the full mission grid.

2. **Find and fix "ace"**
   - In the Missions page layout, search for: (a) the `glow-pill` that contains "Today" — ensure the text is fully visible and not clipped (check overflow, width, font); (b) any canvas/WebGL element (e.g. from MissionButton or a 3D component) that might expose "ACES" or similar to the DOM (e.g. canvas title, aria-label, or a dev-only overlay); (c) any other node with "ace" in text or class.  
   - Fix: either remove the stray label, fix the "Today" pill so it’s not misread as "ace", or hide/rename the WebGL-related label so it doesn’t appear in the UI.

**Acceptance criteria:**

- [ ] When there are tasks for today, the Todays missions card (mission grid) is not shown (or is clearly secondary and not duplicate).
- [ ] When there are no tasks, the mission card section still provides value (e.g. empty state or auto-missions).
- [ ] No visible "ace" (or similar) in the top-right of the Missions page; "Today" is fully visible and correct.

---

### 2.2 Remove "Reset auto missions today" button and function

**Problem:** The reset auto missions today function and button may be removed because the underlying problem was fixed.

**Root cause:**  
- `ResetAutoMissionsButton` and `resetAutoMissionsForToday()` were added as a workaround; they are no longer needed.

**Action plan:**

1. **Remove from Tasks page**
   - In `app/(dashboard)/tasks/page.tsx`, remove the import and usage of `ResetAutoMissionsButton` (and the dynamic import block for it). Remove the `<ResetAutoMissionsButton dateStr={dateStr} />` node from the mascot-follow-row (or wherever it is rendered).

2. **Remove component and server action**
   - Delete or deprecate `components/missions/ResetAutoMissionsButton.tsx`.
   - In `app/actions/master-missions.ts`, remove or deprecate `resetAutoMissionsForToday`. If other code calls it, remove those calls first. If you prefer to keep the function for admin/debug, move it to an internal/admin-only module and do not expose it in the UI.

3. **Cleanup**
   - Search the repo for `resetAutoMissionsForToday` and `ResetAutoMissionsButton`; ensure no remaining references in UI or public API.

**Acceptance criteria:**

- [ ] The Missions/Tasks page no longer shows a "Reset auto missions today" button.
- [ ] No remaining references to `ResetAutoMissionsButton` in the app UI.
- [ ] Optional: `resetAutoMissionsForToday` removed or moved to admin-only; no user-facing flow depends on it.

---

## 3. Budget page

### 3.1 Risk Insight — overspend shown as "per day" (e.g. €522/day) instead of total for period

**Problem:** Risk insight says the user spends e.g. €522 per day, while in reality they spent about that much in the **entire period**. So the figure is wrong or the wording is misleading.

**Root cause:**  
- In `lib/dcic/finance-engine.ts`, `calculateBurnRate()` returns **average spend per day** (totalSpent / daysSinceStart).  
- `daysSinceStart` is computed as `Math.max(1, day - financeState.cycle.startDay + 1)` where `day` is `today.getDate()` (1–31). This is **wrong across month boundary**: e.g. if payday is 25th and today is 1st, that gives 1 - 25 + 1 = -23 → 1, so `daysSinceStart = 1` and burn rate = totalSpent, which is then shown as "€X/dag". So the user’s total period spend is shown as if it were daily.  
- So the bug is: **daysSinceStart** must be the real number of calendar days from cycle start to today, not a day-of-month difference.

**Action plan:**

1. **Fix daysSinceStart in finance-engine**
   - In `lib/dcic/finance-engine.ts`, in `calculateBurnRate()`:
     - Use `financeState.cycle.startDate` (or derive cycle start date from cycle start) and compute actual calendar days from that date to today (inclusive or exclusive consistently).
     - Replace `daysSinceStart = Math.max(1, day - financeState.cycle.startDay + 1)` with something like:
       - `const start = new Date(financeState.cycle.startDate + 'T12:00:00Z');`
       - `const daysSinceStart = Math.max(1, Math.floor((today - start) / (24 * 60 * 60 * 1000)) + 1);` (or equivalent safe date diff).
     - Ensure `cycleExpenses` still filters by the same cycle (expense date >= cycle start).

2. **Clarify Risk Insight copy**
   - In `generateInsights()` the message already says "Gebaseerd op je huidige uitgavenpatroon (€X/dag)". After the fix, X will be the true daily average. Optionally add one line: "Totaal uitgegeven in deze periode: €Y" so users see both period total and daily average.

**Acceptance criteria:**

- [ ] For a user who has spent ~€522 in the whole period (e.g. 20 days), Risk Insight does not show "€522/dag"; it shows a plausible daily average (e.g. ~€26/dag) and total overspend for the period where applicable.
- [ ] Copy clearly distinguishes "uitgavenpatroon (€X/dag)" from "overspend by €Z" (total by end of period).

---

### 3.2 Daily control missions: remove from Tactical tab, show once as toast on Overview

**Problem:** On the Tactical control tab, "Daily control missions" should disappear from that tab and appear only once per day as a toast on the Overview tab, because those missions are auto-completed by the system at end of day when criteria are met.

**Root cause:**  
- `DailyControlMissionsCard` is currently rendered in the Tactical section (`tacticalSection` in budget page).  
- There is no toast on Overview for daily control completion, and no "once per day" constraint.

**Action plan:**

1. **Remove DailyControlMissionsCard from Tactical tab**
   - In `app/(dashboard)/budget/page.tsx`, remove `<DailyControlMissionsCard ... />` from `tacticalSection`. Optionally leave the rest of the tactical layout (WeeklyTacticalCard, PaydayCard, etc.) as is.

2. **Toast on Overview, once per day**
   - Add a small client component or use an existing toast system (e.g. sonner, react-hot-toast, or a custom toast from context) that:
     - On Budget page load (Overview tab), checks whether the user has completed (or will auto-complete) today’s daily control missions and whether a toast for "daily control" has already been shown today (e.g. `sessionStorage` or a user preference: `budget_daily_control_toast_YYYY-MM-DD`).
     - If not yet shown today and there is something to say (e.g. "Daily control missions worden aan het einde van de dag automatisch afgevinkt als je aan de criteria voldoet"), show the toast once and set the flag for today.
   - Ensure the toast is non-blocking and only on Overview (not on Tactical/Analysis/Goals).

3. **Optional: backend for "auto-completed at end of day"**
   - If not already implemented, ensure a cron or end-of-day job marks daily control missions complete when criteria are met; the toast can simply explain that behavior.

**Acceptance criteria:**

- [ ] Tactical tab no longer shows the Daily control missions card.
- [ ] On opening the Budget page on the Overview tab, a toast about daily control (auto-completion at end of day) appears at most once per day.
- [ ] No duplicate toasts on refresh within the same day.

---

### 3.3 Tactical and Analysis tabs both have "Uitgaven per categorie" and "Budgetplan per categorie" — keep on one tab only

**Problem:** Tactical control and Analysis tabs both contain "Uitgaven per categorie" and "Budgetplan per categorie"; it should only appear on one tab.

**Root cause:**  
- **Tactical:** `tacticalSection` includes `CategorySpendingCard`, which internally uses `BudgetPlanCard` ("Budgetplan per categorie").  
- **Analysis:** `analysisSection` includes `ExpenseDistributionChart` (uitgaven per categorie) and `BudgetPlanCard` again.  
- So both tabs show category spending and budget plan.

**Action plan:**

1. **Choose a single tab for category + budget plan**
   - Recommended: keep **Analysis** as the place for "Uitgaven per categorie" (chart) and "Budgetplan per categorie" (BudgetPlanCard). Remove them from Tactical.

2. **Remove from Tactical**
   - In `app/(dashboard)/budget/page.tsx`, remove from `tacticalSection`:
     - `<CategorySpendingCard ... />` (which embeds BudgetPlanCard).
   - Keep on Tactical: DailyControlMissionsCard (until you remove it per 3.2), WeeklyTacticalCard, PaydayCard, FrozenPurchaseCard, BudgetQuickLogCard.

3. **Keep on Analysis**
   - Leave `ExpenseDistributionChart` and `BudgetPlanCard` in `analysisSection` unchanged.

**Acceptance criteria:**

- [ ] "Uitgaven per categorie" and "Budgetplan per categorie" appear only on the Analysis tab (or only on one chosen tab), not on Tactical.
- [ ] Tactical tab no longer shows CategorySpendingCard / BudgetPlanCard.

---

## 4. Growth page (Learning)

### 4.1 Reflection card does not save input

**Problem:** The Reflection card shows "Saving" on the button but after refresh the input is gone; nothing is persisted.

**Root cause:**  
- `submitLearningReflection` in `app/actions/learning-state.ts` inserts into `learning_reflections`.  
- There is **no migration that creates the `learning_reflections` table** in the repo (only `017_learning_growth_schema.sql` for other learning tables). So the table likely doesn’t exist, the insert fails, the server returns `false`, and the client never sets `submitted` to true; on refresh the form is empty because state is not persisted.  
- Additionally, the form does not prefill from the database (no load of last reflection text), so even if the table existed, the UI wouldn’t show saved content until you add that.

**Action plan:**

1. **Create `learning_reflections` table**
   - Add a new migration, e.g. `supabase/migrations/068_learning_reflections.sql`:
     - `CREATE TABLE IF NOT EXISTS public.learning_reflections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, date date NOT NULL, understood text, difficult text, adjust text, created_at timestamptz DEFAULT now());`
     - Unique constraint or unique index on `(user_id, date)` so one reflection per user per day.
     - RLS: enable RLS; policy so `user_id = auth.uid()` for SELECT/INSERT/UPDATE.
     - Add a comment that the table is used by the Growth/Learning reflection card.

2. **Verify insert and error handling**
   - After migration, confirm `submitLearningReflection` succeeds (no silent fail). Optionally in dev log the error when insert fails so you can see missing table or RLS issues.
   - In `GrowthReflectionCard`, you already only set `setSubmitted(true)` when `ok === true`; that’s correct. Ensure the button shows "Saving…" during the transition and "Saved" after success.

3. **Optional: load and prefill**
   - In `getLearningState()` (or a dedicated getter), load the latest reflection for the current week (or for `today`) from `learning_reflections` and extend `LearningReflectionState` (or a new field) with `lastUnderstood`, `lastDifficult`, `lastAdjust`.  
   - In `GrowthReflectionCard`, initialize local state from those props when present so that after save and refresh the user sees their saved text.

**Acceptance criteria:**

- [ ] Table `learning_reflections` exists with correct columns and RLS.
- [ ] Submitting the Reflection form persists data (no console errors, insert succeeds).
- [ ] After refresh, either the form shows "Saved" and the fields are pre-filled from DB, or at least a second submit doesn’t lose data and the card shows saved state.
- [ ] Button states: "Save reflection" → "Saving…" → "Saved" and stay "Saved" when data is persisted.

---

## 5. Overall site

### 5.1 Pages load slowly — identify causes of excess load time

**Problem:** Some pages still load very slowly; we need to know what causes the excess load time.

**Root cause:**  
- Existing `docs/duplicate-load-analysis.md` already documents: duplicate loads of `daily_state`, `tasks`, `getTodayEngine`, `getEnergyBudget`, `getFinanceState`, `user_streak`, etc., across dashboard critical/secondary and other pages.  
- No single bottleneck is called out; it’s a combination of duplicate work and lack of shared caching.

**Action plan:**

1. **Measure**
   - Add lightweight timing in key server routes/pages: e.g. log or return (in dev) timings for:
     - Dashboard: `getDailyState`, `getTodaysTasks`, `getTodayEngine`, `getEnergyBudget`, and total critical + secondary.
     - Tasks page: `ensureMasterMissionsForToday`, `getTodaysTasks`, `getMode`, `getEnergyBudget`, and any other heavy Promise.all entries.
     - Budget page: `getFinanceState`, `getBudgetEntries`, and other big fetches.
   - Optionally use React Server Component profiling or a single `performance.mark`/`measure` in the server tree to see which async branches dominate.

2. **Apply duplicate-load doc**
   - Reduce duplicate loads as in `duplicate-load-analysis.md`: e.g. call `getDailyState` once per request and pass the result into `getMode`, `getTodayEngine`, `getEnergyBudget` where the API allows; load tasks once and reuse for dashboard and energy budget where possible.
   - Use `unstable_cache` (or equivalent) for pure reads keyed by `user.id` and `date`/route, with invalidation on mutation (e.g. daily state save, task complete).

3. **Defer non-critical data**
   - Dashboard: keep critical (state, tasks, energy, XP, actions) in the first payload; load secondary (identity, momentum, quotes, heatmap, etc.) in a follow-up request or stream so TTFB improves.
   - Lazy-load heavy components (charts, 3D, reports) with dynamic import and loading states where already possible.

4. **Document findings**
   - Update or add a short "Performance" section in the repo: which changes were made and what the main causes of load time were (e.g. "dashboard: 3× tasks, 4× daily_state; fixed by …").

**Acceptance criteria:**

- [ ] There is a clear list of the top 3–5 causes of slow load (e.g. duplicate tasks/daily_state, uncached finance state, heavy secondary payload).
- [ ] At least one concrete change is implemented (e.g. single daily_state + pass-through, or single getTodaysTasks for dashboard) and verified to reduce load time or request count.
- [ ] Optional: simple timing logs or metrics in dev to prevent regressions.

---

### 5.2 Everything that can be state should be in state; only user-specific in Supabase

**Problem:** User wants as much as possible in (client/global) state and only user-specific data in Supabase, so the site stays smooth.

**Root cause:**  
- Today much of the app is server-driven: every navigation refetches from Supabase. There is no global client cache (e.g. React Query, SWR, or a custom store) for user-agnostic or slowly changing data, and user data is refetched on each page load.

**Action plan:**

1. **Define boundaries**
   - **Supabase (server):** user-specific and mutable: tasks, daily_state, budget_entries, learning_sessions, reflections, xp, streak, settings, etc.  
   - **State/cache (client or server cache):** static or shared: e.g. mission templates, quote list, default categories, app config, static copy. Optionally cache per-user read-heavy data (e.g. today’s tasks, today’s daily_state) in client state with invalidation on mutation.

2. **Introduce client-side cache for key data**
   - Use a data layer (e.g. React Query, SWR, or Zustand + fetch) for:
     - Today’s tasks, today’s daily_state, energy budget for today — so dashboard and tasks don’t refetch on every tab switch if already loaded.
     - Invalidation: when user completes a task, updates daily state, or logs budget entry, invalidate the relevant keys so the next read is fresh.
   - Keep mission templates, quotes, and other non-user data in code or in a single fetch and reuse (no Supabase for that if not needed).

3. **Server**
   - Where possible, pass cached or single-load data through (e.g. dashboard API returns one combined payload and client stores it); avoid duplicate server calls for the same logical data in one session.

**Acceptance criteria:**

- [ ] A short doc or comment states what is "state/cache" vs "Supabase" (user-specific).
- [ ] At least one major flow (e.g. dashboard → tasks) reuses already-loaded data (e.g. today’s tasks or daily_state) from client cache instead of refetching on every visit.
- [ ] Mutations (task complete, state save, budget log) invalidate the relevant cache so the UI stays correct.

---

### 5.3 Visuals / spacing — optimal use of screen, native-app look

**Problem:** Layout doesn’t use optimal spacing; it looks like something copied onto a screen rather than a native app.

**Root cause:**  
- Generic container widths, gaps, and padding; possibly no consistent use of safe areas, max widths, or responsive spacing tokens.

**Action plan:**

1. **Audit spacing tokens**
   - Define or consolidate in CSS (or Tailwind): page padding (e.g. `--page-padding`), card gap (`--card-gap`), section spacing, and max content width. Use these consistently on dashboard, missions, budget, growth.

2. **Layout**
   - Use a single main container with max-width and horizontal padding that respects safe area (padding-left/right from env(safe-area-inset) if needed for notched devices).
   - Use a consistent vertical rhythm: e.g. section spacing (e.g. 24px or 1.5rem), card internal padding (e.g. 16px/20px). Avoid one-off margins that break rhythm.

3. **Cards and panels**
   - Ensure cards have consistent border-radius and padding; use the same "glass" or "card" classes across dashboard/missions/budget so it doesn’t look patched together.
   - Optional: add subtle background or hierarchy (e.g. one primary content column, sidebar or secondary blocks) so the layout feels intentional.

4. **Responsive**
   - On small screens, reduce padding and gaps slightly; ensure touch targets are at least 44px and that the top strip and key CTAs don’t feel cramped.

**Acceptance criteria:**

- [ ] Spacing is driven by a small set of tokens (or Tailwind spacing scale) used across main pages.
- [ ] Main content has a clear max-width and consistent horizontal padding; vertical rhythm is consistent.
- [ ] Subjective: layout feels cohesive and "native-app" rather than a pasted layout.

---

### 5.4 Mission/task descriptions for coded missions

**Problem:** If all missions except user-added ones are coded in the site, it should be easy to add a description for each and display it.

**Root cause:**  
- Mission templates (e.g. in `lib/mission-templates.ts`) and master/auto-missions may not expose a `description` field; the UI may not show it.

**Action plan:**

1. **Add description to templates**
   - In the mission template type and in `lib/mission-templates.ts` (or wherever templates are defined), add an optional `description: string | null` for each template. Fill short, helpful descriptions (what the mission is, when it helps).

2. **Propagate to tasks/missions**
   - When creating tasks from templates (e.g. in master-missions or task creation), store the description (e.g. in task `description` or a linked template field) so the UI can read it.

3. **Display**
   - In the mission/task list and in mission cards (e.g. CommanderMissionCard, TaskList item, or task detail modal), show the description (e.g. under the title or in an expandable section). User-added tasks can have an empty description or "Custom task".

**Acceptance criteria:**

- [ ] Every coded (template) mission has a description field and text.
- [ ] Description is visible in at least one place (e.g. task detail, mission card, or list row tooltip).

---

### 5.5 Auto-missions still shown as S-rank in some system parts

**Problem:** Auto-missions are still being rated as S-rank in some parts of the system instead of the rank they were assigned.

**Root cause:**  
- Performance rank (S/A/B/C) can come from: (1) completion score (e.g. `lib/performance-rank.ts`, `getRankFromScore`), (2) behaviour_log / task_events `performance_rank`, (3) mission difficulty rank (e.g. UMS-based in `lib/mission-difficulty-rank.ts`).  
- Auto-missions might get a default or unset rank and some code path treats "no rank" or "default" as S. Or the rank is computed at completion and one path (e.g. DCIC execution-core or simulation) always returns S for certain mission types.

**Action plan:**

1. **Find all rank sources**
   - Grep for `performance_rank`, `performanceRank`, `getRankFromScore`, `calculateRank`, and "S" rank defaults. Key files: `lib/performance-rank.ts`, `lib/dcic/execution-core.ts`, `app/actions/dcic/behaviour-log.ts`, `app/actions/identity-drift.ts`, mission completion flow, and any UI that shows rank (e.g. InsightsRecentRanksCard, report page).

2. **Assign rank for auto-missions**
   - When an auto-mission (or template-based task) is completed, ensure the stored `performance_rank` is the one from the completion score (or the template-assigned difficulty rank), not a hardcoded S.  
   - In `lib/dcic/execution-core.ts` (and similar), avoid defaulting to `"S"` for missions that have an explicit rank from template or from score; use the computed rank from `getRankFromScore(score)` or the template rank.

3. **Display**
   - Where recent completions or reports show rank, ensure they read from the same source (e.g. behaviour_log.performance_rank or task_events.performance_rank) and that auto-missions have that field set to their actual rank, not S.

**Acceptance criteria:**

- [ ] Completing an auto-mission stores the correct performance rank (from score or template), not S by default.
- [ ] Insights/report and any "recent ranks" UI show the stored rank for auto-missions (e.g. A or B when that’s what was assigned).
- [ ] No code path defaults auto-missions to S unless the score actually qualifies as S.

---

## Implementation order (suggested)

1. **Quick wins:** 1.1 (Acties), 2.2 (remove reset), 3.3 (dedupe category/budget plan tabs), 4.1 (reflection table + save).  
2. **Data correctness:** 3.1 (overspend/burn rate), 5.5 (S-rank).  
3. **UX:** 1.2 (collapsible cards), 1.3 (quick budget log), 2.1 (tasks vs missions + ace), 3.2 (daily control toast).  
4. **Larger:** 5.1 (load time), 5.2 (state vs Supabase), 5.3 (spacing), 5.4 (descriptions).

---

*End of action plan. Update this doc as items are completed.*
