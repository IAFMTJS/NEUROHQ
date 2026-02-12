-- Strategy enhancements: anti-goals, one-word, north-star, structured key results

-- Quarterly strategy: new fields
alter table public.quarterly_strategy
  add column if not exists anti_goals text,
  add column if not exists one_word text,
  add column if not exists north_star text;

comment on column public.quarterly_strategy.anti_goals is 'What I am explicitly not doing this quarter (free text).';
comment on column public.quarterly_strategy.one_word is 'Single word for the quarter (e.g. Focus, Ship).';
comment on column public.quarterly_strategy.north_star is 'If I could only do one thing this quarter.';

-- Structured key results (optional; key_results text kept for backward compat)
create table if not exists public.strategy_key_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  strategy_id uuid not null references public.quarterly_strategy(id) on delete cascade,
  title text not null,
  target_date date,
  status text not null default 'not_started',
  progress_pct smallint default 0,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.strategy_key_results.status is 'not_started | in_progress | on_track | at_risk | stalled | done';
alter table public.strategy_key_results
  add constraint strategy_key_results_status_check check (status in ('not_started', 'in_progress', 'on_track', 'at_risk', 'stalled', 'done'));
alter table public.strategy_key_results
  add constraint strategy_key_results_progress_check check (progress_pct >= 0 and progress_pct <= 100);

create index if not exists idx_strategy_key_results_strategy on public.strategy_key_results(strategy_id);
create index if not exists idx_strategy_key_results_user on public.strategy_key_results(user_id);
alter table public.strategy_key_results enable row level security;
create policy "users_own_strategy_key_results" on public.strategy_key_results for all using (auth.uid() = user_id);

-- Tasks: link to a key result (optional)
alter table public.tasks
  add column if not exists strategy_key_result_id uuid references public.strategy_key_results(id) on delete set null;

comment on column public.tasks.strategy_key_result_id is 'Optional link to quarterly key result for alignment.';

-- Learning sessions: link to quarter theme (store quarter/year so we can show "learning toward Q theme")
alter table public.learning_sessions
  add column if not exists strategy_quarter smallint,
  add column if not exists strategy_year smallint;

comment on column public.learning_sessions.strategy_quarter is 'When logging, optional quarter this learning supports (1-4).';
comment on column public.learning_sessions.strategy_year is 'Year of quarter this learning supports.';
