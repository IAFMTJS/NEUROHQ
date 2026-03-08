# Site overview: Supabase loads and modals

This doc lists **what gets loaded from Supabase** across the app (including when it happens twice) and **where modals live**, with cleanup ideas so the same modal is not loaded on multiple pages when it can live once.

---

## 1. Dashboard data: when and where it loads

### 1.1 Single entry points that build “dashboard” data

| Trigger | Where | What runs | Supabase (via actions) |
|--------|--------|------------|--------------------------|
| **Server: `getDashboardPayload()`** | `app/(dashboard)/dashboard/page.tsx` (inside `DashboardPayloadAndShell`) | `buildTodayContext()` then `buildCriticalPayload()` + `buildSecondaryPayload()` | See “Tables used by dashboard payload” below. Runs **once** when you open `/dashboard`. |
| **Client: `GET /api/dashboard/data?part=all`** | `DashboardDataProvider` in `app/(dashboard)/layout.tsx` | Same: route handler calls `getDashboardPayload()` | **Same payload again.** Fired by `useEffect` when the layout provider has no `initialCritical`/`initialSecondary`. |
| **Client: `GET /api/dashboard/data?part=critical` or `?part=secondary`** | `DashboardDataProvider` / `DashboardClientShell` (e.g. `fetchCritical()` / `fetchSecondary()`) | Same `getDashboardPayload()`, returns only one part | Same underlying load, different slice. |

So:

- **When you open `/dashboard`**: server runs `getDashboardPayload()` once. The **layout** still mounts `DashboardDataProvider` **without** initial data, so the layout provider’s `useEffect` also calls `preloadDashboard()` → **second full load** via `GET /api/dashboard/data?part=all`. So dashboard data is loaded **twice** on first visit to `/dashboard`.
- **When you open any other dashboard route first** (e.g. `/tasks`): only the layout provider runs; no initial data → one client fetch to `?part=all` (one load).

### 1.2 Tables used by the dashboard payload

These are touched by the actions used inside `getDashboardPayload()` (buildTodayContext, buildCriticalPayload, buildSecondaryPayload and all their callees):

- **daily_state** – today + yesterday state, energy budget, today engine, consequence, recovery, etc.
- **tasks** – today’s tasks, carry-over, energy cap, today engine inputs.
- **user_xp** – XP and level.
- **user_streak** – streak, last completion (today engine, momentum, identity, etc.).
- **user_identity_engine** – archetype, evolution, campaign.
- **user_reputation** – discipline, consistency, impact (identity engine).
- **user_preferences** – light UI, etc.
- **users** – profile, timezone, budget/payday fields, push settings (via budget/auth/preferences).
- **user_skills** – skills (game state, budget-energy, etc.).
- **missions** – game state / today engine (if used).
- **achievements** – game state.
- **task_events** – completions, weekly reports, behaviour.
- **behaviour_log** – identity engine, heatmap, weekly performance, friction, etc.
- **quotes** (or equivalent) – quote for day.
- **learning**-related – weekly minutes, targets, streak (tables as used by learning actions).
- **budget** – budget settings, current month expenses (users, budget_entries, income_sources, etc.).
- **weekly_reports** – weekly performance.
- **behavior_patterns** – weekly performance.
- **reality_reports** / **report** – last week report.
- **quarterly_strategy** – strategy check-in, strategy data.
- **strategy_check_in** – reminder.
- **friction** – friction signals (from behaviour/tasks).
- **adaptive** – suggestions (from daily state / tasks).
- **consequence** – consequence state (daily_state, user_streak, tasks).
- **progression_rank** – rank state.
- **prime_window** – prime window.
- **weekly_budget_adjustment** / **weekly_budget_feedback** – weekly budget outcome.
- **analytics** – week summary, daily analytics (upsert).
- **insight_engine** – insight state (as used by DCIC).
- **confrontation_summary** – confrontation.

So a single `getDashboardPayload()` (or one `GET /api/dashboard/data?part=all`) hits a large subset of these in one go.

---

## 2. Other pages: extra Supabase loads

These run **in addition** to any dashboard client fetch when you visit the page.

### 2.1 `/tasks` (tasks page)

- **Server (page):**
  - `getDailyStateForAllocator()` → **daily_state**
  - `ensureMasterMissionsForToday()`, `ensureReadingMissionForToday()` → **daily_state**, **tasks**, **missions**
  - `getTodaysTasks()`, `getTasksForDate()`, `getSubtasksForTaskIds()`, `getBacklogTasks()`, `getFutureTasks()`, `getCompletedTodayTasks()` → **tasks**
  - `getDecisionBlocks()`, `getResistanceIndex()`, `getMetaInsights30()`, `getRecoveryCampaignNeeded()`, `getEmotionalStateCorrelations()` → **tasks**, **task_events**, **behaviour_log**, etc.
  - `getThirtyDayMirror()` → **tasks** / behaviour
  - `getSmartSuggestion()`, `getEnergyCapToday()` → **user_streak**, **daily_state**, **tasks**
  - `getEnergyBudget()` → **daily_state**, **tasks**, etc.
  - `getXP()`, `getXPIdentity()`, `getIdentityEngine()` → **user_xp**, **user_identity_engine**, **user_reputation**, **user_streak**, **behaviour_log**
  - `getUserPreferencesOrDefaults()` → **user_preferences**

So on `/tasks` you get:

1. **Once**: layout’s dashboard client fetch (`?part=all`) if no initial data.
2. **Again**: full server-side tasks page data (tasks, daily_state, missions, energy, identity, preferences, decision blocks, etc.). Some overlap with dashboard (e.g. `getTodaysTasks`, `getDailyState`, `getEnergyBudget`, `getXP`, `getIdentityEngine`, `getUserPreferencesOrDefaults` are also used inside dashboard payload).

### 2.2 `/dashboard` (dashboard page)

- **Server:** `createClient()` + `getUser()` (auth), then `getDashboardPayload()` (all tables above).
- **Client:** layout’s `DashboardDataProvider` has no initial data, so it runs `preloadDashboard()` → **second** `getDashboardPayload()` via `GET /api/dashboard/data?part=all`.

So dashboard data is loaded **twice** (server + client).

### 2.3 `/xp` (XP page)

- **Server:** `getEnergyBudget()`, `getTodaysTasks()` (and any other XP-specific fetches). Overlaps with dashboard (energy, tasks).

### 2.4 `/budget` (budget page)

- Budget-specific actions (budget_entries, users, recurring_budget_templates, savings_goals, etc.). May still be inside layout, so one dashboard client fetch when opening budget first.

### 2.5 `/assistant` (assistant page)

- Assistant context and DCIC (e.g. assistant_user_context, assistant_conversation_turn, daily_state, tasks, etc.). Dashboard client fetch once if no initial data.

### 2.6 Auth pages (login, signup, forgot-password)

- **Client only:** `createClient()` from `@/lib/supabase/client`; `signInWithPassword`, `signUp`, `resetPasswordForEmail`. No dashboard payload.

### 2.7 API routes

- **`/api/dashboard/data`** – `getDashboardPayload()` (as above).
- **Cron routes** (e.g. daily, weekly, quarterly, evening) – users, tasks, budget_entries, user_streak, etc., depending on cron.

---

## 3. Summary: when is the same thing loaded twice?

| Scenario | What loads twice (or overlaps) |
|----------|--------------------------------|
| Open **`/dashboard`** | `getDashboardPayload()`: once on server (page), once on client (layout provider). |
| Open **`/tasks`** | Dashboard payload (client) **and** tasks page server load both use e.g. `getTodaysTasks`, `getDailyState`, `getEnergyBudget`, `getXP`, `getIdentityEngine`, `getUserPreferencesOrDefaults`. So today’s tasks, daily state, energy, XP, identity, preferences can be loaded twice (once in dashboard fetch, once in tasks page). |
| Navigate dashboard → tasks | Dashboard data already in provider; tasks page still does its own server fetch (tasks, backlog, future, energy, identity, etc.). |

---

## 4. Modals: where they live and duplication

### 4.1 Base components

- **`components/Modal.tsx`** – generic modal (title, subtitle, footer, size, portal).
- **`components/ui/BottomSheet.tsx`** – bottom sheet (modal-style).
- **`components/hq/HQModal.tsx`** – HQ-style modal (backdrop + glass panel).

Most feature modals use `Modal` or `HQModal`; a few (e.g. `FocusModal`) implement their own overlay.

### 4.2 Modals by usage (where they are rendered)

| Modal | Used on page(s) / component(s) | Notes |
|-------|--------------------------------|--------|
| **EditMissionModal** | **TaskList** (tasks), **BacklogAndToekomstTriggers** (tasks) | Same modal type, two separate instances on the same **tasks** page (one in TaskList, one in BacklogAndToekomstTriggers). |
| **ScheduleModal** | **TaskList**, **BacklogAndToekomstTriggers** (tasks) | Same: two instances on tasks page. |
| **ConfirmModal** (delete mission) | **TaskList** | Only in TaskList. |
| **Modal** (generic, “Taak verwijderen?”) | **BacklogAndToekomstTriggers** | Delete confirmation again: different component (generic `Modal`) but same purpose (delete task). |
| **TaskDetailsModal** | **TaskList** (tasks) | One place. |
| **FocusModal** | **TaskList** (tasks) | One place. |
| **Modal** (Do another? / bonus missions) | **TaskList** | One place. |
| **Modal** (All today’s tasks) | **TaskList** | One place. |
| **Modal** (Level up / rank promotion) | **TaskList** | One place. |
| **CalendarModal3** / **CalendarModal3Trigger** | **Tasks page** (TasksCalendarSection), **tasks page** (BacklogAndToekomstTriggers area) | Trigger on tasks; modal can be shared. |
| **BacklogModal** | **BacklogAndToekomstTriggers** (tasks) | One place. |
| **ToekomstModal** | **BacklogAndToekomstTriggers** (tasks) | One place. |
| **YesterdayTasksModal** | **YesterdayTasksSection** (tasks) | One place. |
| **QuickAddModal** / **AddMissionModal3** | **TaskList** (add flows) | TaskList. |
| **EveningNoTaskModal** | **DashboardClientShell** (dashboard) | Dashboard only. |
| **ModeExplanationModal** | **DashboardClientShell** | Rendered **twice** in the same shell (lines ~337 and ~448). Same component, two instances. |
| **LateDayNoTaskBanner** (contains Modal) | **DashboardClientShell** | Dashboard. |
| **EnergyOverBudgetBanner** (Modal) | **DashboardClientShell** | Dashboard. |
| **BrainStatusModal** | **BrainStatusCard** (dashboard / HQ) | Dashboard/HQ. |
| **MissionConfirmationModal** | **Assistant page** | Assistant only. |
| **Modal** (payday, recurring add, edit entry, impulse, etc.) | **PaydayCard**, **RecurringBudgetCard**, **BudgetEntryList**, **AddBudgetEntryForm**, **DashboardQuickBudgetLog**, **RemainingBudgetHero** (HQModal), **NextMonthExpensesModal**, **LastMonthExpensesModal**, **BudgetPlanCard**, **BudgetSummaryCard**, **SettingsExport**, **HowItWorksModal** (SettingsAbout), **EnergyOverBudgetBanner** | Various; many are page-specific (budget vs dashboard vs settings). |

So the main duplication on **one page** is:

- **Tasks page:** EditMissionModal, ScheduleModal, and delete confirmation (ConfirmModal vs generic Modal) each appear in both **TaskList** and **BacklogAndToekomstTriggers**. So the same modal “type” is mounted twice on the same page.
- **Dashboard:** ModeExplanationModal is used twice in **DashboardClientShell**.

---

## 5. Cleanup recommendations

### 5.1 Dashboard data: avoid double load on `/dashboard`

- **Option A:** Have the layout’s `DashboardDataProvider` **not** fetch when it detects that the current route is `/dashboard` and that the page will provide initial data (e.g. via a context or a simple “hasInitialData” from the server). Then the dashboard page can pass initial data into the **layout** provider (e.g. via a wrapper or route segment that provides initial payload for the layout).
- **Option B:** Remove the inner `DashboardDataProvider` from the dashboard page and **only** use the layout provider. Then the dashboard page must pass server-fetched payload into the layout. That typically means lifting “initial data” to a layout that can receive it (e.g. from a parent server component or a cookie/header), which is a bit more involved in App Router.
- **Option C:** Keep current structure but in the layout provider’s `useEffect`: if `window.location.pathname === '/dashboard'`, skip the client fetch and rely on the inner provider’s initial data. That avoids duplicate load when the user is on `/dashboard` (the inner provider has data; the outer one just doesn’t overwrite it and doesn’t fetch). Downside: the outer provider’s state is still “empty” for that route, so any consumer that reads from the outer context on `/dashboard` would see null until the inner one is used.

The cleanest long-term is usually: **one** `DashboardDataProvider` (in the layout), and the dashboard page does a server fetch and passes that as initial data into the layout (e.g. via a pattern that allows layout to receive server data for the initial route).

### 5.2 Tasks page: share mission modals once

- **EditMissionModal** and **ScheduleModal** (and the delete confirmation) are needed from both:
  - **TaskList** (edit/schedule/delete from main list), and
  - **BacklogAndToekomstTriggers** (edit/schedule/delete from backlog/toekomst).
- **Recommendation:** Introduce a **single** mission-modal layer at the **tasks page** (or a shared tasks shell) that owns one instance of:
  - EditMissionModal  
  - ScheduleModal  
  - ConfirmModal (or one generic “delete task” Modal)  
  and pass down callbacks (e.g. `onOpenEdit(task)`, `onOpenSchedule(task)`, `onOpenDelete(id)`) from the page to both TaskList and BacklogAndToekomstTriggers. So the same modal is loaded once and reused from both places.

### 5.3 Dashboard: one ModeExplanationModal

- **ModeExplanationModal** is rendered twice in **DashboardClientShell** (two different spots in the tree). Use a single instance (e.g. one at the top of the shell or inside a single “mode” section) and pass `mode` once.

### 5.4 Shared modal shell (optional)

- If you want to centralise “who mounts modals”, you could add a **ModalsContainer** (or similar) in the dashboard layout that renders:
  - One **EditMissionModal**, **ScheduleModal**, **ConfirmModal** (or delete Modal) for the tasks area, and
  - Any other modals that are used across multiple dashboard pages,
  and drive them via context (e.g. “modal state” + “set open task / schedule task / delete id”). Then TaskList and BacklogAndToekomstTriggers (and any other consumers) only call “open edit/schedule/delete” and don’t mount their own modal instances. That way each modal type is loaded once and reused everywhere.

---

## 6. Quick reference: Supabase tables by area

| Area | Tables (main) |
|------|----------------|
| Auth / profile | users |
| Dashboard payload | daily_state, tasks, user_xp, user_streak, user_identity_engine, user_reputation, user_preferences, users, user_skills, missions, achievements, task_events, behaviour_log, quotes, learning*, budget_*, weekly_reports, behavior_patterns, reality_reports, quarterly_strategy, strategy_check_in, progression_rank, prime_window, weekly_budget_*, analytics, insight_engine, confrontation, consequence |
| Tasks page (extra) | tasks, daily_state, task_events, behaviour_log, user_xp, user_identity_engine, user_reputation, user_streak, user_preferences, missions |
| Budget | users, budget_entries, income_sources, savings_goals, recurring_budget_templates, budget_targets, budget_entries_archive, budget_weekly_reviews, etc. |
| Strategy | quarterly_strategy, strategy_key_results, strategy_check_in, strategy_focus, alignment_log, strategy_review |
| Assistant / DCIC | assistant_user_context, assistant_conversation_turn, daily_state, tasks, user_analytics_daily, identity_events, assistant_feature_flags, user_xp, missions, user_streak, daily_state, achievements, user_skills |
| Identity engine | user_identity_engine, user_reputation, user_streak, behaviour_log |
| Cron / jobs | users, tasks, budget_entries, user_streak, quarterly_strategy, reality_reports, savings_goals, etc. |

This file is the single overview of what gets loaded from Supabase (including duplicates) and where modals are used, so you can clean up double loads and consolidate modal instances (e.g. one EditMissionModal / ScheduleModal / delete confirmation for the whole tasks flow, one ModeExplanationModal for the dashboard).
