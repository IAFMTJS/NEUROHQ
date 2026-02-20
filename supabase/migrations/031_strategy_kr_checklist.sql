-- Checklist per key result: welke regels zijn afgevinkt (voor voortgang)
alter table public.quarterly_strategy
  add column if not exists kr_checked jsonb not null default '[]';

comment on column public.quarterly_strategy.kr_checked is 'Per key result line (index): true = done. Array length matches key_results line count.';
