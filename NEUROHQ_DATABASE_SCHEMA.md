# NEUROHQ — Database Schema (Column-Level)

**Purpose:** Single source of truth for table columns, types, and constraints. Use this to generate Supabase migrations and TypeScript types.

**Conventions:**  
- All tables: `created_at timestamptz default now()`.  
- User-bound tables: `user_id uuid not null references auth.users(id) on delete cascade`.  
- RLS enabled on all user tables; policy: `auth.uid() = user_id` (and admin override where noted).  
- Use `uuid` for primary keys unless otherwise stated.

---

## 1. `users` (profile / app user)

Extends Supabase `auth.users`. Create row via trigger or Edge Function on signup.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK; = auth.users.id |
| email | text | YES | From auth |
| display_name | text | YES | |
| avatar_url | text | YES | |
| timezone | text | YES | IANA e.g. Europe/Amsterdam (for cron/rollover) |
| role | text | YES | 'user' \| 'admin' (default 'user') |
| push_subscription_json | jsonb | YES | Web Push subscription for notifications |
| push_quote_enabled | boolean | YES | Default true |
| push_quote_time | time | YES | e.g. 08:00 (morning) |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**RLS:** Users can read/update own row; admin can read all (override in policy if needed).

---

## 2. `daily_state`

One row per user per calendar day (date in user’s timezone). Used by Mood Adaptive Engine.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK default gen_random_uuid() |
| user_id | uuid | NO | FK users |
| date | date | NO | Calendar day (user timezone) |
| energy | smallint | YES | 1–10 |
| focus | smallint | YES | 1–10 |
| sensory_load | smallint | YES | 1–10 |
| sleep_hours | numeric(3,1) | YES | e.g. 7.5 |
| social_load | smallint | YES | 1–10 or similar |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**Unique:** (user_id, date).  
**RLS:** auth.uid() = user_id.

---

## 3. `tasks`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| title | text | NO | |
| due_date | date | YES | Task is “for” this day |
| completed | boolean | NO | Default false |
| completed_at | timestamptz | YES | |
| carry_over_count | smallint | NO | Default 0; incremented on rollover |
| energy_required | smallint | YES | 1–10 (cost = energy_required × 10) |
| priority | smallint | YES | 1–5 optional; “high impact” when e.g. ≥ 4 (DRIVEN mode) |
| notes | text | YES | |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**Heavy task:** energy_required ≥ 7 (hide in LOW_ENERGY).  
**High impact:** priority ≥ 4 (prioritize in DRIVEN).  
**RLS:** auth.uid() = user_id. Admin override: allow all for role = 'admin' if needed.

---

## 4. `budget_entries`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| amount_cents | integer | NO | Positive = income, negative = expense |
| date | date | NO | |
| category | text | YES | e.g. food, transport |
| note | text | YES | |
| is_planned | boolean | NO | Default false (for 24h freeze: planned purchase) |
| freeze_until | timestamptz | YES | 24h freeze end; reminder after this |
| freeze_reminder_sent | boolean | NO | Default false |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**RLS:** auth.uid() = user_id.

---

## 5. `savings_goals`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| name | text | NO | |
| target_cents | integer | NO | |
| current_cents | integer | NO | Default 0 |
| deadline | date | YES | |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**Weekly required:** (target_cents - current_cents) / weeks_until_deadline.  
**RLS:** auth.uid() = user_id.

---

## 6. `learning_sessions`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| minutes | smallint | NO | |
| date | date | NO | |
| topic | text | YES | e.g. book title, course name |
| created_at | timestamptz | NO | |

**RLS:** auth.uid() = user_id.

---

## 7. `education_options`

Courses, books, skills user is considering. Clarity score = interest + future_value - effort.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| name | text | NO | |
| interest_score | smallint | YES | 1–10 |
| future_value_score | smallint | YES | 1–10 |
| effort_score | smallint | YES | 1–10 |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**RLS:** auth.uid() = user_id.

---

## 8. `calendar_events`

Synced from Google (or manual). Used for energy budget (duration_hours × 15, ×1.5 if social).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| external_id | text | YES | Google event id |
| title | text | YES | |
| start_at | timestamptz | NO | |
| end_at | timestamptz | NO | |
| duration_hours | numeric(4,2) | YES | Computed or stored |
| is_social | boolean | NO | Default false (multiply cost by 1.5) |
| source | text | YES | 'google' \| 'manual' |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**RLS:** auth.uid() = user_id.

---

## 9. `quotes`

Seeded once; id 1–365 = day of year. No user_id; global read.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | smallint | NO | PK; 1–365 (day_of_year) |
| author_name | text | NO | |
| era | text | NO | |
| topic | text | YES | e.g. virtue, ego (parsed from "On X:") |
| quote_text | text | NO | The quote only (without "On X:") |
| created_at | timestamptz | NO | |

**RLS:** Enable RLS; policy: allow select for authenticated (or all). No user_id.

---

## 10. `feature_flags`

Global or per-user toggles. Admin-only write.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| name | text | NO | Unique, e.g. calendar_integration, push_quotes |
| enabled | boolean | NO | Default false |
| user_id | uuid | YES | If null = global; else per-user override |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**Suggested flags:** calendar_integration, push_quotes, push_avoidance, push_learning, push_savings, push_shutdown, stabilize_mode_forced.  
**RLS:** All can read; only admin can insert/update/delete.

---

## 11. `alternatives`

Suggestions (e.g. for impulse / 24h freeze). Reference another entity.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| type | text | NO | e.g. 'purchase_freeze', 'savings_alternative' |
| reference_id | uuid | YES | budget_entries.id or savings_goals.id |
| suggestion_text | text | NO | |
| created_at | timestamptz | NO | |

**RLS:** auth.uid() = user_id.

---

## 12. Quarterly strategy

Not a separate table in the original list; can live on `users` or a `quarterly_strategy` table. Recommended: one row per user per quarter.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK |
| quarter | smallint | NO | 1–4 |
| year | smallint | NO | |
| primary_theme | text | YES | |
| secondary_theme | text | YES | |
| savings_goal_id | uuid | YES | FK savings_goals |
| identity_statement | text | YES | |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**Unique:** (user_id, year, quarter).  
**RLS:** auth.uid() = user_id.

---

## 13. `user_preferences` (theme, emotion)

Theme, color mode, and selected emotion for mood-based UI.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| user_id | uuid | NO | PK, FK users |
| theme | text | NO | 'normal' \| 'girly' \| 'industrial', default 'normal' |
| color_mode | text | NO | 'dark' \| 'light', default 'dark' |
| selected_emotion | text | YES | e.g. drained, sleepy, motivated, excited, angry, hyped, neon, evil |
| updated_at | timestamptz | NO | default now() |

**RLS:** auth.uid() = user_id.

---

## 14. `user_xp`

Accumulated XP for gamification (level derivable from total_xp if needed).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| user_id | uuid | NO | PK, FK users |
| total_xp | integer | NO | Default 0, check >= 0 |
| updated_at | timestamptz | NO | default now() |

**RLS:** auth.uid() = user_id.

---

## 15. `user_analytics_daily`

Daily aggregates for personal analytics: time used, consistency, improvements.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK users |
| date | date | NO | |
| active_seconds | integer | NO | Default 0 |
| tasks_completed | smallint | NO | Default 0 |
| tasks_planned | smallint | NO | Default 0 |
| learning_minutes | smallint | NO | Default 0 |
| brain_status_logged | boolean | NO | Default false |
| carry_over_count | smallint | NO | Default 0 |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | default now() |

**Unique:** (user_id, date). **RLS:** auth.uid() = user_id.

---

## Indexes (recommended)

- `daily_state(user_id, date)` unique  
- `tasks(user_id, due_date)`, `tasks(user_id, due_date, completed)`  
- `budget_entries(user_id, date)`  
- `learning_sessions(user_id, date)`  
- `calendar_events(user_id, start_at)`  
- `feature_flags(name), feature_flags(name, user_id)`  
- `quotes(id)` (PK)
- `user_analytics_daily(user_id, date)` unique

---

## Admin override (RLS)

Example for `tasks` (repeat pattern for other user tables if admin must see/edit any user):

```sql
-- Users see own rows
create policy "users_own_tasks" on tasks for all
  using (auth.uid() = user_id);

-- Admins see all (optional)
create policy "admin_all_tasks" on tasks for all
  using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );
```

Use `with check` as needed so admins can only update (not delete) if you want to restrict.

---

## Quotes seed from `365_Philosophical_Quotes_Structured.txt`

- Parse each block: `id`, `name`, `era`, and `quote` (full string).
- Split `quote`: "On topic: rest" → `topic` = "topic", `quote_text` = "rest" (or keep full quote in quote_text and store topic separately from first segment).
- Insert into `quotes(id, author_name, era, topic, quote_text)`.
- id 1–365 must match day-of-year (1 = Jan 1, 365 = Dec 31).

---

END OF SCHEMA
