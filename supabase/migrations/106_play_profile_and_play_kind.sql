-- Play deck: large optional JSON profile + task flag (fun / unwind / challenge)

alter table if exists public.behavior_profile
  add column if not exists play_profile jsonb not null default '{}'::jsonb;

comment on column public.behavior_profile.play_profile is
  'User Play deck questionnaire (versioned JSON). Large JSONB for habits, interests, free time, errands style, etc. — used only for optional fun/unwind/challenge task suggestions.';

alter table if exists public.tasks
  add column if not exists play_kind text
  check (play_kind is null or play_kind in ('fun', 'unwind', 'challenge'));

comment on column public.tasks.play_kind is
  'Optional: mission from Play deck (fun, unwind, challenge). Null = regular mission.';

create index if not exists tasks_user_due_play_kind_idx
  on public.tasks (user_id, due_date)
  where play_kind is not null and deleted_at is null and completed = false;
