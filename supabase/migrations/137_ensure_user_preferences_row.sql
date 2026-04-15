-- Ensure every user has a user_preferences row (prevents PostgREST 406 loops on maybeSingle/single).
-- Backfill existing users + create trigger for new users.

-- 1) Backfill: insert a prefs row for any user missing one.
insert into public.user_preferences (user_id)
select u.id
from public.users u
left join public.user_preferences p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;

-- 2) Trigger: on new users row, ensure prefs row exists.
create or replace function public.ensure_user_preferences_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_user_preferences_for_user on public.users;
create trigger trg_ensure_user_preferences_for_user
after insert on public.users
for each row
execute function public.ensure_user_preferences_for_user();

revoke all on function public.ensure_user_preferences_for_user() from public;
grant execute on function public.ensure_user_preferences_for_user() to authenticated;

