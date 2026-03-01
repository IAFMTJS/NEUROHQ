NEUROHQ_ULTRA_MASTER_SPEC.md Version 1.0 -- Definitive System
Specification

================================================================ SECTION
1 -- FOUNDATIONAL PHILOSOPHY
================================================================

NEUROHQ is a Nervous-System-Aware Personal Operating System.

It is designed for: - ADHD profiles - Autism spectrum traits - Energy
volatility - Executive dysfunction cycles - High cognitive intensity
personalities

Core belief: Discipline is a system, not a feeling. Energy determines
output. Structure reduces chaos. Identity directs execution.

Primary Objective: Replace internal chaos with adaptive structure
without suppressing individuality.

================================================================ SECTION
2 -- SYSTEM PILLARS
================================================================

1.  Adaptive Task Execution Engine
2.  Mood & Sensory Adaptive Layer
3.  Energy Budget Model
4.  Financial & Savings Engine
5.  Learning Discipline Engine
6.  Education Decision Module
7.  Quarterly Identity Strategy
8.  Philosophy Reinforcement Engine
9.  Calendar Integration Layer
10. Pattern Intelligence Layer
11. Admin & Feature Flag System
12. Deployment & Infrastructure Layer

================================================================ SECTION
3 -- COMPLETE DATABASE STRUCTURE (SUPABASE)
================================================================

Tables:

users daily_state tasks budget_entries savings_goals learning_sessions
education_options calendar_events quotes alternatives feature_flags
quarterly_plans execution_reports

All user-bound tables: - Enable Row Level Security - Policy: auth.uid()
= user_id - created_at timestamp default now()

Admin override policy required.

================================================================ SECTION
4 -- TASK ENGINE (FULL LOGIC)
================================================================

Task Fields: - impact (1--3) - urgency (1--3) - energy_required (1--5) -
recurrence_type - carry_over_count - scheduled_date

Daily Rollover (00:00 cron): IF status='active' AND scheduled_date \<
today: scheduled_date = today carry_over_count++

IF carry_over_count \>= 3: flag avoidance

IF carry_over_count \>= 5: trigger Stabilize Mode

================================================================ SECTION
5 -- MOOD ADAPTIVE ENGINE
================================================================

Daily Inputs: - energy (1--10) - focus (1--10) - sensory_load (1--10) -
sleep_hours - social_load

LOW ENERGY MODE (energy ≤4): - Max 3 visible tasks - Hide tasks
energy_required ≥4

HIGH SENSORY MODE (sensory_load ≥7): - Minimal UI - Disable non-critical
notifications

DRIVEN MODE (energy ≥7 AND focus ≥7): - Prioritize high-impact tasks -
Enable bonus focus block

STABILIZE MODE (sensory ≥8 AND carry_over ≥5): - Only 2 tasks visible -
Disable task creation - Hide financial stress indicators

================================================================ SECTION
6 -- ENERGY BUDGET MODEL
================================================================

Daily Capacity = 100

Task Cost: energy_required × 10

Calendar Cost: duration_hours × 15

Social Event Multiplier: ×1.5

Remaining Capacity displayed visually.

If capacity \<20: Prevent heavy task scheduling.

================================================================ SECTION
7 -- FINANCIAL ENGINE
================================================================

Quarterly savings goal defined.

Track: - target - current - weekly_required - daily_required

Impulse Entry (impulse=true): - Show 3 alternatives - Offer 24h freeze -
Show long-term savings impact

================================================================ SECTION
8 -- LEARNING ENGINE
================================================================

Weekly Target = 60 minutes Monthly Target = 1 book

Track: - streak - total minutes - completion percentage

================================================================ SECTION
9 -- EDUCATION DECISION MODULE
================================================================

Clarity Score Formula: (interest_score + future_value_score) -
effort_score

Weekly recurring "Career Research" task auto-created.

================================================================ SECTION
10 -- QUARTERLY STRATEGY SYSTEM
================================================================

Fields: - primary_theme - secondary_theme - identity_statement -
savings_goal

Quarter Reset Cron: - Archive previous - Generate new tracking period

================================================================ SECTION
11 -- PHILOSOPHY ENGINE
================================================================

Table: quotes (id 1--365)

Daily Mapping: quote_id = day_of_year(current_date)

Push time configurable.

IMPORTANT: Insert the complete structured 365 quotes dataset exactly as
provided in prior documentation into the quotes table. IDs must remain
1--365. No modification allowed except admin edits.

================================================================ SECTION
12 -- CALENDAR INTEGRATION
================================================================

Phase 1: Google OAuth read-only.

Phase 2: Two-way sync.

Conflict Resolution Rule: External calendar has priority.

Imported events reduce energy budget automatically.

================================================================ SECTION
13 -- EXECUTION SCORE
================================================================

Weekly Calculation:

(tasks_completed × 0.5) + (learning_consistency × 0.2) +
(savings_adherence × 0.2) - (carryover_penalty × 0.1)

Displayed weekly only.

================================================================ SECTION
14 -- PATTERN INTELLIGENCE
================================================================

After 30 days: - Energy trends - Avoidance frequency - Social load
impact - Spending correlation - Learning consistency trend

Reports generated weekly and monthly.

================================================================ SECTION
15 -- PUSH NOTIFICATIONS
================================================================

Types: - Daily Quote - Avoidance Alert - Weekly Learning Reminder -
Savings Alert - Shutdown Reminder

Limit: max 3/day.

================================================================ SECTION
16 -- PWA REQUIREMENTS
================================================================

-   Service Worker
-   Manifest.json
-   IndexedDB caching
-   Installable
-   Lighthouse ≥90

================================================================ SECTION
17 -- VERCEL DEPLOYMENT
================================================================

Environment Variables:

NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_APP_VERSION

Cron Jobs: - Daily rollover - Weekly report - Quarterly reset

================================================================ SECTION
18 -- FEATURE FLAGS
================================================================

Feature flags allow: - Personal strict mode - Public adaptive mode -
Advanced analytics tier

================================================================ SECTION
19 -- SECURITY & BACKUPS
================================================================

-   Supabase daily backups enabled
-   JSON export available
-   GDPR compliant deletion
-   No third-party data selling

================================================================ IMPLEMENTATION NOTES
================================================================

- quarterly_plans → implemented as quarterly_strategy table.
- execution_reports → implemented as reality_reports table (payload includes execution metrics).
- energy_required: 1–10 in DB (not 1–5); cost = energy_required × 10.
- scheduled_date → implemented as due_date on tasks.
- STABILIZE mode (MVP): trigger on carry_over ≥ 5 only; optional future: add sensory ≥ 8.
- Technical implementation: see NEUROHQ_DATABASE_SCHEMA.md and app/actions.

================================================================ END OF
ULTRA MASTER SPEC
================================================================
