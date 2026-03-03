-- Track whether auto master missions were already generated for a given day.
alter table public.daily_state
  add column if not exists auto_master_missions_generated boolean not null default false;

comment on column public.daily_state.auto_master_missions_generated is
  'True when MasterPool auto-missions have been generated for this user/date.';

