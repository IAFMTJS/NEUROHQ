-- NEUROHQ — Triggers and functions
-- Run after 002_rls.sql

-- Create public.users row when auth.users signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users (run as superuser or in Supabase Dashboard)
-- In Supabase: Database -> Webhooks or use this via SQL if you have access to auth schema:
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- If Supabase doesn't allow trigger on auth.users, create users via Edge Function or app logic on first login instead.

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at to tables that have it
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_daily_state_updated_at before update on public.daily_state for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger set_budget_entries_updated_at before update on public.budget_entries for each row execute function public.set_updated_at();
create trigger set_savings_goals_updated_at before update on public.savings_goals for each row execute function public.set_updated_at();
create trigger set_education_options_updated_at before update on public.education_options for each row execute function public.set_updated_at();
create trigger set_calendar_events_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();
create trigger set_feature_flags_updated_at before update on public.feature_flags for each row execute function public.set_updated_at();
create trigger set_quarterly_strategy_updated_at before update on public.quarterly_strategy for each row execute function public.set_updated_at();
