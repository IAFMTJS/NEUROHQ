-- Add impact (1-3) and urgency (1-3) to tasks per Ultra Master Spec (DRIVEN sort / future use)
alter table public.tasks
  add column if not exists impact smallint check (impact is null or (impact >= 1 and impact <= 3)),
  add column if not exists urgency smallint check (urgency is null or (urgency >= 1 and urgency <= 3));

comment on column public.tasks.impact is '1-3; high impact prioritised in DRIVEN mode';
comment on column public.tasks.urgency is '1-3; for sorting/filtering';
