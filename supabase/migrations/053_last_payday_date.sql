-- Loon is afhankelijk van maand en verwerkingstijd: gebruiker kan "Vandaag loon gehad" indrukken.
-- Periode = van last_payday_date tot volgende verwachte loondatum.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_payday_date date;

COMMENT ON COLUMN public.users.last_payday_date IS 'Date user last received salary; budget cycle starts here until next expected payday';
