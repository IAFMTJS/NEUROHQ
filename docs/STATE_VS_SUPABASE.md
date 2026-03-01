# State vs Supabase — What lives where

**Goal:** Keep the site smooth by using client/global state where possible and Supabase only for user-specific, mutable data.

## Supabase (user-specific, mutable)

- **Auth:** `auth.users`, session
- **Tasks:** `tasks`, `subtasks`, `task_events`
- **Daily state:** `daily_state` (energy, focus, sensory_load, etc.)
- **Budget:** `budget_entries`, `budget_targets`, `budget_settings`, `savings_goals`, etc.
- **Learning:** `learning_sessions`, `learning_reflections`, `education_options`, `monthly_books`
- **Strategy:** `strategy_*` tables, check-ins
- **XP / gamification:** `user_xp`, `user_streak`, `user_gamification`, `xp_events`
- **Calendar:** `calendar_events`, Google token
- **Reports / behaviour:** `behaviour_log`, `weekly_reports`, etc.

## State / cache (client or server cache)

- **Static or shared:** Mission templates (`lib/mission-templates.ts`), quote list, default categories, app config
- **Per-session:** Dashboard critical payload can be cached in `DashboardDataProvider` so revisiting dashboard doesn’t refetch until invalidated
- **Today’s data:** Consider caching today’s tasks, daily_state, energy budget in client state and invalidating on mutation (task complete, state save, etc.)

## Implementation notes

- Dashboard API: reduce duplicate loads (e.g. single `getDailyState` and pass-through where possible).
- Mutations (task complete, daily state save, budget log) should invalidate the relevant cache or refetch so the UI stays correct.
- CSS spacing tokens: `--page-padding-x`, `--section-gap`, `--card-gap`, `--content-max-width` in `app/globals.css` for consistent layout.
