-- Exact unlock instant for no-spend locks (date + time); enables countdown UI.
alter table public.budget_control_locks
  add column if not exists lock_until_at timestamptz;

-- Legacy rows: lock active through end of UTC calendar day of lock_until (matches prior date-only checks).
update public.budget_control_locks
set lock_until_at = (
  (lock_until::timestamp AT TIME ZONE 'UTC') + interval '1 day' - interval '1 second'
)
where lock_until_at is null;

alter table public.budget_control_locks
  alter column lock_until_at set not null;

create index if not exists budget_control_locks_user_active_until_idx
  on public.budget_control_locks (user_id, active, lock_until_at desc);
