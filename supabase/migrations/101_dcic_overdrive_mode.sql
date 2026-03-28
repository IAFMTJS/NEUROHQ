-- DCIC Overdrive: double-XP event mode + lock window + session start (overheat).

alter table public.daily_state drop constraint if exists daily_state_dcic_mode_check;

alter table public.daily_state
  add constraint daily_state_dcic_mode_check
  check (dcic_mode is null or dcic_mode in ('focus', 'war', 'recovery', 'overdrive'));

alter table public.daily_state
  add column if not exists dcic_locked_until timestamptz;

alter table public.daily_state
  add column if not exists dcic_overdrive_session_start timestamptz;

comment on column public.daily_state.dcic_locked_until is
  'End of lock window for war/overdrive; mode switch blocked until then.';

comment on column public.daily_state.dcic_overdrive_session_start is
  'Start of current Overdrive session (XP overheat decay).';

create or replace function public.lock_daily_dcic_mode_if_unset(
  p_user_id uuid,
  p_date date,
  p_mode text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_mode is null or p_mode not in ('focus', 'war', 'recovery', 'overdrive') then
    return;
  end if;

  insert into public.daily_state (user_id, date, dcic_mode)
  values (p_user_id, p_date, p_mode)
  on conflict (user_id, date) do update
  set dcic_mode = coalesce(public.daily_state.dcic_mode, excluded.dcic_mode);
end;
$$;
