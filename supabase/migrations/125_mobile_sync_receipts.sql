-- Mobile outbox idempotency receipts.
-- Supabase remains source of truth; this table only deduplicates retried mutations.

create table if not exists public.mobile_sync_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  action text not null,
  response_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists mobile_sync_receipts_user_created_idx
  on public.mobile_sync_receipts(user_id, created_at desc);

alter table public.mobile_sync_receipts enable row level security;

drop policy if exists "mobile_sync_receipts_select_own" on public.mobile_sync_receipts;
create policy "mobile_sync_receipts_select_own"
  on public.mobile_sync_receipts for select
  using (auth.uid() = user_id);

drop policy if exists "mobile_sync_receipts_insert_own" on public.mobile_sync_receipts;
create policy "mobile_sync_receipts_insert_own"
  on public.mobile_sync_receipts for insert
  with check (auth.uid() = user_id);

