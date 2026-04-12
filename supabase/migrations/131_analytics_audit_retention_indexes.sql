-- Speeds up DELETE ... WHERE created_at < cutoff for retention jobs.

create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at);
create index if not exists idx_user_actions_audit_created_at on public.user_actions_audit (created_at);
