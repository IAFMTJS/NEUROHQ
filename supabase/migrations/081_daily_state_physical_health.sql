alter table public.daily_state
  add column if not exists physical_health smallint check (physical_health is null or (physical_health >= 1 and physical_health <= 10));

comment on column public.daily_state.physical_health is '1-10 physical health/readiness for task matching';

