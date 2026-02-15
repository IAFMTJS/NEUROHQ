-- NEUROHQ — Task mental load and social load (1–10)
-- Optional: how mentally draining or socially loaded the task is.

alter table public.tasks
  add column if not exists mental_load smallint check (mental_load is null or (mental_load >= 1 and mental_load <= 10)),
  add column if not exists social_load smallint check (social_load is null or (social_load >= 1 and social_load <= 10));

comment on column public.tasks.mental_load is '1–10: how mentally draining the task is (optional)';
comment on column public.tasks.social_load is '1–10: social load of the task (optional)';
