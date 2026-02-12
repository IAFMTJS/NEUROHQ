-- NEUROHQ — Row Level Security
-- Run after 001_tables.sql

alter table public.users enable row level security;
alter table public.daily_state enable row level security;
alter table public.tasks enable row level security;
alter table public.budget_entries enable row level security;
alter table public.savings_goals enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.education_options enable row level security;
alter table public.calendar_events enable row level security;
alter table public.quotes enable row level security;
alter table public.feature_flags enable row level security;
alter table public.alternatives enable row level security;
alter table public.quarterly_strategy enable row level security;

-- users: own row only; admin can read all (admin check via function to avoid RLS recursion)
create policy "users_own_row" on public.users for all using (auth.uid() = id);
create policy "admin_read_users" on public.users for select using (public.current_user_is_admin());

-- daily_state
create policy "users_own_daily_state" on public.daily_state for all using (auth.uid() = user_id);
create policy "admin_daily_state" on public.daily_state for all using (
  public.current_user_is_admin()
);

-- tasks
create policy "users_own_tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "admin_tasks" on public.tasks for all using (
  public.current_user_is_admin()
);

-- budget_entries
create policy "users_own_budget_entries" on public.budget_entries for all using (auth.uid() = user_id);
create policy "admin_budget_entries" on public.budget_entries for all using (
  public.current_user_is_admin()
);

-- savings_goals
create policy "users_own_savings_goals" on public.savings_goals for all using (auth.uid() = user_id);
create policy "admin_savings_goals" on public.savings_goals for all using (
  public.current_user_is_admin()
);

-- learning_sessions
create policy "users_own_learning_sessions" on public.learning_sessions for all using (auth.uid() = user_id);
create policy "admin_learning_sessions" on public.learning_sessions for all using (
  public.current_user_is_admin()
);

-- education_options
create policy "users_own_education_options" on public.education_options for all using (auth.uid() = user_id);
create policy "admin_education_options" on public.education_options for all using (
  public.current_user_is_admin()
);

-- calendar_events
create policy "users_own_calendar_events" on public.calendar_events for all using (auth.uid() = user_id);
create policy "admin_calendar_events" on public.calendar_events for all using (
  public.current_user_is_admin()
);

-- quotes: all authenticated can read
create policy "quotes_select_authenticated" on public.quotes for select to authenticated using (true);

-- feature_flags: all can read; only admin can write (use service role or admin check in app for insert/update/delete)
create policy "feature_flags_select" on public.feature_flags for select to authenticated using (true);
create policy "feature_flags_admin_all" on public.feature_flags for all using (
  public.current_user_is_admin()
);

-- alternatives
create policy "users_own_alternatives" on public.alternatives for all using (auth.uid() = user_id);
create policy "admin_alternatives" on public.alternatives for all using (
  public.current_user_is_admin()
);

-- quarterly_strategy
create policy "users_own_quarterly_strategy" on public.quarterly_strategy for all using (auth.uid() = user_id);
create policy "admin_quarterly_strategy" on public.quarterly_strategy for all using (
  public.current_user_is_admin()
);
