-- =============================================================================
-- Brain state (Hoe voel je je vandaag?) wordt opgeslagen in:
--   public.daily_state
-- =============================================================================
-- Gebruik: Run in Supabase Dashboard → SQL Editor.
-- RLS: met anon key zie je alleen eigen rijen; met service_role zie je alles.
--
-- Opmerking: Query 2 toont alle kolommen. Als auto_master_missions_generated
-- ontbreekt, run dan migratie 058_daily_state_auto_master_flag.sql voor auto-missies.
-- =============================================================================

-- 1) "Vandaag" in Europe/Amsterdam (zoals de app)
select (current_timestamp at time zone 'Europe/Amsterdam')::date as today_amsterdam;

-- 2) Alle kolommen daily_state (waar brain state in staat)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'daily_state'
order by ordinal_position;

-- 3) Recente brain-state rijen (laatste 14 dagen). Alleen basiskolommen (bestaan in alle migraties).
select
  ds.id,
  ds.user_id,
  u.email,
  ds.date,
  ds.energy,
  ds.focus,
  ds.sensory_load,
  ds.social_load,
  ds.sleep_hours,
  ds.created_at,
  ds.updated_at
from public.daily_state ds
left join public.users u on u.id = ds.user_id
where ds.date >= current_date - interval '14 days'
order by ds.date desc, ds.updated_at desc;

-- 4) Alleen vandaag (Europe/Amsterdam) — controleer of er een rij is voor jouw user
select
  ds.id,
  ds.user_id,
  u.email,
  ds.date,
  ds.energy,
  ds.focus,
  ds.sensory_load,
  ds.social_load,
  ds.sleep_hours,
  ds.created_at
from public.daily_state ds
left join public.users u on u.id = ds.user_id
where ds.date = (current_timestamp at time zone 'Europe/Amsterdam')::date
order by ds.updated_at desc;

-- 5) Aantal rijen per datum (laatste 7 dagen)
select
  date,
  count(*) as aantal_users
from public.daily_state
where date >= current_date - interval '7 days'
group by date
order by date desc;
