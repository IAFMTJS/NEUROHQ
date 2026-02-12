# NEUROHQ — Full analysis of concept docs and forward plan

**Purpose:** Deep analysis of the two new files (Concept & Vision + Ultra Master Spec), synthesis of the overall concept, mapping to current implementation, and a clear plan for how to go forward.

---

# PART 1 — Analysis of the two new files

## 1.1 NEUROHQ_COMPLETE_CONCEPT_VISION.txt

### Role and audience
- **Role:** Product vision and positioning. Answers *why* NEUROHQ exists and *who* it’s for.
- **Audience:** Stakeholders, future marketing, and product decisions. Not implementation-level.

### Structure and content

| Section | Content | Notes |
|--------|---------|--------|
| **1. Core concept** | Nervous-system-aware Personal OS; not productivity/motivation/habit app; “behavioral architecture” that adapts to energy, mood, load, calendar. | Clear positioning. |
| **2. Problem statement** | Most tools assume stable energy/linear motivation; fails for energy volatility, sensory overload, avoidance, etc. “Adapts instead of punishes.” | Strong differentiator. |
| **3. Target user** | Primary: high-intensity thinker, structurally minded but inconsistent, wants discipline without guilt. Secondary: knowledge worker, self-employed, creative. | Helps prioritise features and copy. |
| **4. Core design principles** | Numbering typo (4 then 5–14). Principles: adaptation over rigidity, structure without overwhelm, measured discipline, identity-driven execution, low visual noise, data over emotion, carry-over transparency, calendar-first, energy realism, no artificial dopamine. | All align with existing Visual & UX doc. |
| **5. System pillars (A–J)** | Same 10 areas as Master Architecture: execution, mood/energy, energy budget, financial, learning, education decisions, quarterly identity, philosophy, calendar, pattern recognition. Wording emphasises “evaluated weekly, not hourly”, “consistency > intensity”, “after 30+ days” for patterns. | No new tables or fields; refines intent. |
| **6. Differentiation** | To-do vs habit vs budget vs note vs motivation apps. “Personal Operating System.” | Useful for messaging. |
| **7. Long-term vision** | Phase 1: personal 90 days. Phase 2: public + feature flags. Phase 3: pattern intelligence (predictive). Phase 4: multi-user + admin. Optional: subscription, career modules, dashboards. | Roadmap; not implementation spec. |
| **8. Success metrics** | Personal: carry-over &lt;3, learning ≥60 min, 1 book/month, savings adherence, stable execution score. System: check-in compliance, energy realism vs scheduling. | Defines “done well” for reports and UX. |
| **9. Philosophical foundation** | Discipline = system; identity precedes action; energy determines output; clarity reduces anxiety; structure reduces chaos; execution compounds. | Underpins tone and copy. |
| **10. Core objective** | Reduce chaos with adaptive structure without suppressing individuality; volatility → measured momentum. | One-line North Star. |

### Gaps and minor issues
- **Numbering:** Section 4 lists “5.–14.” instead of “4.–13.” (typo).
- **No technical detail:** Intentionally none; use Ultra Master Spec for implementation.
- **“Social exposure” vs “social_load”:** Concept says “social exposure”; DB and Ultra Spec use `social_load`. Treat as same; keep `social_load` in code.

### Strengths
- Single, clear “what and who” reference.
- Problem statement and differentiation are sharp.
- Success metrics and phases give a clear direction for reporting and roadmap.

---

## 1.2 NEUROHQ_ULTRA_MASTER_SPEC.md

### Role and audience
- **Role:** Definitive technical and product specification. Single source of truth for *what* to build and *how* it should behave.
- **Audience:** Implementation (you, devs, future contributors). Use this over Master Architecture for conflicting details.

### Section-by-section analysis

| Section | Spec content | Implementation relevance |
|--------|--------------|---------------------------|
| **1. Foundational philosophy** | Same North Star and audience (ADHD, autism, energy volatility, executive dysfunction). | Aligns copy and positioning. |
| **2. System pillars** | 12 layers (same as Master Architecture). | No change. |
| **3. Database structure** | Tables: users, daily_state, tasks, budget_entries, savings_goals, learning_sessions, education_options, calendar_events, quotes, alternatives, feature_flags, **quarterly_plans**, **execution_reports**. RLS, user_id, created_at, admin override. | We use **quarterly_strategy** and **reality_reports**; same concepts, naming differs (see Part 2). |
| **4. Task engine** | **impact (1–3)**, **urgency (1–3)**, energy_required (1–**5**), recurrence_type, carry_over_count, **scheduled_date**. Rollover: status='active' AND scheduled_date &lt; today → scheduled_date=today, carry_over_count++. Avoidance at ≥3, Stabilize at ≥5. | We have **due_date**, **priority (1–5)**, energy_required (1–**10**). No impact, urgency, scheduled_date, or status. Need decisions (see Part 3). |
| **5. Mood adaptive engine** | LOW_ENERGY (energy ≤4): max 3 tasks, **hide energy_required ≥4**. HIGH_SENSORY (sensory ≥7): minimal UI, disable non-critical notifications. DRIVEN (energy ≥7 AND focus ≥7): high-impact first, focus block. **STABILIZE (sensory ≥8 AND carry_over ≥5)**: 2 tasks, no task creation, hide financial stress. | We: hide **energy_required ≥7** in low_energy; **stabilize on carry_over ≥5 only** (no sensory). Need to align thresholds (Part 3). |
| **6. Energy budget** | Capacity 100; task ×10, calendar ×15, social ×1.5; display remaining; **if capacity &lt;20: prevent heavy task scheduling**. | Logic exists (getEnergyBudget, EnergyBudgetBar); not shown on dashboard; “prevent heavy if &lt;20” not enforced in UI. |
| **7. Financial** | Quarterly goal; target, current, weekly_required, daily_required. Impulse: 3 alternatives, 24h freeze, long-term impact. | We have savings_goals, budget_entries, freeze, alternatives. daily_required not explicit (derivable). |
| **8. Learning** | 60 min/week, 1 book/month; streak, minutes, completion %. | Implemented. |
| **9. Education decision** | Clarity = interest + future_value − effort. **Weekly recurring “Career Research” task auto-created.** | Clarity implemented; auto “Career Research” task not. Optional enhancement. |
| **10. Quarterly strategy** | primary_theme, secondary_theme, identity_statement, savings_goal. Quarter reset cron. | We have quarterly_strategy + key_results. |
| **11. Philosophy** | quotes id 1–365; quote_id = day_of_year; push configurable; **insert 365 exactly; IDs 1–365; no modification except admin.** | Implemented; enforce “no user edits” in UI. |
| **12. Calendar** | Phase 1 read-only; Phase 2 two-way; external priority; events reduce budget. | Phase 1 partial (manual + Google OAuth); calendar not on dashboard. |
| **13. Execution score** | **(tasks_completed × 0.5) + (learning_consistency × 0.2) + (savings_adherence × 0.2) − (carryover_penalty × 0.1)**. Weekly only. | We have reality report; this formula can drive a single “execution score” metric in report/dashboard. |
| **14. Pattern intelligence** | After 30 days: energy, avoidance, social, spending, learning trends. Weekly and monthly reports. | Reality report is weekly; “after 30 days” and monthly reports are extension. |
| **15. Push** | Quote, avoidance, learning reminder, savings, shutdown; max 3/day. | Implemented. |
| **16. PWA** | SW, manifest, IndexedDB, installable, Lighthouse ≥90. | In place. |
| **17. Vercel** | Env vars + NEXT_PUBLIC_APP_VERSION; cron daily, weekly, quarterly. | We have cron; app version can come from package.json or env. |
| **18. Feature flags** | Personal strict, public adaptive, advanced analytics. | We have feature_flags table and actions. |
| **19. Security** | Backups, JSON export, GDPR delete, no selling data. | Aligned. |

### Gaps and inconsistencies in the spec
- **Task “status”:** Spec says status='active'; we use **completed** (boolean). We don’t have status enum. Either add status or treat “active” = not completed.
- **energy_required range:** Spec says 1–5; DB and Master Architecture say 1–10. We use 1–10. **Recommendation:** Keep 1–10; cost formula (×10) already scales; spec can be updated to 1–10.
- **scheduled_date vs due_date:** Spec uses “scheduled_date”; we use “due_date”. Same meaning; keep due_date and treat as “day this task is scheduled for”.

### Strengths
- One place for thresholds, formulas, and table list.
- Execution score formula is explicit.
- STABILIZE and LOW_ENERGY rules are precise (once we resolve current vs spec).

---

# PART 2 — Overall concept (synthesis)

## How the two files fit together

```
NEUROHQ_COMPLETE_CONCEPT_VISION.txt     NEUROHQ_ULTRA_MASTER_SPEC.md
         (WHY / WHO)                              (WHAT / HOW)
              │                                          │
              ▼                                          ▼
    Product vision, user, problem,              Tables, fields, modes,
    principles, differentiation,                formulas, cron, push,
    success metrics, phases                      PWA, security
              │                                          │
              └──────────────────┬───────────────────────┘
                                 ▼
                    Implementation (codebase)
                    + NEUROHQ_PAGE_AUDIT.md (UI gaps)
                    + NEUROHQ_DATABASE_SCHEMA.md (columns)
```

- **Concept & Vision** = non-technical truth for positioning, copy, and roadmap. Use it to decide *whether* a feature fits the product.
- **Ultra Master Spec** = technical truth for behaviour and data. Use it to decide *exactly* how modes, rollover, and execution score work.
- **Master Architecture** = older summary; where it conflicts with Ultra Master Spec, **Ultra wins**.
- **Database Schema doc** = column-level source of truth; align it with Ultra Spec after decisions (e.g. impact/urgency).

## One-paragraph concept (for alignment)

NEUROHQ is a nervous-system-aware Personal Operating System for people with fluctuating energy, ADHD/autism traits, or executive dysfunction. It is not a to-do or motivational app; it is a behavioural system that adapts to energy, mood, sensory load, and calendar. It combines task execution (with rollover and avoidance awareness), mood-adaptive modes (low energy, high sensory, driven, stabilize), a 100-unit daily energy budget, financial structure (savings + impulse/24h freeze), learning (60 min/week, 1 book/month), education decisions (clarity score), quarterly identity (theme + statement + savings), daily philosophy (365 quotes), calendar integration, and pattern recognition over time. The goal is sustainable execution aligned with identity—“volatility into measured momentum”—without guilt or artificial dopamine.

---

# PART 3 — Spec vs current implementation

## 3.1 Table naming (no code change required)

| Ultra Spec name   | Our name             | Action                |
|-------------------|----------------------|------------------------|
| quarterly_plans    | quarterly_strategy   | Keep quarterly_strategy; treat as same. Optionally add a line in Ultra Spec: “Implemented as quarterly_strategy.” |
| execution_reports  | reality_reports      | Keep reality_reports; same concept. Optionally add in Ultra Spec: “Implemented as reality_reports (payload includes execution metrics).” |

## 3.2 Task engine

| Item | Ultra Spec | Current | Decision / action |
|------|------------|---------|-------------------|
| Date field | scheduled_date | due_date | Keep due_date; treat as “scheduled day”. |
| status | status='active' | completed (boolean) | No status column. Rollover = “due_date &lt; today AND NOT completed”. Optionally add status later. |
| impact | 1–3 | — | **Add** if we want DRIVEN to sort by “impact”. Migration: add impact smallint check (1–3). |
| urgency | 1–3 | — | **Add** if we want urgency in UI/sorting. Migration: add urgency smallint check (1–3). |
| energy_required | 1–5 | 1–10 | **Keep 1–10**; update Ultra Spec to 1–10. Cost = energy_required × 10 still works. |
| Rollover rule | status='active' AND scheduled_date &lt; today | due_date &lt; today AND NOT completed | Same intent; we’re aligned. |

## 3.3 Mood adaptive engine

| Rule | Ultra Spec | Current | Decision / action |
|------|------------|---------|-------------------|
| LOW_ENERGY | energy ≤4; hide energy_required **≥4** | energy ≤4; hide **≥7** | **Align to spec:** hide tasks with energy_required ≥ 4 in low_energy mode. Change in app/actions/tasks.ts. |
| STABILIZE | **sensory ≥8 AND carry_over ≥5** | **carry_over ≥5** only | **Decision:** (A) Spec: require both sensory ≥8 and carry_over ≥5. (B) Current: keep carry_over ≥5 only. Recommendation: **(B)** so overloaded users get stabilize even without high sensory; optionally add (A) later. Document in Ultra Spec: “MVP: stabilize on carry_over ≥5; future: add sensory ≥8.” |
| HIGH_SENSORY | sensory ≥7; minimal UI, disable non-critical notifications | sensory ≥7; we return high_sensory but UI doesn’t yet reduce | Implement minimal UI / reduced notifications when high_sensory (backlog or Phase 2). |
| DRIVEN | energy ≥7 AND focus ≥7; high-impact first, focus block | Same; we sort by priority (≥4) | Aligned. Optionally map “high impact” to impact (1–3) when we add it. |

## 3.4 Energy budget

| Item | Ultra Spec | Current | Action |
|------|------------|---------|--------|
| Display remaining | Yes | getEnergyBudget exists; EnergyBudgetBar not on any page | **Add EnergyBudgetBar to dashboard** (Page Audit). |
| If capacity &lt; 20: prevent heavy scheduling | Yes | Not enforced | When adding task or showing “add task”, check remaining capacity; if &lt; 20, block or warn for tasks with energy_required ≥ 7. |

## 3.5 Execution score

| Item | Ultra Spec | Current | Action |
|------|------------|---------|--------|
| Formula | (tasks × 0.5) + (learning × 0.2) + (savings × 0.2) − (carryover × 0.1) | Reality report has tasks, learning, savings, carry-over | **Add** a single “Execution score” (0–100 or similar) to weekly reality report using this formula; display on report page and optionally on dashboard. |

## 3.6 Other alignments

- **Financial:** Impulse = 3 alternatives, 24h freeze, long-term impact → we have alternatives and freeze; “3” and “long-term impact” can be enforced in UI/generation.
- **Philosophy:** 365 quotes, no user modification → ensure no edit/delete in UI for quotes.
- **Education:** “Career Research” weekly task → optional cron or onboarding; low priority.
- **Pattern intelligence “after 30 days”:** Keep as enhancement; weekly report is first step.

---

# PART 4 — Decisions needed (summary)

1. **LOW_ENERGY hide threshold:** Change from energy_required ≥ 7 to **≥ 4** (per Ultra Spec).  
2. **STABILIZE:** Keep **carry_over ≥ 5 only** for now; document “sensory ≥8 AND” as future option.  
3. **Task impact/urgency:** Add **only if** we want DRIVEN/UI to use them; otherwise leave for later.  
4. **energy_required range:** Keep **1–10**; update Ultra Spec to say 1–10.  
5. **Table names:** Keep **quarterly_strategy** and **reality_reports**; note in Ultra Spec as implementation names.  
6. **Execution score:** Implement formula in **reality report** (and optionally dashboard).  
7. **Energy budget on dashboard:** **Add** EnergyBudgetBar + getEnergyBudget to dashboard; enforce “no heavy if capacity &lt; 20” when adding tasks.

---

# PART 5 — How we go forward

## 5.1 Doc hygiene (quick)

- **Concept & Vision:** Fix numbering in section 4 (5.–14. → 4.–13.). Optionally add one line: “Technical implementation: see NEUROHQ_ULTRA_MASTER_SPEC.md.”
- **Ultra Master Spec:** Add short “Implementation notes”: quarterly_plans → quarterly_strategy; execution_reports → reality_reports; energy_required 1–10; scheduled_date → due_date; STABILIZE MVP = carry_over ≥5 only.
- **Master Architecture:** Add at top: “Where this conflicts with NEUROHQ_ULTRA_MASTER_SPEC.md, the Ultra Master Spec is authoritative.”

## 5.2 Implementation phases (prioritised)

### Phase A — Align with spec (no new features)
- Implement **LOW_ENERGY hide threshold** energy_required ≥ 4 (in tasks.ts).
- Document STABILIZE (carry_over ≥5 only) in Ultra Spec.
- **Dashboard:** Add **Energy budget** block (EnergyBudgetBar + getEnergyBudget).
- **Optional:** Enforce “capacity &lt; 20 → warn/block heavy task” in add-task flow.

### Phase B — Execution score and report
- Add **execution score** to weekly reality report using Ultra Spec formula.
- Expose it on report page (and optionally one number on dashboard).

### Phase C — UI and wiring (from Page Audit)
- Surface **calendar** on dashboard (AddCalendarEventForm + CalendarEventsList or “next event”).
- **OnboardingBanner** on dashboard/layout for first-time users.
- **AvoidanceNotice** on dashboard when carry_over ≥ 3.
- **Settings:** Timezone selector.
- **Auth:** Forgot-password flow.
- **Loading:** loading.tsx for tasks, budget, learning, strategy, report.

### Phase D — Optional schema and behaviour
- **Tasks:** Add impact (1–3) and urgency (1–3) if we want DRIVEN/UX to use them; then sort/filter by impact.
- **HIGH_SENSORY:** Minimal UI and reduced notifications when mode = high_sensory.
- **STABILIZE:** Optionally require sensory ≥8 in addition to carry_over ≥5.
- **Pattern intelligence:** “After 30 days” views and monthly report.

### Phase E — Product roadmap (from Concept & Vision)
- Phase 2: Feature flags for “strict vs adaptive” modes.
- Phase 3: Predictive pattern analytics.
- Phase 4: Multi-user / admin.

## 5.3 Suggested next steps (this week)

1. **Apply Phase A:**  
   - Change low_energy filter to energy_required &lt; 4 (i.e. hide ≥4).  
   - Add EnergyBudgetBar to dashboard and wire getEnergyBudget.  
2. **Update docs:**  
   - Implementation notes in Ultra Master Spec; fix Concept & Vision numbering; Master Architecture precedence note.  
3. **Pick one from Phase B or C:**  
   - Either execution score in report, or calendar + onboarding/avoidance on dashboard.

After that, re-run the page audit against the updated spec and tick off items as you go. Use the Concept & Vision doc for any new feature (“does this fit the product?”) and the Ultra Master Spec for exact behaviour and data (“how should this work?”).

---

END OF ANALYSIS AND FORWARD PLAN
