-- Brain training progress (low-egress): store only aggregate XP sync state per user.

create table if not exists public.brain_progress (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_xp integer not null default 0,
  xp_today integer not null default 0,
  streak_count integer not null default 0,
  last_daily_sync_date date,
  updated_at timestamptz not null default now()
);

create index if not exists brain_progress_last_daily_sync_date_idx
  on public.brain_progress(last_daily_sync_date);

alter table public.brain_progress enable row level security;

drop policy if exists "brain_progress_select_own" on public.brain_progress;
create policy "brain_progress_select_own"
on public.brain_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "brain_progress_insert_own" on public.brain_progress;
create policy "brain_progress_insert_own"
on public.brain_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "brain_progress_update_own" on public.brain_progress;
create policy "brain_progress_update_own"
on public.brain_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.brain_progress to authenticated;
grant select, insert, update on public.brain_progress to service_role;

create or replace function public.apply_brain_xp_sync(
  p_client_date date,
  p_requested_xp integer
)
returns table (
  accepted_xp integer,
  total_xp integer,
  xp_today integer,
  server_date date
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing_total integer := 0;
  v_prev_date date;
  v_prev_xp_today integer;
  v_day_xp integer;
  v_cap integer := 300;
  v_room integer;
  v_accepted integer;
  v_new_total integer;
begin
  if v_user is null then
    raise exception 'apply_brain_xp_sync: unauthorized';
  end if;

  if p_client_date is null then
    raise exception 'apply_brain_xp_sync: missing client date';
  end if;

  if p_requested_xp is null then
    p_requested_xp := 0;
  end if;

  select coalesce(total_xp, 0)
    into v_existing_total
  from public.user_xp
  where user_id = v_user;

  insert into public.brain_progress (user_id, total_xp, xp_today, streak_count, last_daily_sync_date, updated_at)
  values (v_user, v_existing_total, 0, 0, p_client_date, now())
  on conflict (user_id) do nothing;

  select bp.total_xp, bp.last_daily_sync_date, bp.xp_today
    into v_existing_total, v_prev_date, v_prev_xp_today
  from public.brain_progress bp
  where bp.user_id = v_user
  for update;

  if v_prev_date is distinct from p_client_date then
    v_day_xp := 0;
  else
    v_day_xp := greatest(0, coalesce(v_prev_xp_today, 0));
  end if;

  v_room := greatest(0, v_cap - v_day_xp);
  v_accepted := least(greatest(p_requested_xp, 0), v_room);

  update public.brain_progress
  set
    total_xp = v_existing_total + v_accepted,
    xp_today = v_day_xp + v_accepted,
    last_daily_sync_date = p_client_date,
    updated_at = now()
  where user_id = v_user
  returning brain_progress.total_xp, brain_progress.xp_today
    into v_new_total, xp_today;

  if v_accepted > 0 then
    insert into public.user_xp (user_id, total_xp, updated_at)
    values (v_user, v_accepted, now())
    on conflict (user_id) do update
    set total_xp = public.user_xp.total_xp + excluded.total_xp,
        updated_at = now();

    insert into public.xp_events (user_id, amount, source_type, task_id)
    values (v_user, v_accepted, 'brain_training_daily', null);
  end if;

  accepted_xp := v_accepted;
  total_xp := v_new_total;
  server_date := current_date;
  return next;
end;
$$;

grant execute on function public.apply_brain_xp_sync(date, integer) to authenticated;
grant execute on function public.apply_brain_xp_sync(date, integer) to service_role;
