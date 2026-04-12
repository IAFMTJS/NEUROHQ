-- Speeds up DELETE ... WHERE sent_at < cutoff for push_sends_log retention.

create index if not exists idx_push_sends_log_sent_at on public.push_sends_log (sent_at);
