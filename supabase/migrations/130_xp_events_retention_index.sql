-- Speeds up DELETE ... WHERE created_at < cutoff for xp_events retention.

create index if not exists idx_xp_events_created_at on public.xp_events (created_at);
