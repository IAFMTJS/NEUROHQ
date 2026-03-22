-- DCIC: lock operational mode (focus / war / recovery) for the calendar day so it does not
-- flip on every bootstrap/getGameState; snapshot + API stay aligned.

alter table public.daily_state
  add column if not exists dcic_mode text
  check (dcic_mode is null or dcic_mode in ('focus', 'war', 'recovery'));

comment on column public.daily_state.dcic_mode is
  'DCIC mode chosen for this day; first non-null wins (see lock_daily_dcic_mode_if_unset).';

-- Atomically set dcic_mode only when still null (first resolution of the day).
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
  if p_mode is null or p_mode not in ('focus', 'war', 'recovery') then
    return;
  end if;

  insert into public.daily_state (user_id, date, dcic_mode)
  values (p_user_id, p_date, p_mode)
  on conflict (user_id, date) do update
  set dcic_mode = coalesce(public.daily_state.dcic_mode, excluded.dcic_mode);
end;
$$;

grant execute on function public.lock_daily_dcic_mode_if_unset(uuid, date, text) to authenticated;
