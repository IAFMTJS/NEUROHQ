-- Persist Task DNA as first-class fields for analysis and matching.
alter table public.tasks
  add column if not exists task_type text check (task_type is null or task_type in ('mental','physical','mixed','recovery')),
  add column if not exists intensity smallint check (intensity is null or (intensity >= 0 and intensity <= 100)),
  add column if not exists duration_minutes integer check (duration_minutes is null or (duration_minutes >= 1 and duration_minutes <= 1440)),
  add column if not exists task_tags jsonb default '[]'::jsonb;

comment on column public.tasks.task_type is 'Task DNA type: mental|physical|mixed|recovery';
comment on column public.tasks.intensity is 'Task DNA intensity 0-100';
comment on column public.tasks.duration_minutes is 'Task DNA duration in minutes';
comment on column public.tasks.task_tags is 'Task DNA tags as json array of strings';

