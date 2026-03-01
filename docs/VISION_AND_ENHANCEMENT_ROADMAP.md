# NEUROHQ — Full Vision & Enhancement Roadmap

**Purpose:** Single reference for the product idea, current state, gaps, and an extended vision of everything the system could need. Use for prioritisation, backlog, and alignment.

---

## Part 1: Idea & Goal (Current)

### Core idea

NEUROHQ is a **nervous-system-aware personal operating system** — calendar-based, mood-adaptive, execution-focused. Built as a PWA with Next.js and Supabase.

**Designed for:**
- ADHD profiles
- Autism spectrum traits
- Energy volatility
- Executive dysfunction cycles
- High cognitive intensity

**Core belief:** Discipline is a system, not a feeling. Energy determines output. Structure reduces chaos. Identity directs execution.

**Primary objective:** Replace internal chaos with adaptive structure without suppressing individuality.

### System pillars (from Ultra Master Spec)

1. Adaptive Task Execution Engine  
2. Mood & Sensory Adaptive Layer  
3. Energy Budget Model  
4. Financial & Savings Engine  
5. Learning Discipline Engine  
6. Education Decision Module  
7. Quarterly Identity Strategy  
8. Philosophy Reinforcement Engine  
9. Calendar Integration Layer  
10. Pattern Intelligence Layer  
11. Admin & Feature Flag System  
12. Deployment & Infrastructure  

---

## Part 2: Current State (What Exists)

### Implemented and live

| Area | What exists | Notes |
|------|-------------|--------|
| **Auth** | Login, signup, redirect to dashboard | Forgot password page exists; rate limiting not implemented |
| **Dashboard** | HQ header (energy/focus/load), BrainStatusCard, EnergyBudgetBar (3-pool, full stats), QuoteCard, ModeBanner, AvoidanceNotice, ActiveMissionCard, Calendar (upcoming + add event), Strategy teaser, Learning streak, Budget remaining, OnTrackCard, RealityReportBlock, PatternInsightCard | Energy budget now advanced; calendar on dashboard |
| **Tasks** | Full list, add/complete/uncomplete/snooze/delete, carry-over styling, backlog, filters (work/personal/recurring), subtasks, recurrence, energy_required, Edit/Details/Focus/QuickAdd modals, ModeBanner, Stabilize (2 tasks, no add) | Uncheck completed task added |
| **Daily rollover** | Cron daily (UTC) + hourly (per-user timezone); unfinished → today, carry_over_count++; brain status is per-date (no “reset” needed) | |
| **Energy budget** | 3-pool (Energy, Focus, Load), brain-status → suggested task count → capacity, task/calendar cost split, full stats table, validation on create task | Docs: `docs/ENERGY_BUDGET_ANALYSIS.md` |
| **Brain status** | BrainStatusCard (energy, focus, load, social, sleep), live “~N tasks suggested”, save to daily_state | |
| **Mode** | getMode(): normal, low_energy, high_sensory, driven, stabilize; ModeBanner on dashboard + tasks; task list respects mode (count, hide heavy, sort) | HIGH_SENSORY: banner only, no minimal UI yet |
| **Budget** | Entries, add/freeze, savings goals, FrozenPurchaseCard, alternatives (impulse), Export CSV | |
| **Learning** | Weekly target (60 min), sessions, streak, education options, clarity score, Monthly book (slot), export CSV | |
| **Strategy** | Quarterly theme, identity, key results, goals, copy from last quarter, export Markdown | |
| **Report** | Reality report per week (tasks, learning, savings, carry-over), week selector, analysis text | |
| **Calendar** | Manual events, Google OAuth (read-only sync), duration + is_social for energy budget | |
| **Settings** | Account email, Timezone, Push (VAPID), Export (modal + close), Delete account, Google Calendar connect | |
| **Push** | VAPID, subscribe in Settings, daily quote / freeze reminder / avoidance alert (cron), max 3/day | |
| **PWA** | Service worker, manifest, offline page | |
| **Export** | JSON export with modal + Close button | |

### Partially implemented or not wired

| Item | Status |
|------|--------|
| HIGH_SENSORY minimal UI | Mode returned; no reduced layout / reduced motion |
| Forgot password | Page exists; link from login optional |
| Focus block (DRIVEN) | FocusBlock CTA on dashboard when driven; timer/block behaviour could be deeper |
| Identity on dashboard | Strategy teaser (identity_statement) shown when present |
| Quote browse (prev/next day) | Not built |
| Backlog | BacklogList on /tasks; “no date” or future tasks |

---

## Part 3: Gaps & Missing (From Audits)

### UX & consistency

- **Auth pages:** Unify text colours to design tokens (neuro-silver, neuro-muted); add “Forgot password?” on login.
- **Home:** Optional “Learn more” / “How it works”; ensure logo has `alt="NEUROHQ"`.
- **Dashboard:** Date in user timezone (data may be TZ-aware; confirm display).
- **Loading:** Skeleton loading on dashboard, tasks, budget, learning, strategy, report (some already have loading.tsx).

### Spec alignment

- **LOW_ENERGY:** Spec “hide energy_required ≥ 4”; current “hide ≥ 7”. Decide and document.
- **STABILIZE:** MVP = carry_over ≥ 5 only; optional future: also require sensory ≥ 8.
- **Execution score (weekly):** Formula in spec; not yet displayed as a dedicated “score” (reality report has related metrics).

### Never built (from backlog)

- **FrozenPurchaseCard** — 24h freeze: list frozen items, Confirm/Cancel after 24h (partially: freeze exists; card/reminder flow).
- **RealityReportBlock on dashboard** — Short “last week” summary with link to full report (RealityReportBlock exists and is used).
- **QuoteCard previous/next** — Browse other days’ quotes (1–365).
- **Categories (budget)** — Presets (food, transport, etc.) + filter by category.
- **Book tracking** — “1 book/month” with current book + progress % (monthly book slot exists; progress/Goal could be clearer).
- **Focus block** — Optional 25 min timer that creates calendar block or “Do not disturb”.
- **Default daily state** — Pre-fill with yesterday’s values; “Same as yesterday” button.
- **Mode explanation** — First-time tooltip/modal for STABILIZE / LOW_ENERGY: “We’ve reduced your list so you can focus.”
- **HIGH_SENSORY minimal UI** — Fewer blocks, reduced motion, dimmed accent (see Visual & UX doc).

### Infra & security

- **Admin/feature flags** — Admin role and override policy; feature flags (e.g. calendar, push types) for rollout.
- **Rate limiting** — Auth and/or API to prevent abuse.
- **Backups** — Supabase backups; export is user-facing; document retention/GDPR.

---

## Part 4: Extended Vision — Everything We Could Need

Organised by pillar. Items are “everything we would possibly need”; not all are MVP.

---

### A. Adaptive Task Execution

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| A1 | Backlog view | Dedicated view for “no date” / future-dated tasks; drag to “today”. | P1 |
| A2 | Task templates | Save task as template (title, energy, category, recurrence) for quick add. | P2 |
| A3 | Focus block (deep) | 25 min timer; optional calendar block or DND; link to task. | P2 |
| A4 | Recurrence UX | Clearer weekly/monthly preview; “skip next occurrence”. | P2 |
| A5 | Task dependencies | “After X”; soft ordering without hard blocks. | P3 |
| A6 | Projects / tags | Optional grouping or tags for tasks (e.g. “Work”, “Health”). | P3 |
| A7 | Time estimates | Optional “estimated minutes” for planning, no enforcement. | P3 |
| A8 | Completion notes | Optional note when completing (“how it went”). | P3 |
| A9 | Undo complete | ✅ Done: uncheck in “Done today”. | Done |
| A10 | Bulk actions | Reschedule several to same day; bulk complete (with care). | P3 |

---

### B. Mood & Sensory Adaptive Layer

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| B1 | HIGH_SENSORY minimal UI | Fewer dashboard blocks, reduced motion, dimmed accent, optional monochrome. | P1 |
| B2 | Mode explanation (first time) | Short modal/tooltip when entering STABILIZE or LOW_ENERGY. | P2 |
| B3 | “Same as yesterday” | One-tap pre-fill daily state from previous day. | P2 |
| B4 | Default daily state | Pre-fill sliders from yesterday so user only adjusts. | P2 |
| B5 | HIGH_SENSORY persistence | Remember “minimal UI” preference per session or day. | P2 |
| B6 | Mood note (optional) | Free-text “mood note” in daily_state for qualitative context. | P3 |
| B7 | STABILIZE + sensory | Optional: require sensory ≥ 8 in addition to carry_over ≥ 5. | P3 |
| B8 | Time-of-day capacity | Optional capacity curve (e.g. morning vs afternoon) from preferences. | P3 |

---

### C. Energy Budget Model

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| C1 | 3-pool + suggested tasks | ✅ Done: capacity from brain status, task/calendar cost split, full stats. | Done |
| C2 | Realistic depletion | ✅ Done: 3–5 tasks don’t empty budget; buffer and costs tuned. | Done |
| C3 | Low headroom warning | ✅ Done: warning when remaining &lt; 20. | Done |
| C4 | Per-task cost in list | Show energy cost (e.g. “6”) next to task in list or details. | P2 |
| C5 | Calendar conflict hint | “You have an event at 14:00; consider lighter tasks around it.” | P2 |
| C6 | Weekly energy summary | Optional: “Energy used per day this week” (from completed tasks). | P3 |
| C7 | Energy trends (pattern) | Over 30 days: energy/focus/load trends for pattern report. | P3 |

---

### D. Financial & Savings Engine

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| D1 | 24h freeze flow | ✅ Freeze exists; FrozenPurchaseCard with Confirm/Cancel after 24h + reminder. | P1 |
| D2 | Category presets | Food, transport, etc. + custom; filter entries and report by category. | P2 |
| D3 | Impulse follow-up | After “Add to freeze”, 24h reminder; on confirm log expense; on cancel optional “Add to savings?”. | P2 |
| D4 | Savings round-up | Optional round-up from entries to a savings goal (e.g. to nearest 5). | P3 |
| D5 | Budget vs actual (weekly) | Simple “planned vs spent” per week or month. | P3 |
| D6 | Recurring entries | ✅ RecurringBudgetCard / templates; ensure generation and UX are clear. | Check |
| D7 | Impulse threshold config | User setting: e.g. “flag if single entry &gt; X% of daily budget”. | P3 |

---

### E. Learning Discipline Engine

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| E1 | Weekly target + streak | ✅ 60 min target, streak, progress. | Done |
| E2 | Book tracking (1/month) | Current book, progress % or “finished”; count toward 1 book/month. | P2 |
| E3 | Clarity sort | Education options sorted by clarity score; “Top 3” filter. | P2 |
| E4 | Streak badge on dashboard | ✅ Shown when streak ≥ 1. | Done |
| E5 | Learning reminder (push) | ✅ Weekly learning reminder in cron/push. | Done |
| E6 | Monthly learning view | ✅ LearningMonthlyView; ensure it’s visible and useful. | Check |
| E7 | Topics over time | Topic breakdown and “topics over time” for pattern. | P3 |

---

### F. Education Decision Module

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| F1 | Clarity score | ✅ (interest + future_value − effort); used in education options. | Done |
| F2 | “Career Research” task | Optional weekly recurring task auto-created (spec). | P3 |
| F3 | Education option archive | Archive old options; filter “active only”. | P3 |

---

### G. Quarterly Identity Strategy

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| G1 | Theme, identity, key results | ✅ StrategyForm, key results. | Done |
| G2 | Identity on dashboard | ✅ Teaser block when identity_statement present. | Done |
| G3 | Quarter reminder | First day of quarter: “Set your theme and identity for QX.” (push or in-app). | P2 |
| G4 | Copy from last quarter | ✅ StrategyCopyFromLast. | Done |
| G5 | Archive / history | View past quarters’ themes and identity (read-only). | P3 |

---

### H. Philosophy Reinforcement Engine

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| H1 | Daily quote | ✅ QuoteCard, day-of-year mapping. | Done |
| H2 | Quote push | ✅ Daily quote via push (cron). | Done |
| H3 | Quote browse | Previous/next day (1–365) from QuoteCard. | P2 |
| H4 | Quote share/copy | “Copy” or “Share” quote (text). | P3 |
| H5 | Quote time preference | ✅ push_quote_time; ensure UI to set time exists. | Check |

---

### I. Calendar Integration Layer

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| I1 | Manual events | ✅ Add event (title, start, end, is_social). | Done |
| I2 | Google read-only | ✅ OAuth, sync, events in energy budget. | Done |
| I3 | Calendar on dashboard | ✅ Upcoming events + add form. | Done |
| I4 | Two-way sync (Phase 2) | Create/edit events in NEUROHQ → Google (spec Phase 2). | P2 |
| I5 | Conflict rule | Document “external calendar has priority” and behaviour. | P2 |
| I6 | All-day events | Support all-day events in model and UI. | P3 |

---

### J. Pattern Intelligence Layer

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| J1 | Reality report (weekly) | ✅ Tasks, learning, savings, carry-over; stored per week. | Done |
| J2 | Report page | ✅ Week selector, ReportAnalysis, RealityReportCard. | Done |
| J3 | Dashboard report teaser | ✅ RealityReportBlock on dashboard. | Done |
| J4 | Execution score | Weekly formula (spec): (tasks×0.5)+(learning×0.2)+(savings×0.2)−(carryover×0.1); show as “score” or in report. | P2 |
| J5 | 30-day patterns | Energy trends, avoidance frequency, social load impact, spending correlation, learning consistency. | P2 |
| J6 | Monthly report | Monthly aggregate (tasks, learning, savings, mood summary). | P3 |
| J7 | Export report | Export report (or range) as PDF/CSV. | P3 |

---

### K. Push Notifications

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| K1 | Daily quote | ✅ With VAPID. | Done |
| K2 | Avoidance alert | ✅ carry_over ≥ 3. | Done |
| K3 | Freeze reminder | ✅ 24h after freeze. | Done |
| K4 | Weekly learning reminder | ✅ In weekly cron. | Done |
| K5 | Shutdown reminder | ✅ Evening cron. | Done |
| K6 | Max 3/day | ✅ Enforced in sendPushToUser. | Done |
| K7 | HIGH_SENSORY: reduce push | When mode = high_sensory, skip or reduce non-critical push. | P2 |
| K8 | Per-type toggles | User toggles: quote on/off, avoidance on/off, etc. (push_quote_enabled exists; extend). | P2 |
| K9 | Quiet hours | No push in a user-defined window (e.g. 22:00–08:00). | P3 |

---

### L. PWA, Offline, Performance

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| L1 | Service worker | ✅ sw.js. | Done |
| L2 | Manifest | ✅ manifest.webmanifest. | Done |
| L3 | Offline page | ✅ /offline. | Done |
| L4 | IndexedDB cache | Optional: cache key data for offline read (e.g. last dashboard). | P2 |
| L5 | Install prompt | Encourage “Add to home screen” when installable. | P2 |
| L6 | Lighthouse ≥90 | PWA, a11y, performance; document target. | P2 |
| L7 | Skeleton loading | ✅ Several loading.tsx; add where missing. | Check |

---

### M. Settings, Account, Security

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| M1 | Account email | ✅ Shown in Settings. | Done |
| M2 | Timezone | ✅ SettingsTimezone (IANA); used for rollover. | Done |
| M3 | Export | ✅ JSON export, modal + Close. | Done |
| M4 | Delete account | ✅ SettingsDeleteAccount. | Done |
| M5 | Forgot password | Page exists; link from login. | P1 |
| M6 | Display name / avatar | Optional profile fields. | P3 |
| M7 | Password change | In-app “Change password” (or link to Supabase flow). | P2 |
| M8 | Rate limiting | Auth and/or API. | P2 |
| M9 | Admin role + RLS | Document and implement admin override where needed. | P2 |
| M10 | Feature flags | Backend flags for calendar, push types, beta features. | P2 |

---

### N. Onboarding & Help

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| N1 | OnboardingBanner | ✅ Dismissible hint. | Done |
| N2 | “How it works” | Static page or modal: energy budget, modes, rollover. | P2 |
| N3 | Tooltips | Key terms: “carry-over”, “headroom”, “brain status”. | P2 |
| N4 | First-time mode modal | When first in STABILIZE or LOW_ENERGY. | P2 |
| N5 | Empty states | Reassuring copy on empty task list, budget, learning. | P1 |
| N6 | Accessibility | Skip link, focus order, aria-labels; audit and fix. | P2 |

---

### O. Infrastructure & Ops

| # | Enhancement | Description | Priority |
|---|-------------|-------------|----------|
| O1 | Cron (daily, hourly, weekly, etc.) | ✅ Implemented; document schedule and CRON_SECRET. | Done |
| O2 | Migrations | 001–008 (and any new); document order. | Done |
| O3 | Env checklist | .env.example; DEPLOY.md. | Done |
| O4 | Backups | Supabase backups; document retention. | P2 |
| O5 | Error tracking | Optional: Sentry or similar for client/server errors. | P3 |
| O6 | Middleware → proxy | Next.js 16: migrate from middleware to proxy when ready. | P3 |

---

## Part 5: Suggested Priority Order (Next Steps)

### Immediate (P1)

1. **HIGH_SENSORY minimal UI** — Fewer blocks, reduced motion when sensory ≥ 7.  
2. **Forgot password link** — From login to `/forgot-password`.  
3. **24h freeze flow** — FrozenPurchaseCard: list frozen items, Confirm/Cancel after 24h, reminder.  
4. **Backlog view** — Clear “Backlog” section or view; move to today.  
5. **Empty states** — Consistent, reassuring copy everywhere.

### Short term (P2)

- Mode explanation (first time)  
- “Same as yesterday” / default daily state  
- Quote browse (prev/next)  
- Per-task energy cost in list  
- Calendar conflict hint  
- Category presets (budget)  
- Book tracking (1/month)  
- Clarity sort (education)  
- Quarter reminder (push or in-app)  
- Execution score in report  
- 30-day pattern insights  
- Push: per-type toggles, HIGH_SENSORY reduction  
- Password change, rate limiting, admin/feature flags  
- “How it works”, tooltips, a11y pass  
- IndexedDB/install prompt/Lighthouse

### Later (P3)

- Task templates, dependencies, projects/tags, time estimates, completion notes, bulk actions  
- Mood note, STABILIZE+sensory, time-of-day capacity  
- Weekly energy summary, energy trends  
- Savings round-up, budget vs actual, impulse threshold config  
- Topics over time, “Career Research” task, education archive  
- Quarterly archive/history  
- Quote share/copy, quote time UI  
- Two-way calendar, all-day events  
- Monthly report, export report  
- Quiet hours (push)  
- Display name/avatar, error tracking, proxy migration  

---

## Part 6: Principles to Keep

1. **Adapt, don’t punish** — Modes and budget reduce load; they don’t shame.  
2. **Energy determines output** — Brain status and energy budget are first-class.  
3. **Identity directs execution** — Quarterly theme and identity stay visible.  
4. **Calm, clear hierarchy** — Fewer choices per view; respect sensory load.  
5. **Sustainable execution** — Volatility into measured momentum; no guilt, no artificial dopamine.  
6. **Privacy & control** — Export, delete account, optional push; no selling data.

---

*Document generated from codebase and existing specs (Ultra Master Spec, Master Architecture, Page Audit, Suggestions, Gaps, Features Lost or Hidden). Priorities are suggestions; adjust to roadmap and capacity.*
