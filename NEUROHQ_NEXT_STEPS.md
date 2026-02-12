# NEUROHQ — Next Steps in the Build Process

**Purpose:** What’s done vs what to build next, in order.

---

## What’s already done

- **Phase 0–1:** Next.js app, Supabase clients, env, auth (login/signup), middleware, `users` row on first dashboard load, migrations (tables + RLS + triggers), 365 quotes seed, TypeScript types.
- **Phase 2–3:** Task CRUD, daily state form, task rollover (cron daily), carry-over rules (avoidance notice, Stabilize mode), mood modes (LOW_ENERGY, STABILIZE, etc.), mode banner, task list respects mode.
- **Phase 4:** Energy budget (100/day, task cost ×10), budget bar on dashboard (calendar cost stubbed at 0).
- **Phase 7 (partial):** Daily quote by day-of-year, quote card on dashboard.
- **Cron:** Daily rollover implemented; weekly and quarterly stubbed.
- **Placeholder pages:** Budget, Learning, Strategy, Report (copy only).

---

## Next steps (in order)

### 1. **Ship and validate** (do first)

- [ ] **Supabase:** Create project (if not done), run migrations `001` → `002` → `003` → `005`, enable Email/Password auth.
- [ ] **Env:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel (and locally in `.env.local`).
- [ ] **Deploy:** Connect repo to Vercel, deploy. Set `CRON_SECRET` in Vercel and (optional) use it to protect cron routes.
- [ ] **Smoke test:** Sign up → dashboard → set daily state → add/complete tasks → confirm quote and energy budget show. Next day (or after midnight UTC) confirm rollover via cron.

**Why first:** Confirms the core loop works in production before adding more features.

---

### 2. **Financial system (Phase 5)**

- [ ] **Savings goals:** CRUD (create/update/delete), store target, current, deadline; compute and show “weekly required”.
- [ ] **Budget entries:** Log income/expense (amount, date, category, note); list on Budget page.
- [ ] **Budget dashboard:** Summary block on dashboard or Budget page (e.g. “This week” total, progress toward a goal).
- [ ] **24h freeze:** Mark a planned purchase, set `freeze_until`; show “Frozen” list; after 24h, “Confirm” / “Cancel” (see `NEUROHQ_FINANCIAL_BEHAVIOUR_RULES.md`).
- [ ] **Impulse detection (optional):** Heuristic (e.g. unplanned expense &gt; 40% of weekly average); show gentle notice and optional “Freeze 24h”.
- [ ] **Alternatives:** Use `alternatives` table when suggesting “Add to savings instead” or similar.

**Docs:** `NEUROHQ_FINANCIAL_BEHAVIOUR_RULES.md`, `NEUROHQ_DATABASE_SCHEMA.md` (budget_entries, savings_goals, alternatives).

---

### 3. **Learning & education (Phase 6)**

- [ ] **Learning sessions:** Log sessions (minutes, date, optional topic); store in `learning_sessions`.
- [ ] **Weekly target:** 60 min/week; show progress and “X min left” on Learning page and optionally on dashboard.
- [ ] **Streak:** Consecutive weeks hitting 60 min; display on Learning page.
- [ ] **Education options:** CRUD for courses/books/skills with interest, future_value, effort (1–10); compute clarity score `(interest + future_value) - effort`; sort by it.
- [ ] **Monthly book (optional):** Track “1 book per month” (e.g. link to sessions or a simple “books” list).

**Docs:** `NEUROHQ_MASTER_ARCHITECTURE.md` (§ 3.6, 3.7), `NEUROHQ_SUGGESTIONS_AND_ENHANCEMENTS.md`.

---

### 4. **Quarterly strategy (Phase 7)**

- [ ] **Quarterly strategy UI:** Form or page to set primary_theme, secondary_theme, identity_statement, optional link to savings goal; store in `quarterly_strategy` (user + year + quarter).
- [ ] **Dashboard block:** Show current quarter and identity statement (e.g. “Q1 2025 — [identity]”).
- [ ] **Quarterly cron:** Implement `/api/cron/quarterly` to reset or archive strategy and optionally notify users to set the new quarter.

**Docs:** `NEUROHQ_DATABASE_SCHEMA.md` (quarterly_strategy).

---

### 5. **Reality report (Phase 9)**

- [ ] **Weekly report content:** Aggregate for the past week: tasks completed vs planned, learning minutes, savings progress, mood/energy summary, carry-overs.
- [ ] **Report UI:** `/report` page showing current week’s summary (and optionally past weeks).
- [ ] **Weekly cron:** Implement `/api/cron/weekly` to generate and store or send the report (in-app only or email later).

**Docs:** `NEUROHQ_MASTER_ARCHITECTURE.md` (§ 3.11), `NEUROHQ_ACTION_PLAN.md` (Phase 9).

---

### 6. **Calendar (Phase 8)**

- [ ] **Google OAuth:** Add Google provider in Supabase (or NextAuth); scope for Calendar read.
- [ ] **Fetch events:** Server-side: fetch today’s (and week’s) events from Google Calendar API; store or mirror in `calendar_events`.
- [ ] **Calendar UI:** Show today’s events on dashboard (or a Calendar page); feed duration into energy budget (duration × 15, ×1.5 if social).
- [ ] **Manual events (optional):** Add events without Google (title, start, end, is_social) for users without calendar link.

**Docs:** `NEUROHQ_MASTER_ARCHITECTURE.md` (§ 3.9), `NEUROHQ_CALENDAR_PHASE2_AND_TESTING.md`.

---

### 7. **PWA & installability (Phase 10)**

- [ ] **next-pwa:** Add and configure in `next.config.mjs` (dest: `public`, disable in dev).
- [ ] **Manifest:** `manifest.json` with name NEUROHQ, icons (use APP Icon.PNG), theme_color, start_url.
- [ ] **Service worker:** Let next-pwa generate; ensure offline fallback or “You’re offline” page.
- [ ] **Lighthouse:** Aim PWA score ≥ 90; “Add to Home Screen” works.

**Docs:** `NEUROHQ_DATABASE_INFRASTRUCTURE.md` (§ 6).

---

### 8. **Push notifications (Phase 11)**

- [ ] **Web Push:** Choose stack (VAPID + service worker or FCM); document in Infra.
- [ ] **Subscribe:** `POST /api/push/subscribe` saves subscription to `users.push_subscription_json`; Settings UI to enable/disable and set time (e.g. morning quote).
- [ ] **Send:** Daily quote push (respect user time); avoidance, learning, savings, shutdown reminders; **max 3 per day** per user (track count + date).
- [ ] **Cron:** Call push send from daily cron or a dedicated job after rollover/quote dispatch.

**Docs:** `NEUROHQ_DATABASE_INFRASTRUCTURE.md` (§ 7), `NEUROHQ_SUGGESTIONS_AND_ENHANCEMENTS.md`.

---

### 9. **Polish & launch (Phase 12)**

- [ ] **Onboarding:** Short flow: set timezone → first daily state → first task or goal.
- [ ] **Empty states:** Clear copy + one CTA on every list (tasks, budget, learning, report).
- [ ] **Loading:** Skeletons for dashboard blocks instead of blank.
- [ ] **Accessibility:** Keyboard nav, focus order, ARIA, contrast (WCAG 2.1 AA where possible); respect `prefers-reduced-motion`.
- [ ] **Export / delete:** `/api/export` (JSON of user data); “Delete account” in Settings (cascade or anonymize).
- [ ] **Docs:** README up to date (setup, env, cron, deploy); optional internal runbook.

**Docs:** `NEUROHQ_VISUAL_AND_UX_DIRECTION.md`, `NEUROHQ_ACTION_PLAN.md` (Phase 12).

---

### 10. **Later / nice-to-have**

- **Per-user timezone for cron:** Store `users.timezone`; run rollover when it’s 00:00 in each user’s TZ (e.g. hourly cron that checks which users crossed midnight).
- **DRIVEN mode:** “Focus block” timer; sort tasks by priority (high impact first).
- **HIGH_SENSORY UI:** Minimal layout option (fewer blocks, reduced motion).
- **Recurring tasks, subtasks, task snooze** (see Suggestions doc).
- **Calendar Phase 2:** Two-way sync, external calendar priority (see Calendar Phase 2 doc).
- **Testing:** Unit tests for energy/mode logic; E2E for login → dashboard → task flow (see Testing doc).

---

## Summary table

| Step | Focus | When |
|------|--------|------|
| 1 | Ship & validate (Supabase, Vercel, smoke test) | **Next** |
| 2 | Financial (savings, budget, freeze, impulse) | After 1 |
| 3 | Learning (sessions, 60 min/week, streak, education options) | After 2 |
| 4 | Quarterly strategy (theme, identity, dashboard block) | After 3 |
| 5 | Reality report (weekly content + cron) | After 4 |
| 6 | Calendar (Google read, energy budget) | After 5 |
| 7 | PWA (installable, manifest, SW) | After 6 |
| 8 | Push (subscribe, daily quote, max 3/day) | After 7 |
| 9 | Polish (onboarding, a11y, export/delete) | Before launch |
| 10 | Later (timezone cron, DRIVEN/HIGH_SENSORY, recurring tasks, etc.) | Backlog |

Use this order to pick the next slice of work; each step can be broken into smaller tasks in your task tracker or the Action Plan.
