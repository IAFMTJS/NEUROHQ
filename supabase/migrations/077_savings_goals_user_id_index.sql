-- 077_savings_goals_user_id_index.sql
-- Purpose: speed up per-user savings_goals queries

create index if not exists savings_goals_user_id_idx
  on public.savings_goals (user_id);

