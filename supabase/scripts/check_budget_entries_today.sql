-- Check budget entries vandaag (date = today)
-- Run in Supabase SQL Editor; RLS applies, je ziet alleen eigen rijen.

select
  id,
  user_id,
  amount_cents,
  round(amount_cents / 100.0, 2) as amount,
  date,
  category,
  note,
  is_planned,
  freeze_until,
  created_at
from public.budget_entries
where date = current_date
order by created_at desc;

-- Samenvatting vandaag: uitgaven als positief bedrag, inkomsten positief
select
  count(*) filter (where amount_cents < 0) as aantal_uitgaven,
  abs(coalesce(sum(amount_cents) filter (where amount_cents < 0), 0)) as uitgaven_cents,
  round(abs(coalesce(sum(amount_cents) filter (where amount_cents < 0), 0)) / 100.0, 2) as uitgaven_eur,
  count(*) filter (where amount_cents > 0) as aantal_inkomsten,
  coalesce(sum(amount_cents) filter (where amount_cents > 0), 0) as inkomsten_cents,
  round(coalesce(sum(amount_cents) filter (where amount_cents > 0), 0) / 100.0, 2) as inkomsten_eur
from public.budget_entries
where date = current_date;
