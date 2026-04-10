-- Single-query SUM(xp_events.amount) for XP display and reconciliation with user_xp.total_xp.
-- security invoker: RLS on xp_events applies when called as authenticated user.

create or replace function public.sum_xp_events_for_user(p_user_id uuid)
returns bigint
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  select coalesce(sum(e.amount), 0)::bigint
  from public.xp_events e
  where e.user_id = p_user_id;
$$;

comment on function public.sum_xp_events_for_user(uuid) is
  'Returns SUM(xp_events.amount) for p_user_id. Used with user_xp.total_xp to show full account XP when the row lags the ledger.';

grant execute on function public.sum_xp_events_for_user(uuid) to authenticated;
grant execute on function public.sum_xp_events_for_user(uuid) to service_role;
