-- Work vs personal; weekly recurrence on specific weekdays (routine schema)

alter table public.tasks
  add column if not exists category text check (category is null or category in ('work', 'personal'));

alter table public.tasks
  add column if not exists recurrence_weekdays text;

comment on column public.tasks.category is 'work | personal; for dividing missions';
comment on column public.tasks.recurrence_weekdays is 'For weekly recurrence: comma-separated ISO weekday 1=Mon..7=Sun e.g. 1,3,5 for Mon,Wed,Fri';
