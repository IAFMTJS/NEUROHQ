-- Budget: when is salary available (day of month) for "days left" calculation
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS payday_day_of_month smallint CHECK (payday_day_of_month IS NULL OR (payday_day_of_month >= 1 AND payday_day_of_month <= 31));

COMMENT ON COLUMN public.users.payday_day_of_month IS 'Day of month (1-31) when salary is available; used if no income_sources';
