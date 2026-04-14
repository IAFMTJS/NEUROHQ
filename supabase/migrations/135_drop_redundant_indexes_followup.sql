-- Follow-up redundant indexes (verified against migrations / btree prefix rules).
--
-- 1) users.calendar_feed_token: UNIQUE already creates users_calendar_feed_token_key.
--    Partial index idx_users_calendar_feed_token (023) duplicates lookups on token.
-- 2) mission_chain_steps: UNIQUE (chain_id, step_order) supports chain_id prefix scans;
--    idx_mission_chain_steps_chain (036) on (chain_id) alone is redundant.
-- 3) savings_goals: migration 077 adds savings_goals_user_id_idx on (user_id).
--    idx_savings_goals_user (same role, not in repo) — drop if present.

drop index if exists public.idx_users_calendar_feed_token;

drop index if exists public.idx_mission_chain_steps_chain;

drop index if exists public.idx_savings_goals_user;
