-- Fix infinite recursion: policies on public.users must not SELECT from public.users.
-- Add SECURITY DEFINER helper and replace inline admin checks with it.

create or replace function public.current_user_is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- users
drop policy if exists "admin_read_users" on public.users;
create policy "admin_read_users" on public.users for select using (public.current_user_is_admin());

-- daily_state
drop policy if exists "admin_daily_state" on public.daily_state;
create policy "admin_daily_state" on public.daily_state for all using (public.current_user_is_admin());

-- tasks
drop policy if exists "admin_tasks" on public.tasks;
create policy "admin_tasks" on public.tasks for all using (public.current_user_is_admin());

-- budget_entries
drop policy if exists "admin_budget_entries" on public.budget_entries;
create policy "admin_budget_entries" on public.budget_entries for all using (public.current_user_is_admin());

-- savings_goals
drop policy if exists "admin_savings_goals" on public.savings_goals;
create policy "admin_savings_goals" on public.savings_goals for all using (public.current_user_is_admin());

-- learning_sessions
drop policy if exists "admin_learning_sessions" on public.learning_sessions;
create policy "admin_learning_sessions" on public.learning_sessions for all using (public.current_user_is_admin());

-- education_options
drop policy if exists "admin_education_options" on public.education_options;
create policy "admin_education_options" on public.education_options for all using (public.current_user_is_admin());

-- calendar_events
drop policy if exists "admin_calendar_events" on public.calendar_events;
create policy "admin_calendar_events" on public.calendar_events for all using (public.current_user_is_admin());

-- feature_flags
drop policy if exists "feature_flags_admin_all" on public.feature_flags;
create policy "feature_flags_admin_all" on public.feature_flags for all using (public.current_user_is_admin());

-- alternatives
drop policy if exists "admin_alternatives" on public.alternatives;
create policy "admin_alternatives" on public.alternatives for all using (public.current_user_is_admin());

-- quarterly_strategy
drop policy if exists "admin_quarterly_strategy" on public.quarterly_strategy;
create policy "admin_quarterly_strategy" on public.quarterly_strategy for all using (public.current_user_is_admin());
