# NEUROHQ — Suggestions, Actions, Functions & Adjustments

**Purpose:** A single list of concrete suggestions: features to add, functions/actions to implement, logic to adjust, and improvements across product, UX, and tech. Use as a backlog or “nice-to-have” after MVP.

---

## 1. Backend / API / Data

### 1.1 Server actions (Next.js)

- **`saveDailyState(userId, date, { energy, focus, sensory_load, sleep_hours, social_load })`** — Upsert `daily_state`; invalidate dashboard cache.
- **`createTask(userId, { title, due_date, energy_required?, priority? })`** — Insert task; enforce STABILIZE (block if carry_over ≥ 5) and energy budget remaining.
- **`updateTask(id, patch)`** — Update; if `completed = true`, set `completed_at`.
- **`rolloverTasks(userId, fromDate, toDate)`** — Move incomplete tasks; increment `carry_over_count`; return count for avoidance/Stabilize.
- **`getTodaysTasks(userId, mode)`** — Return tasks for today filtered by mode (max 2/3, hide heavy in LOW_ENERGY, sort by priority in DRIVEN).
- **`getEnergyBudget(userId, date)`** — Sum task cost (energy_required×10) + calendar (duration×15, ×1.5 social); return `{ used, remaining, breakdown }`.
- **`getQuoteForDay(dayOfYear)`** — Fetch from `quotes` where id = dayOfYear (1–365).
- **`getWeeklyRealityReport(userId, weekStart)`** — Aggregate tasks done/planned, learning minutes, savings, mood; return structured report.
- **`freezePurchase(entryId, userId)`** — Set `freeze_until = now() + 24h` on `budget_entries`; enforce max 5 active freezes.
- **`confirmOrCancelFreeze(entryId, action)`** — After 24h, mark confirmed or cancelled; set `freeze_reminder_sent`.

### 1.2 API routes

- **`GET/POST /api/cron/daily`** — Already stubbed; implement: for each user where it’s 00:00 in their timezone, run rollover + optional quote push.
- **`GET/POST /api/cron/weekly`** — Generate reality report per user; store or send.
- **`GET/POST /api/cron/quarterly`** — Reset or archive quarterly strategy; optionally notify.
- **`POST /api/push/subscribe`** — Save `push_subscription_json` to `users`; validate VAPID.
- **`GET /api/export`** — JSON export of user data (tasks, budget, learning, etc.) for backup/GDPR.

### 1.3 Edge / DB functions (Supabase)

- **Trigger `on_auth_user_created`** — Insert into `public.users` (or use Edge Function / app logic).
- **RPC `rollover_for_user(p_user_id, p_date)`** — Move incomplete tasks from p_date to next day; return new carry_over counts (callable from cron).
- **RPC `compute_energy_budget(p_user_id, p_date)`** — Return used/remaining (optional; or compute in app).

### 1.4 Data adjustments

- **`tasks.due_date`** — Consider “no date” vs “today”: allow null for backlog and show in a separate “Backlog” view.
- **`budget_entries`** — Add optional `planned_purchase_description` for 24h freeze when amount not yet known.
- **`users`** — Add `impulse_categories` (jsonb array) and `impulse_threshold_pct` (smallint) for financial behaviour config.
- **`daily_state`** — Optional `mood_note` (text) for qualitative context.

---

## 2. Frontend: Components & Pages

### 2.1 Components to build

- **`DailyStateForm`** — Sliders or chips for energy, focus, sensory_load, sleep_hours, social_load; submit → `saveDailyState`.
- **`QuoteCard`** — Display quote of the day (author, era, topic, quote_text); optional “Previous/Next” for browsing.
- **`EnergyBudgetBar`** — Visual “X / 100” with optional breakdown (tasks vs calendar); color shift when &lt; 20 remaining.
- **`TaskList`** — List of tasks for a day; respects mode (count, hide heavy, sort); check to complete; “Add task” (hidden in STABILIZE).
- **`TaskForm`** — Title, optional due_date, energy_required, priority; validate against budget and mode.
- **`ModeBanner`** — Small banner when in LOW_ENERGY / HIGH_SENSORY / DRIVEN / STABILIZE with short explanation.
- **`AvoidanceNotice`** — When carry_over ≥ 3: “3 tasks carried over. Pick one to focus on?” with link to today.
- **`SavingsGoalCard`** — Target, current, weekly required, progress bar.
- **`LearningProgress`** — This week’s minutes (vs 60), streak, optional book progress.
- **`FrozenPurchaseCard`** — List of 24h-frozen items; “Confirm” / “Cancel” after 24h.
- **`RealityReportBlock`** — Summary of last week (tasks, learning, savings, mood); link to full report page.

### 2.2 Pages / routes

- **`/`** — Redirect to `/dashboard` if authenticated else `/login`.
- **`/login`, /signup, /forgot-password`** — Auth pages.
- **`/dashboard`** — Main view: daily state, quote, energy budget, today’s tasks (see Visual doc).
- **`/tasks`** — Full task list (today + backlog or calendar view).
- **`/budget`** — Budget entries, savings goals, frozen purchases, alternatives.
- **`/learning`** — Sessions, weekly target, streak, education options with clarity score.
- **`/strategy`** — Quarterly theme, identity statement, linked savings goal.
- **`/report`** — Weekly reality report (current + history).
- **`/settings`** — Profile, timezone, push preferences, feature toggles (if user-facing), export/delete account.

### 2.3 Hooks and client state

- **`useDailyState(date)`** — Fetch/update daily_state for date; derive mode.
- **`useMode()`** — Returns current mode from daily_state + carry_over_count.
- **`useTodaysTasks()`** — Tasks for today filtered by mode.
- **`useEnergyBudget(date)`** — Used/remaining for date.
- **`useQuote(dayOfYear)`** — Quote for day (cache by day).
- **`useRealityReport(weekStart)`** — Weekly report data.

---

## 3. Features to add or adjust

### 3.1 Task execution

- **Recurring tasks** — Optional repeat rule (daily/weekly) and “template” task; create instance per day or let user “clone today”.
- **Subtasks** — Optional parent_task_id; show as nested in list; completion % or “all done”.
- **“Focus block” (DRIVEN)** — Timer (e.g. 25 min) that creates a calendar block or just tracks; optional “Do not disturb” note.
- **Snooze task** — Move task to tomorrow with one tap instead of rolling over at midnight (user-initiated).

### 3.2 Mood & energy

- **Default daily state** — Pre-fill with yesterday’s values so user only adjusts; optional “Same as yesterday”.
- **Mode explanation** — First time user hits STABILIZE or LOW_ENERGY, short tooltip or modal: “We’ve reduced your list so you can focus.”
- **HIGH_SENSORY persistence** — Remember “minimal UI” preference per session or per day.

### 3.3 Financial

- **Categories preset** — Default categories (food, transport, etc.) + custom; filter report by category.
- **Savings “round-up”** — Optional round-up from budget_entries to a savings goal (e.g. round to nearest 5).
- **Impulse follow-up** — After “Add to freeze”, show reminder in 24h; if they confirm, log as expense; if cancel, suggest alternative (e.g. “Add to savings?”).

### 3.4 Learning

- **Book tracking** — Dedicated “current book” with progress % or “finished”; count toward “1 book/month”.
- **Clarity sort** — Education options list sorted by clarity score; filter “top 3”.
- **Streak badge** — Simple “N weeks in a row” on dashboard when streak ≥ 1.

### 3.5 Philosophy & strategy

- **Quote sharing** — Optional “Copy” or “Share” quote (text only).
- **Quarterly reminder** — First day of quarter: “Set your theme and identity for QX.”
- **Identity on dashboard** — Show current quarter’s identity statement in strategy block.

### 3.6 Calendar

- **Manual events** — Add event without Google (title, start, end, is_social) for energy budget.
- **Conflict hint** — “You have a calendar event at 2pm; consider scheduling tasks around it.”

---

## 4. UX / UI adjustments

- **Onboarding** — 3-step: set timezone → first daily state → first task or goal.
- **Empty states** — Every list and report has a clear empty state + one CTA (add task, add goal, etc.).
- **Loading** — Skeleton for dashboard blocks (quote, tasks, budget) instead of spinners only.
- **Errors** — Inline under form; toast for global errors; “Retry” where appropriate.
- **Offline** — PWA: show “You’re offline” and cached last view (today’s tasks, quote) from IndexedDB.
- **Keyboard** — Dashboard: focus first task; Tab through tasks; Enter to complete.

---

## 5. Performance & infra

- **Caching** — Today’s tasks and quote cached (SW or React cache) with short TTL (e.g. 1 min).
- **Cron per timezone** — Daily cron runs every hour; only processes users where `now()` in their timezone is 00:00–00:59 (or 15-min window).
- **Push “max 3/day”** — Store `push_sent_count` and `push_sent_date` per user; reset at midnight (user TZ); before sending any push, check count.
- **Lighthouse** — Keep PWA ≥90; run in CI or before release.

---

## 6. Security & privacy

- **Export** — Implement `/api/export` with auth; return JSON (tasks, budget, learning, profile); document in Settings.
- **Delete account** — Button in Settings; delete auth user (cascade to public.users and all user rows); confirm with password.
- **Cron auth** — Require `Authorization: Bearer CRON_SECRET` for all cron routes (already stubbed).

---

## 7. Analytics & product

- **Events (optional, privacy-first)** — e.g. “task_completed”, “daily_state_saved”, “report_viewed”; no PII; for “which features are used”.
- **Reality report open rate** — Track if user opens report when sent (in-app or email); no cross-site tracking.

---

## 8. Integrations (future)

- **Google Calendar** — Phase 1 read; Phase 2 two-way (see Calendar Phase 2 doc).
- **Other calendars** — Outlook, Apple (later).
- **Banking (read-only)** — Open Banking for automatic budget entry import (high effort; later).

---

## 9. Content & copy

- **Error messages** — Consistent tone: “Something went wrong. Try again or contact support.”
- **Settings labels** — Clear: “Daily quote notification”, “Time (e.g. 8:00)”, “Export my data”.
- **Help** — Optional “?” tooltips on energy budget, clarity score, and mode names; link to short help page.

---

## 10. DevEx & ops

- **Env check** — On app load (or build), warn if `NEXT_PUBLIC_SUPABASE_URL` is missing.
- **DB types** — `npm run db:types` (Supabase CLI) to regenerate TypeScript types from DB.
- **Staging** — Deploy preview (Vercel) for PRs; use separate Supabase project for staging.
- **Logging** — Structured logs in cron handlers (user id, date, result); optional Sentry for errors.

---

## Summary table (priority for post-MVP)

| Area        | Suggestion                          | Priority |
|------------|--------------------------------------|----------|
| Backend    | Implement rollover + quote in cron   | P0       |
| Backend    | saveDailyState, createTask, getTodaysTasks | P0 |
| Frontend   | DailyStateForm, TaskList, EnergyBudgetBar | P0 |
| Frontend   | ModeBanner, AvoidanceNotice          | P0       |
| Data       | Trigger or Edge Function for users   | P0       |
| UX         | Onboarding, empty states, skeletons  | P1       |
| Financial  | Freeze 24h flow + reminder            | P1       |
| Learning   | Streak, book progress                 | P1       |
| Calendar   | Manual events                        | P1       |
| Push       | VAPID + max 3/day                    | P1       |
| Export/Delete | /api/export, delete account       | P1       |
| Recurring tasks, subtasks, focus block | P2   |
| Analytics (privacy-first)             | P2   |
| Calendar Phase 2 two-way              | P2   |

Use this list to pick the next slice of work after MVP and to keep product and tech aligned.

---

END OF SUGGESTIONS AND ENHANCEMENTS
