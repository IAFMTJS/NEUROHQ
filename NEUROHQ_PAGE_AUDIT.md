# NEUROHQ — Page-by-page audit

**Purpose:** Align every page with the product goal and concept; list what’s missing, should be changed, improved, enhanced, or added. Pages are separate; lazy loading and compartmentalization can follow.

**Product goal (from README + Master Architecture + Visual & UX):**  
NEUROHQ is a **nervous-system-aware personal operating system** — calendar-based, mood-adaptive, execution-focused, PWA. Core pillars: adaptive execution, energy budgeting, financial control, structured learning, quarterly identity planning, philosophical reinforcement, calendar integration, pattern analysis. UX: calm, clear hierarchy, reduced cognitive load, consistent rhythm, respect for sensory load, identity and meaning.

---

## 1. Home (`/`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Logo, app icon, tagline “Your daily HQ”, short blurb (“Tasks, energy, learning, finances”), Sign in / Sign up. | **Add:** One line on *who it’s for* (e.g. “Built for focus and energy awareness”) or “ADHD/autism-friendly” if you want to state it. |
| **Visual** | Dark bg, radial gradient, card, max-width strip. | Align “neuro-silver” / “neuro-muted” with design tokens in `globals.css` (you use both `text-neuro-muted` and design tokens elsewhere). |
| **UX** | Redirects logged-in users to `/dashboard`. | Consider “Learn more” or “How it works” link to a static page (optional). |
| **Accessibility** | Images have `alt=""` (decorative). Logo should have `alt="NEUROHQ"` for context. | Add `alt="NEUROHQ"` to logo Image. |

---

## 2. Login (`/login`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Email, password, error display, “Back to home”, “Sign up” link. | **Add:** “Forgot password?” link → `/forgot-password` (page not implemented yet). |
| **Visual** | Card, neuro styling; `text-neutral-300` / `text-neutral-400` on signup vs `text-neuro-silver` / `text-neuro-muted` on login. | **Unify:** Use design tokens (`text-neuro-silver`, `text-neuro-muted`) on both auth pages for consistency. |
| **Layout** | Auth layout centers content; no header. | Fine; ensure focus order (email → password → submit → sign up link). |
| **Security** | Client-side sign-in, redirect to `/dashboard`. | Consider rate limiting / messaging for “too many attempts” (backend). |

---

## 3. Signup (`/signup`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Email, password, success state “Check your email”, link back to sign in. | **Add:** Password strength hint or min length in label (“At least 6 characters” is in placeholder only). |
| **Visual** | Same as login; uses `text-neutral-400` / `text-neutral-300`. | **Unify:** Use `text-neuro-silver` / `text-neuro-muted` everywhere (see Login). |
| **UX** | Success message is clear. | Optional: “Resend confirmation” if user didn’t get email. |

---

## 4. Dashboard (`/dashboard`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Spec alignment** | HQHeader (energy/focus/load), BrainStatusCard (daily state), QuoteCard, ActiveMissionCard (first task), PatternInsightCard. | **Missing (spec):** **Energy budget “X / 100”** — `EnergyBudgetBar` and `getEnergyBudget(date)` exist but are **not used**. Add Block 3: Energy budget bar (used/remaining, optional task vs calendar breakdown). |
| **Spec alignment** | “Block 5: Next (focus block or next calendar event)”. | **Missing:** Next **calendar event** on dashboard. Calendar events (manual + Google) are not loaded or shown here. Add “Next event” or “Today’s calendar” strip using `AddCalendarEventForm` + `CalendarEventsList` or a compact “next event” card. |
| **Modes** | Task list respects mode (stabilize/low_energy/driven); dashboard doesn’t show mode. | **Consider:** ModeBanner or small mode indicator on dashboard so user knows why they see fewer tasks (e.g. “Stabilize mode – finish the 2 below”). |
| **Avoidance** | Carry-over is used for mode; no standalone avoidance notice on dashboard. | **Add (backlog):** AvoidanceNotice when carryOverCount ≥ 3: “X tasks carried over. Pick one to focus on?” with link to `/tasks`. |
| **DRIVEN / Focus block** | ActiveMissionCard links to first task. | **Consider:** In DRIVEN mode, show `FocusBlock` CTA (timer / focus block) as in spec. |
| **Report teaser** | PatternInsightCard links to `/report`. | **Optional:** RealityReportBlock – short “last week” summary (tasks, learning, savings) with link to full report. |
| **Date** | Uses server `today`; no user timezone in UI. | Header shows date; ensure it’s in user’s timezone (data may already be TZ-aware; confirm display). |
| **Loading** | `DashboardSkeleton` in `dashboard/loading.tsx`. | Good; keep. |

---

## 5. Tasks (`/tasks`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Title “Tasks”, date, “Today” badge, ModeBanner, TaskList (with add/complete/snooze/subtasks). | Solid. |
| **Empty state** | Handled inside TaskList. | Ensure copy matches tone: “No tasks for today. Add one or enjoy the space.” |
| **Calendar** | No calendar or “next event” on page. | **Consider:** Small “Today’s events” section or link to where calendar is (once calendar has a home). |
| **Backlog** | Tasks are “today” only. | **Backlog:** “No date” / backlog view (tasks with no date or future) per suggestions doc. |
| **Loading** | No `tasks/loading.tsx`. | **Add:** `loading.tsx` with a tasks skeleton for consistency with dashboard. |

---

## 6. Budget (`/budget`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | BudgetSummaryCard, Savings goals (add + list), Add entry, Entries & frozen, Alternatives (when any). | Good structure. |
| **24h freeze** | Entries list and freeze exist in data; no dedicated “Frozen” card. | **Add (backlog):** FrozenPurchaseCard – list items with freeze_until, “Confirm” / “Cancel” after 24h. |
| **Empty states** | Present for goals and entries. | Reassuring copy; keep. |
| **Categories** | Entries may have category. | **Backlog:** Category presets (food, transport, etc.) and filter by category. |
| **Loading** | No `budget/loading.tsx`. | **Add:** Budget skeleton for consistency. |

---

## 7. Learning (`/learning`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | LearningProgress (minutes vs 60, streak), LearningTips, Log session, Recent sessions, Education options (clarity score). | Aligned with spec. |
| **Monthly book** | Spec: “Monthly: 1 book”. | **Backlog:** Book tracking (current book, progress %, count toward 1/month). |
| **Streak** | Shown in LearningProgress. | Optional: Streak badge on dashboard when streak ≥ 1 (suggestions doc). |
| **Loading** | No `learning/loading.tsx`. | **Add:** Learning skeleton. |

---

## 8. Strategy (`/strategy`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Title “Quarterly strategy”, Q Y, StrategyIntro, StrategyForm (theme, identity, key results, linked goals). | Good. |
| **Key results** | In form (migration 010). | Verify key results display and edit in StrategyForm. |
| **Identity on dashboard** | Not shown. | **Backlog:** Show current quarter’s identity statement on dashboard (strategy block or QuoteCard area). |
| **Loading** | No `strategy/loading.tsx`. | **Add:** Strategy skeleton. |

---

## 9. Report (`/report`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | ReportWeekSelector, ReportAnalysis, RealityReportCard; week from searchParams. | Matches reality report spec. |
| **Empty / no data** | When no report for a week. | Clear message and optional “Generate” or “Available after week end”. |
| **Loading** | No `report/loading.tsx`. | **Add:** Report skeleton. |

---

## 10. Settings (`/settings`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Account (email), SettingsPush, SettingsExport, SettingsDeleteAccount, SettingsGoogleCalendar, About. | Good. |
| **Timezone** | Used in backend/cron; not clearly editable in UI. | **Add:** Timezone selector (IANA) so “today” and rollover match user’s day. |
| **Profile** | Only email shown. | Optional: Display name or avatar (low priority). |
| **Forgot password** | Not in settings. | N/A; add on login page. |
| **Version** | “Version 1.0.0” hardcoded. | Consider from package.json or env for consistency. |
| **Loading** | No `settings/loading.tsx`. | Optional; settings is light. |

---

## 11. Offline (`/offline`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | “You’re offline”, short message, “Try again” → `/dashboard`. | **Fix:** When offline, user may not be logged in; “Try again” may hit login. Consider “Go home” → `/` or keep dashboard and let app show login if session expired. |
| **PWA** | Fits “offline” UX. | Optional: Show cached last view (e.g. last route) when coming back online. |

---

## 12. Not found (`/not-found`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | “Page not found”, “Go to Dashboard”. | Good. |
| **Layout** | Uses card, no full-height background. | Consider same bg as app (`bg-neuro-dark` or `bg-[var(--bg-primary)]`) for consistency. |

---

## 13. Error (`error.tsx`)

| Aspect | Current | Missing / Change / Improve |
|--------|---------|---------------------------|
| **Content** | Message, auth/schema hints, “Try again” + “Dashboard”. | Good. |
| **Layout** | Same as not-found; consider full-page background. | Minor; consistent with not-found. |

---

## Cross-cutting

| Area | Current | Missing / Change / Improve |
|------|---------|---------------------------|
| **Nav** | AppHeader (logo), BottomNav (HQ, Missions, Budget, Growth, Strategy, Insight, Settings), Sign out. | Labels match content. Ensure “Insight” is clear as “Reality report”. Consider aria-current on active link. |
| **Calendar surface** | AddCalendarEventForm + CalendarEventsList exist but **are not used on any page**. | **Add:** A place for calendar: e.g. Dashboard “Today’s events” + “Add event”, or a dedicated “Calendar” nav item (or section under Dashboard/Tasks). |
| **Onboarding** | OnboardingBanner component exists but is not rendered anywhere. | **Add:** Render OnboardingBanner on dashboard (or layout) for first-time users; optionally timezone → first daily state → first task. |
| **Energy budget** | EnergyBudgetBar + getEnergyBudget exist; unused. | **Add:** Dashboard Block 3 (see Dashboard section). |
| **Consistency** | Some pages use `text-neuro-*`, others `text-neutral-*`. | Unify to design tokens (neuro-* or CSS variables). |
| **Loading** | Only dashboard has `loading.tsx`. | Add `loading.tsx` for tasks, budget, learning, strategy, report for consistent Skeleton UX. |
| **Focus / reduced motion** | Skip link, focus styles in nav. | Verify `prefers-reduced-motion` in globals and key components. |

---

## Summary table

| Page | Priority missing | Priority improvements |
|------|------------------|------------------------|
| **Home** | Optional “who it’s for” | Logo alt text; token consistency |
| **Login** | Forgot password link + page | Unify text classes with design tokens |
| **Signup** | — | Unify text classes; optional password hint in label |
| **Dashboard** | Energy budget bar; next calendar event; optional Mode + AvoidanceNotice | Optional: FocusBlock in DRIVEN, RealityReportBlock, timezone in header |
| **Tasks** | Optional: calendar strip, backlog view | Add loading.tsx |
| **Budget** | FrozenPurchaseCard (24h confirm/cancel) | Add loading.tsx; backlog: categories |
| **Learning** | Optional: book tracking, streak on dashboard | Add loading.tsx |
| **Strategy** | Optional: identity on dashboard | Add loading.tsx; verify key results UI |
| **Report** | — | Add loading.tsx |
| **Settings** | Timezone selector | Optional: version from app, loading |
| **Offline** | — | Link to “/” vs “/dashboard” when offline |
| **Not-found / Error** | — | Full-page bg consistency |

---

## Components / features to wire (exist but not used)

| Component / action | Where to use |
|--------------------|--------------|
| EnergyBudgetBar + getEnergyBudget | Dashboard (Block 3) |
| AddCalendarEventForm + CalendarEventsList | Dashboard “Today’s events” or new Calendar section / page |
| OnboardingBanner | Dashboard or layout (first visit) |
| FocusBlock | Dashboard when mode === DRIVEN |

---

## Next steps (after this audit)

1. **Quick wins:** Unify auth page text classes; add logo alt on home; add Dashboard energy budget block; surface calendar (form + list) on dashboard or tasks.
2. **Loading:** Add `loading.tsx` for tasks, budget, learning, strategy, report.
3. **Auth:** Implement forgot-password flow; add “Forgot password?” on login.
4. **Settings:** Add timezone selector.
5. **Backlog:** AvoidanceNotice on dashboard; FrozenPurchaseCard on budget; onboarding flow; identity on dashboard; book tracking; backlog view for tasks.
6. **Lazy loading / compartmentalization:** After pages are stable, split heavy components per route and lazy-load where it helps.

If you tell me which page or area you want to tackle first, I can suggest concrete code changes (e.g. “add EnergyBudgetBar to dashboard” or “add loading.tsx for tasks”).
