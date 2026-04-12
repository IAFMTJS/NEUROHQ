-- Atomically add XP to user_xp (avoids read–modify–write races when multiple awards run close together).

create or replace function public.add_user_xp_delta(p_user_id uuid, p_delta integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_new integer;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'add_user_xp_delta: wrong user';
  end if;
  if p_delta <= 0 then
    select coalesce(total_xp, 0) into v_new from public.user_xp where user_id = p_user_id;
    return coalesce(v_new, 0);
  end if;

  insert into public.user_xp (user_id, total_xp, updated_at)
  values (p_user_id, p_delta, now())
  on conflict (user_id) do update
  set total_xp = public.user_xp.total_xp + excluded.total_xp,
      updated_at = now()
  returning total_xp into v_new;

  return v_new;
end;
$$;

comment on function public.add_user_xp_delta(uuid, integer) is
  'Adds p_delta to user_xp.total_xp in one statement; returns new total. Caller must be authenticated as p_user_id.';

grant execute on function public.add_user_xp_delta(uuid, integer) to authenticated;
grant execute on function public.add_user_xp_delta(uuid, integer) to service_role;
