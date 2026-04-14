-- Remove indexes that duplicate an existing unique constraint or another identical btree index.
-- Safe: lookups on daily_state (user_id, date) use daily_state_user_id_date_key from UNIQUE(user_id, date).
-- Safe: recurring_budget_templates already has idx_recurring_budget_templates_user_next (migration 017).

drop index if exists public.idx_daily_state_user_date;

drop index if exists public.idx_recurring_templates_user_next;
