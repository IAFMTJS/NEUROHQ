-- Add key results / milestones to quarterly strategy
alter table public.quarterly_strategy
  add column if not exists key_results text;

comment on column public.quarterly_strategy.key_results is 'Key results or milestones for the quarter (free text).';
