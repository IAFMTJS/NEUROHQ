# NEUROHQ — Full Action Plan: From Spec to Reality

**Purpose:** Turn the Master Architecture and Database/Infrastructure specs into a shipped PWA, phase by phase.

**Estimated total:** ~12–16 weeks for MVP; full vision ~20–24 weeks (adjust by team size).

---

## Phase 0: Foundation (Week 1)

**Goal:** Repo, tooling, and environment ready for development.

| # | Task | Details | Done |
|---|------|---------|------|
| 0.1 | Create Next.js app | `npx create-next-app@latest` — App Router, TypeScript, Tailwind, ESLint. No `src/` if you prefer flat structure. | ☐ |
| 0.2 | Install core deps | `@supabase/supabase-js`, `@supabase/ssr`, `next-pwa`, `date-fns` (or similar). | ☐ |
| 0.3 | Supabase project | Create project at supabase.com; note URL and anon key. | ☐ |
| 0.4 | Environment variables | `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_VERSION=1.0.0`. Add `.env.local` to `.gitignore`. | ☐ |
| 0.5 | Supabase client helpers | Create `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase/middleware.ts` for session refresh. | ☐ |
| 0.6 | Folder structure | `app/(auth)`, `app/(dashboard)`, `components/`, `lib/`, `types/`, `hooks/`, `styles/`. | ☐ |
| 0.7 | Base layout & theme | Root layout, Tailwind config, CSS variables for light/dark if needed. | ☐ |

**Exit criteria:** App runs locally; Supabase client works in browser and server; env is documented in README.

---

## Phase 1: Auth & Database Schema (Week 2)

**Goal:** Users can sign up/in; all tables exist with RLS.

| # | Task | Details | Done |
|---|------|---------|------|
| 1.1 | Supabase Auth | Enable Email/Password (and optionally OAuth later for Google Calendar). | ☐ |
| 1.2 | Auth UI | Login, signup, forgot-password pages under `app/(auth)/`. Redirect to dashboard when authenticated. | ☐ |
| 1.3 | Middleware | Protect `/dashboard` (and all app routes); redirect unauthenticated to login. | ☐ |
| 1.4 | `users` table | Profile fields (e.g. display_name, avatar_url, timezone). Trigger or Edge Function to create row on `auth.users` insert. | ☐ |
| 1.5 | Core tables (SQL migrations) | Create in Supabase SQL Editor (or migrations): `daily_state`, `tasks`, `budget_entries`, `savings_goals`, `learning_sessions`, `education_options`, `calendar_events`, `quotes`, `feature_flags`, `alternatives`. All with `user_id` (UUID), `created_at`; user-bound. | ☐ |
| 1.6 | RLS policies | Every user table: `USING (auth.uid() = user_id)` for SELECT/INSERT/UPDATE/DELETE. Add admin override policy (e.g. service role or admin role). | ☐ |
| 1.7 | Seed `quotes` | Import 365 quotes from `365_Philosophical_Quotes_Structured.txt` into `quotes` (id 1–365, name, era, quote, topic). | ☐ |
| 1.8 | TypeScript types | Generate or hand-write types for all tables; keep in `types/` or `lib/database.types.ts`. | ☐ |

**Exit criteria:** Sign up → profile row created; RLS blocks cross-user access; 365 quotes in DB.

---

## Phase 2: Task Execution Engine & Daily State (Weeks 3–4)

**Goal:** Users can create/manage tasks; daily rollover and carry-over logic exist.

| # | Task | Details | Done |
|---|------|---------|------|
| 2.1 | Tasks CRUD API | Server actions or API routes: create, update, delete, list by date. | ☐ |
| 2.2 | Tasks UI | Task list for “today”; add task form; mark complete; optional due date. | ☐ |
| 2.3 | `daily_state` table usage | One row per user per day: energy, focus, sensory_load, sleep_hours, social_load (or as per spec). Form to capture each day. | ☐ |
| 2.4 | Task rollover logic (backend) | Function (Edge Function or Vercel serverless): at 00:00, find yesterday’s incomplete tasks; move to today; increment `carry_over_count`. | ☐ |
| 2.5 | Carry-over rules in UI | If `carry_over_count >= 3` → show avoidance notice; if `>= 5` → trigger Stabilize Mode (see Phase 3). | ☐ |
| 2.6 | Task fields | Include `energy_required` (for Energy Budget later), priority, optional project/category. | ☐ |

**Exit criteria:** Tasks persist; rollover runs (manually or via cron); carry-over count drives notices.

---

## Phase 3: Mood & Energy Adaptive Engine (Week 5)

**Goal:** UI and behavior adapt to energy, focus, sensory load, and Stabilize Mode.

| # | Task | Details | Done |
|---|------|---------|------|
| 3.1 | Daily state form | Inputs: energy (1–10), focus (1–10), sensory_load (1–10), sleep_hours, social_load. Save to `daily_state`. | ☐ |
| 3.2 | Mode derivation logic | In `lib/` or server: compute mode from daily_state + carry_over_count. Modes: LOW_ENERGY (energy ≤4), HIGH_SENSORY (sensory_load ≥7), DRIVEN (energy & focus ≥7), STABILIZE (carry_over ≥5). | ☐ |
| 3.3 | LOW_ENERGY | Max 3 tasks visible; hide “heavy” (high energy_required) tasks. | ☐ |
| 3.4 | HIGH_SENSORY | Minimal UI; reduced or no push notifications. | ☐ |
| 3.5 | DRIVEN | Prioritize high-impact tasks; enable “focus block” (e.g. timer). | ☐ |
| 3.6 | STABILIZE | Only 2 tasks visible; block new task creation. | ☐ |
| 3.7 | Dashboard reads mode | Dashboard layout and task list respect current mode. | ☐ |

**Exit criteria:** Changing daily state changes visible tasks and capabilities; Stabilize blocks new tasks.

---

## Phase 4: Energy Budget Engine (Week 6)

**Goal:** Daily capacity 100; tasks and calendar consume it; remaining shown.

| # | Task | Details | Done |
|---|------|---------|------|
| 4.1 | Task cost | `task_cost = energy_required × 10` (cap if needed). | ☐ |
| 4.2 | Calendar cost | `duration_hours × 15` per calendar event (from `calendar_events` or synced). | ☐ |
| 4.3 | Social multiplier | Apply ×1.5 for events/entries marked “social”. | ☐ |
| 4.4 | Daily total | Sum task costs + calendar costs (with multiplier); subtract from 100. | ☐ |
| 4.5 | Energy budget UI | Show “Remaining: X/100” and optional breakdown (tasks vs calendar). | ☐ |
| 4.6 | Optional guardrails | Warn or block adding tasks when remaining &lt; 0 (or threshold). | ☐ |

**Exit criteria:** Budget updates with tasks/calendar; remaining capacity visible on dashboard.

---

## Phase 5: Financial System (Weeks 7–8)

**Goal:** Savings goals, budget entries, impulse detection, 24h freeze, alternatives.

| # | Task | Details | Done |
|---|------|---------|------|
| 5.1 | Savings goals CRUD | Create/update/delete savings goals (target, current, deadline). | ☐ |
| 5.2 | Weekly required | Compute and display weekly amount needed to hit goal by deadline. | ☐ |
| 5.3 | Budget entries | Log income/expense; link to categories; date. | ☐ |
| 5.4 | Impulse detection (heuristic) | e.g. Unplanned expense above X or frequent small spends; flag and optionally notify. | ☐ |
| 5.5 | 24h freeze | “Freeze” a planned purchase 24h; reminder to confirm or cancel. | ☐ |
| 5.6 | Alternatives table | Suggest alternatives (e.g. cheaper or delayed option); show in UI when relevant. | ☐ |
| 5.7 | Financial dashboard | Summary: goals progress, recent entries, alerts. | ☐ |

**Exit criteria:** User can set a savings goal, log entries, see weekly target; freeze and alternatives usable.

---

## Phase 6: Learning & Education System (Weeks 9–10)

**Goal:** Weekly 60 min learning; monthly 1 book; clarity score for education options.

| # | Task | Details | Done |
|---|------|---------|------|
| 6.1 | Learning sessions | Log sessions (minutes, date, optional topic/book). | ☐ |
| 6.2 | Weekly target | 60 min/week; show progress and streak. | ☐ |
| 6.3 | Monthly book | Track “1 book per month”; optional link to sessions or separate “books” list. | ☐ |
| 6.4 | Streak logic | Consecutive weeks hitting 60 min; display and optional celebration. | ☐ |
| 6.5 | Education options table | List courses/books/skills: name, interest_score, future_value_score, effort_score. | ☐ |
| 6.6 | Clarity score | `(interest_score + future_value_score) - effort_score`; sort or filter by it. | ☐ |
| 6.7 | Learning dashboard | Current week minutes, streak, book progress, list of education options with clarity. | ☐ |

**Exit criteria:** User can log time and books; weekly/monthly targets and streak work; clarity score drives prioritization.

---

## Phase 7: Quarterly Strategy & Philosophy Engine (Weeks 11–12)

**Goal:** Quarterly theme/identity; daily quote by day-of-year; push for quote.

| # | Task | Details | Done |
|---|------|---------|------|
| 7.1 | Quarterly settings | Store per user: primary_theme, secondary_theme, savings_goal (link or copy), identity_statement. | ☐ |
| 7.2 | Quarter boundaries | Compute current quarter (e.g. Q1–Q4); show “Quarter X” in UI. | ☐ |
| 7.3 | Strategy reset cron | Quarterly job: reset or archive strategy; prompt user to set new quarter (or reuse). | ☐ |
| 7.4 | Philosophy Engine | Daily quote: `quote_id = day_of_year(current_date)` (1–365); fetch from `quotes`. | ☐ |
| 7.5 | Quote UI | Quote of the day on dashboard or dedicated page; optional “previous/next” for browsing. | ☐ |
| 7.6 | Quote push | Optional morning/evening push with daily quote (see Phase 11). | ☐ |

**Exit criteria:** User can set quarterly theme/identity; daily quote matches calendar day; ready for push.

---

## Phase 8: Calendar Integration (Weeks 13–14)

**Goal:** Google Calendar read (Phase 1); optional two-way later.

| # | Task | Details | Done |
|---|------|---------|------|
| 8.1 | Google OAuth | Supabase or NextAuth: add Google provider; scope for Calendar read. | ☐ |
| 8.2 | Fetch events | Server-side: fetch today’s (and week’s) events from Google Calendar API. | ☐ |
| 8.3 | Store or mirror | Persist in `calendar_events` (user_id, start, end, title, source: 'google') or use in-memory for display. | ☐ |
| 8.4 | Calendar UI | Show today’s events alongside tasks; optional week view. | ☐ |
| 8.5 | Energy budget | Feed calendar duration into Energy Budget (Phase 4). | ☐ |
| 8.6 | Phase 2 (later) | Two-way sync; external calendar priority rules. | ☐ |

**Exit criteria:** User connects Google; today’s events show and count toward energy budget.

---

## Phase 9: Reporting & Pattern Analysis (Week 15)

**Goal:** Reality report (weekly); basic pattern insights.

| # | Task | Details | Done |
|---|------|---------|------|
| 9.1 | Weekly reality report | Cron: aggregate week’s tasks (done vs planned), learning minutes, budget summary, mood averages. | ☐ |
| 9.2 | Report content | Summary text or structured data: “You completed X of Y tasks; Z learning minutes; …”. | ☐ |
| 9.3 | Report UI | Page or email: “Reality Report – Week of …”. | ☐ |
| 9.4 | Pattern analysis (basic) | e.g. Which days have most carry-over; which energy levels correlate with completion. | ☐ |
| 9.5 | Optional export | JSON export of user data (per infra spec). | ☐ |

**Exit criteria:** Weekly report runs and is viewable; at least one pattern insight available.

---

## Phase 10: Admin, Feature Flags, PWA, Deployment (Weeks 16–17)

**Goal:** Admin override; feature flags; installable PWA on Vercel.

| # | Task | Details | Done |
|---|------|---------|------|
| 10.1 | Feature flags | `feature_flags` table: name, enabled (or per-user). Read in app to toggle features. | ☐ |
| 10.2 | Admin role | Optional `users.role = 'admin'` or Supabase custom claim; admin UI or SQL for override. | ☐ |
| 10.3 | next-pwa config | Configure `next.config.js`: dest for worker/manifest; cache strategies. | ☐ |
| 10.4 | Manifest | `manifest.json`: name NEUROHQ, short_name, icons (use APP Icon.PNG), theme_color, start_url. | ☐ |
| 10.5 | Service worker | next-pwa generates SW; ensure offline fallback or “You’re offline” page. | ☐ |
| 10.6 | IndexedDB (optional) | Cache critical data (e.g. today’s tasks, quote) for offline read. | ☐ |
| 10.7 | Installable | Test “Add to Home Screen”; Lighthouse PWA ≥90. | ☐ |
| 10.8 | Vercel project | Connect repo; set env vars; deploy. | ☐ |
| 10.9 | Supabase backups | Confirm daily backups enabled in Supabase dashboard. | ☐ |

**Exit criteria:** Feature flags control at least one feature; PWA installable; app live on Vercel.

---

## Phase 11: Cron Jobs & Push Notifications (Week 18)

**Goal:** All crons run on schedule; push types implemented and capped.

| # | Task | Details | Done |
|---|------|---------|------|
| 11.1 | Vercel Cron | Configure `vercel.json`: daily 00:00 (task rollover, quote dispatch), weekly (reality report), quarterly (strategy reset). | ☐ |
| 11.2 | Task rollover cron | Call rollover API/serverless at 00:00 per user timezone or app default. | ☐ |
| 11.3 | Quote dispatch | If “quote push” enabled, send daily quote (e.g. via Supabase Edge Function + push service or VAPID). | ☐ |
| 11.4 | Push types | Implement: daily quote, avoidance alert (carry_over ≥3), weekly learning reminder, savings alert, shutdown reminder. | ☐ |
| 11.5 | Max 3 per day | Central queue or logic: cap at 3 push notifications per user per day. | ☐ |
| 11.6 | Push permission UI | Request permission; store subscription (e.g. in `users` or separate table). | ☐ |

**Exit criteria:** Rollover and report run on schedule; user can receive up to 3 pushes per day.

---

## Phase 12: Polish, Accessibility & Launch (Weeks 19–20)

**Goal:** Stable, accessible, and ready for real users.

| # | Task | Details | Done |
|---|------|---------|------|
| 12.1 | Error boundaries | Graceful error and not-found pages. | ☐ |
| 12.2 | Loading states | Skeletons or spinners for dashboard, lists, forms. | ☐ |
| 12.3 | Accessibility | Keyboard nav, ARIA, focus order, contrast (WCAG 2.1 AA where possible). | ☐ |
| 12.4 | Responsive | Mobile-first; usable on phone and tablet. | ☐ |
| 12.5 | Onboarding | Short flow: set timezone, first daily state, first task or goal. | ☐ |
| 12.6 | Documentation | README: setup, env, how to run cron locally. Internal doc for deployment. | ☐ |
| 12.7 | Soft launch | Invite-only or beta; monitor errors and Supabase usage. | ☐ |

**Exit criteria:** No critical a11y issues; smooth on mobile; README and deploy docs up to date.

---

## Summary Timeline

| Phase | Focus | Weeks |
|-------|--------|-------|
| 0 | Foundation | 1 |
| 1 | Auth & DB | 2 |
| 2 | Tasks & rollover | 3–4 |
| 3 | Mood adaptive | 5 |
| 4 | Energy budget | 6 |
| 5 | Financial | 7–8 |
| 6 | Learning & education | 9–10 |
| 7 | Quarterly & philosophy | 11–12 |
| 8 | Calendar | 13–14 |
| 9 | Reporting | 15 |
| 10 | Admin, PWA, deploy | 16–17 |
| 11 | Cron & push | 18 |
| 12 | Polish & launch | 19–20 |

---

## Dependencies Between Phases

- **Phase 2** depends on Phase 1 (auth, tables).
- **Phase 3** depends on Phase 2 (tasks, daily_state, carry_over_count).
- **Phase 4** depends on Phase 2 (tasks) and Phase 8 for calendar cost (can stub calendar cost as 0 until Phase 8).
- **Phase 7** (quote) depends on Phase 1 (quotes seeded).
- **Phase 8** can be stubbed (no calendar) until ready.
- **Phase 11** depends on Phase 2 (rollover), Phase 7 (quote), Phase 9 (report), Phase 7 (strategy reset).

---

## Suggested MVP Cut

If you need a **minimal first release** (e.g. 8–10 weeks):

- Phases 0, 1, 2, 3, 4, 7 (quarterly + quote only), 10 (PWA + deploy), 12 (basic polish).
- Defer: full Financial (5), Learning (6), Calendar (8), Reporting (9), Push (11); add in next iterations.

---

*Document version: 1.0 — generated from NEUROHQ Master Architecture and Database Infrastructure.*
