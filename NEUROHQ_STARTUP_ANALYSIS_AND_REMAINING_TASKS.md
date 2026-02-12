# NEUROHQ — Startup Files Analysis & Remaining Tasks

**Purpose:** Analyse the original planning/spec documents (“startup files”), compare them to the current codebase, and list everything still to do.

---

## 1. What the “startup files” are

The **startup files** are the planning and specification documents that defined NEUROHQ at the beginning:

| Document | Role |
|----------|------|
| **NEUROHQ_MASTER_ARCHITECTURE.md** | Product definition, 12 system layers, core logic (rollover, mood modes, energy budget, quarterly, savings, learning, philosophy, calendar, push, timezone, reality report). |
| **NEUROHQ_DATABASE_INFRASTRUCTURE.md** | Tech stack, env vars, table list, RLS, cron, PWA, push tech (VAPID), admin, security, logging, backups. |
| **NEUROHQ_DATABASE_SCHEMA.md** | Column-level schema for all tables (users, daily_state, tasks, budget_entries, savings_goals, learning_sessions, education_options, calendar_events, quotes, feature_flags, alternatives, quarterly_strategy). |
| **NEUROHQ_ACTION_PLAN.md** | Phased implementation (Phases 0–12), task tables, dependencies, MVP cut. |
| **NEUROHQ_NEXT_STEPS.md** | What’s done vs next steps in order (ship → financial → learning → strategy → report → calendar → PWA → push → polish). |
| **NEUROHQ_GAPS_AND_ADDITIONS.md** | Gaps (schema, timezone, push tech, admin/flags, reality report format, impulse/24h freeze rules, heavy/high-impact definitions, alternatives, security, errors, testing). |
| **NEUROHQ_FINANCIAL_BEHAVIOUR_RULES.md** | Impulse detection (%, quick-add, categories) and 24h freeze flow. |
| **365_Philosophical_Quotes_Structured.txt** | Source for seeding `quotes` (id 1–365). |

---

## 2. Current implementation vs spec (summary)

### 2.1 Implemented and aligned

- **Phase 0 (Foundation):** Next.js, Supabase clients (browser/server), env, folder structure (app/(auth), app/(dashboard), components, lib, types). No separate `hooks/` folder; not critical.
- **Phase 1 (Auth & DB):** Auth (login/signup), middleware protection, `users` row (ensureUserProfile on first dashboard load), migrations 001–006 (tables, RLS, triggers, seed quotes), TypeScript types.
- **Phase 2 (Tasks & rollover):** Task CRUD, daily state form, daily cron rollover, carry-over count, avoidance notice (≥3), Stabilize (≥5), task limits and “heavy” filter in `getTodaysTasks`.
- **Phase 3 (Mood):** Mode derivation (low_energy, high_sensory, driven, stabilize), mode banner, task list respects stabilize (2 tasks, no add) and low_energy (3 tasks, hide energy_required ≥ 7).
- **Phase 4 (Energy budget):** 100/day, task cost ×10, calendar cost (from `calendar_events`), energy bar on dashboard.
- **Phase 5 (Financial) — partial:** Savings goals CRUD, weekly required, budget entries CRUD, 24h freeze (freeze/confirm/cancel) in UI and actions; Budget page with goals, entries, and “Freeze 24h” on entries.
- **Phase 6 (Learning):** Learning sessions, weekly 60 min target, streak, education options with clarity score; Learning page with progress, log session, education list.
- **Phase 7 (Quarterly & quote) — partial:** Daily quote by day-of-year, quote card on dashboard; Strategy page with quarterly form (theme, identity, savings link); StrategyBlock on dashboard. Quarterly **cron** is stubbed (TODO only).
- **Phase 8 (Calendar) — partial:** Manual calendar events only (AddCalendarEventForm, CalendarEventsList); **no Google OAuth** or Google Calendar fetch.
- **Phase 9 (Reporting):** Reality report content (tasks, learning, savings, mood, carry-over); Report page (current week computed on the fly); weekly cron writes to `reality_reports`.
- **Phase 10 (Admin, PWA, deploy):** Feature flags and admin in schema/RLS; **PWA:** manifest.json and icons exist, **next-pwa is commented out** in next.config.mjs (no generated service worker). Vercel deploy and crons configured.
- **Phase 11 (Cron & push):** Daily cron (rollover + quote push), weekly cron (reality report), quarterly cron (stub). Push: VAPID in lib/push.ts, max 3/day, subscribe API and Settings UI.
- **Phase 12 (Polish) — partial:** Export and delete account in Settings; loading/skeletons; onboarding banner. No full onboarding flow, no explicit a11y pass.

### 2.2 Bugs / mismatches

- **Daily cron quote push:** The daily cron selects `quote, name, era` from `quotes`, but the table has `quote_text` and `author_name`. So push body is wrong/undefined. **Fix:** Use `quote_text` (and optionally `author_name`) in the daily cron.

### 2.3 Not implemented or incomplete (from startup specs)

- **DRIVEN mode behaviour:** Spec: “Prioritize high impact tasks (priority ≥ 4); focus block enabled.” Current: Banner only; `getTodaysTasks` does not sort by `priority` for driven; no focus block/timer.
- **HIGH_SENSORY mode behaviour:** Spec: “Minimal UI; reduced push.” Current: Banner only; no minimal UI variant, no push reduction.
- **Quarterly cron:** Spec: reset/archive strategy and optionally notify. Current: Returns `{ ok: true }` with TODO only.
- **Google Calendar (Phase 8):** No OAuth, no fetch from Google Calendar API, no sync into `calendar_events`. Manual events only.
- **next-pwa:** Not enabled; no generated service worker; installability not fully validated (Lighthouse PWA ≥90).
- **Push types beyond quote:** Spec: daily quote, avoidance alert, learning reminder, savings alert, shutdown reminder. Current: only daily quote push is implemented.
- **24h freeze reminder:** Logic exists (`getEntriesReadyForFreezeReminder`), but no cron/job sends a push or in-app reminder when `freeze_until` has passed.
- **Impulse detection:** No heuristic (e.g. unplanned expense > 40% of 4-week average), no “Add to 24h freeze?” notice in UI.
- **Alternatives table:** No UI or flows that create/read `alternatives` (e.g. “Save to savings instead”, post-freeze suggestions).
- **Report: past weeks:** Report page shows only current week (computed). Stored `reality_reports` from weekly cron are not shown for “past weeks” (optional in spec).
- **Per-user timezone for cron:** Rollover/quote use UTC. No “run at 00:00 in each user’s timezone” (documented as MVP option to defer).
- **Onboarding:** Short flow (timezone → first daily state → first task/goal) not implemented; OnboardingBanner exists but not full flow.
- **Accessibility:** No explicit WCAG 2.1 AA pass (keyboard, ARIA, focus, contrast, reduced motion).
- **Error boundaries / not-found:** Not explicitly added per Phase 12.
- **Testing:** No unit/e2e strategy implemented (optional for MVP in GAPS).

---

## 3. Full list: what we still need to do

Below is a single checklist of remaining work, ordered by priority (ship first, then features, then polish and backlog).

### 3.1 Fixes (do first)

- [x] **Daily cron quote columns:** Fixed: uses `quote_text`, `author_name` in daily cron.

### 3.2 Ship & validate (from Next Steps)

- [ ] **Supabase:** Ensure project exists; run migrations 001 → 002 → 003 → 005 (and 006); Email/Password auth enabled.
- [ ] **Env:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel and `.env.local`.
- [ ] **Deploy:** Repo connected to Vercel; set `CRON_SECRET` (and optionally protect cron routes with it).
- [ ] **Smoke test:** Sign up → dashboard → daily state → add/complete tasks → quote and energy budget; next day (or after midnight UTC) confirm rollover via cron.

### 3.3 Financial (Phase 5) — remaining

- [x] **24h freeze reminder:** Cron or scheduled job that finds entries with `freeze_until <= now()` and `freeze_reminder_sent = false`; send push (or in-app) “Your frozen purchase ‘X’ is ready. Confirm or cancel?”; set `freeze_reminder_sent = true` (or rely on user confirming/cancelling in UI).
- [x] **Impulse detection (optional):** Heuristic (e.g. unplanned expense > 40% of 4-week average); gentle in-app notice “Add to 24h freeze?” with [Freeze] [Planned] [Skip].
- [x] **Alternatives:** Use `alternatives` table when suggesting “Add to savings instead” or similar; show in UI (e.g. on frozen item or in report).

### 3.4 Mood engine (Phase 3) — remaining

- [x] **DRIVEN mode:** In `getTodaysTasks` (or equivalent), when mode is `driven`, sort by `priority` (e.g. priority ≥ 4 first). Optionally add “focus block” (e.g. timer) on dashboard when in DRIVEN.
- [x] **HIGH_SENSORY mode:** Minimal UI variant (fewer blocks, reduced motion) and/or reduced push when in high_sensory.

### 3.5 Quarterly (Phase 7) — remaining

- [x] **Quarterly cron:** Implemented: ensures each user has a `quarterly_strategy` row for current quarter so Strategy form appears.

### 3.6 Reporting (Phase 9) — optional

- [x] **Past weeks:** Report page has ReportWeekSelector; `getStoredReportWeeks` and `getStoredReport`; can view stored reports for past weeks.

### 3.7 Calendar (Phase 8)

- [x] **Google OAuth:** Add Google provider (Supabase or NextAuth); scope for Calendar read.
- [x] **Fetch events:** Server-side fetch today’s (and week’s) events from Google Calendar API; store or mirror in `calendar_events`.
- [x] **Calendar UI:** Show Google events on dashboard (or Calendar page); feed duration into energy budget. Optional: manual events for users without Google.

### 3.8 PWA (Phase 10)

- [x] **Manifest:** `app/manifest.ts` (Next.js built-in); existing `public/manifest.json` and icons; no next-pwa (using built-in + existing `sw.js`).
- [x] **Offline:** `app/offline/page.tsx` “You’re offline” page; `sw.js` handles push.
- [ ] **Lighthouse:** PWA score ≥ 90; “Add to Home Screen” (manual validation).

### 3.9 Push (Phase 11) — beyond quote

- [x] **Avoidance alert:** In daily cron: send push when carry_over ≥ 3 (“X task(s) carried over. Pick one to focus on.”).
- [x] **Learning reminder:** In weekly cron: send push when learningMinutes < 60 last week.
- [x] **Savings alert:** In weekly cron: push when a savings goal has deadline in next 7 days and progress &lt; 100%.
- [x] **Shutdown reminder:** Evening cron `/api/cron/evening` at 21:00 UTC; sends “Time to wind down” (max 3/day).
- [x] **Push permission & prefs:** Subscribe and Settings; max 3/day enforced in `sendPushToUser`.

### 3.10 Polish & launch (Phase 12)

- [x] **Onboarding:** Multi-step banner: timezone (with `updateUserTimezone`) → daily state prompt → first task/goal; localStorage step.
- [x] **Empty states:** Tasks “Add one below”; Budget “Add one above”; Suggestions section when alternatives exist.
- [x] **Loading:** Existing skeletons; FocusBlock and forms have disabled states.
- [x] **Accessibility:** Skip link to main, `:focus-visible`, `prefers-reduced-motion` (.reduce-motion), ARIA where added (e.g. FocusBlock, ReportWeekSelector).
- [x] **Error boundaries:** `app/error.tsx` and `app/not-found.tsx`.
- [x] **Docs:** README updated (cron details, Google Calendar optional, NEUROHQ_STARTUP_ANALYSIS doc reference).

### 3.11 Later / backlog (from Next Steps & GAPS)

- [x] **Per-user timezone for cron:** Store `users.timezone`; run rollover/quote when it’s 00:00 in each user’s TZ (e.g. hourly cron that checks which users crossed midnight).
- [ ] **Recurring tasks, subtasks, task snooze** (see NEUROHQ_SUGGESTIONS_AND_ENHANCEMENTS.md).
- [ ] **Calendar Phase 2:** Two-way sync, external calendar priority.
- [ ] **Testing:** Unit tests for energy/mode logic; E2E for login → dashboard → task flow.
- [x] **Feature flags in UI:** `getFeatureFlags()` in `app/actions/feature-flags.ts`; dashboard uses `flags.calendar_integration` to show “Connect Google” hint. Defaults for push_quotes, etc. in code.

---

## 4. Summary table

| Category | Count | Examples |
|----------|--------|----------|
| **Fixes** | 1 | Daily cron quote column names |
| **Ship & validate** | 4 | Supabase, env, deploy, smoke test |
| **Financial** | 3 | Freeze reminder cron, impulse, alternatives |
| **Mood** | 2 | DRIVEN sort/focus block, HIGH_SENSORY minimal UI |
| **Quarterly** | 1 | Implement quarterly cron |
| **Report** | 1 | Past weeks (optional) |
| **Calendar** | 3 | Google OAuth, fetch, UI |
| **PWA** | 3 | next-pwa, SW, Lighthouse |
| **Push** | 4+ | Avoidance, learning, savings, shutdown |
| **Polish** | 6 | Onboarding, empty states, a11y, errors, docs |
| **Later** | 5+ | Per-user TZ, recurring tasks, Calendar Phase 2, tests, feature flags UI |

Use this list to pick the next slice of work; the order in §3 matches the recommended sequence (fix → ship → financial → mood → quarterly → … → polish → backlog).

---

*Document version: 1.0 — generated from analysis of NEUROHQ planning docs and current codebase.*
