-- Restore budget page data for a user to the state as of end of 2026-03-13.
-- Context:
-- - User received salary ("loon gehad") on 2026-03-05.
-- - By 2026-03-13 there was exactly €35.05 remaining in the budget.
-- Method:
-- 1) Remove any budget-related rows that were created or updated on/after 2026-03-14.
-- 2) Set last_payday_date to 2026-03-05.
-- 3) Recompute monthly_budget_cents so that remaining = 35.05 EUR on 2026-03-13,
--    keeping monthly_savings_cents as-is.
-- Run as superuser or with sufficient privileges (e.g. service role).
--
-- User: b7fc6c46-b8ca-41f4-8ece-938a34d014de
-- Restore date: 2026-03-13 (end of day UTC)

DO $$
DECLARE
  target_user_id uuid := 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';
  restore_cutoff  timestamptz := '2026-03-14 00:00:00+00';
  -- User-level values as of this period:
  v_last_payday_date       date    := '2026-03-05';  -- actual "loon gehad" date
  v_desired_remaining_cents integer := 3505;         -- €35.05 remaining on 2026-03-13
BEGIN
  -- 1. budget_entries: remove entries created or updated after restore date
  DELETE FROM public.budget_entries
  WHERE user_id = target_user_id
    AND (created_at >= restore_cutoff OR updated_at >= restore_cutoff);

  -- 2. budget_entries_archive: remove archived rows that were archived/created/updated after restore date
  DELETE FROM public.budget_entries_archive
  WHERE user_id = target_user_id
    AND (created_at >= restore_cutoff OR updated_at >= restore_cutoff OR archived_at >= restore_cutoff);

  -- 3. budget_targets
  DELETE FROM public.budget_targets
  WHERE user_id = target_user_id
    AND (created_at >= restore_cutoff OR updated_at >= restore_cutoff);

  -- 4. recurring_budget_templates
  DELETE FROM public.recurring_budget_templates
  WHERE user_id = target_user_id
    AND (created_at >= restore_cutoff OR updated_at >= restore_cutoff);

  -- 5. weekly_budget_adjustment (no updated_at column; use created_at only)
  DELETE FROM public.weekly_budget_adjustment
  WHERE user_id = target_user_id
    AND created_at >= restore_cutoff;

  -- 6. income_sources (budget page / payday)
  DELETE FROM public.income_sources
  WHERE user_id = target_user_id
    AND (created_at >= restore_cutoff OR updated_at >= restore_cutoff);

  -- 7. savings_contributions (shown in budget context; no updated_at)
  DELETE FROM public.savings_contributions
  WHERE user_id = target_user_id
    AND created_at >= restore_cutoff;

  -- 8. user_category_limits (no updated_at)
  DELETE FROM public.user_category_limits
  WHERE user_id = target_user_id
    AND created_at >= restore_cutoff;

  -- 9. savings_goals: remove only goals created after restore date (updates cannot be reverted)
  DELETE FROM public.savings_goals
  WHERE user_id = target_user_id
    AND created_at >= restore_cutoff;

  -- 10. Restore user-level "loon gehad" date and recompute monthly_budget_cents so
  --     that remaining = v_desired_remaining_cents on 2026-03-13.
  --
  -- remaining = monthly_budget_cents - monthly_savings_cents - expenses_since_payday
  -- where expenses_since_payday is the ABS sum of negative amount_cents
  -- => monthly_budget_cents = remaining + monthly_savings_cents + expenses_since_payday
  WITH expenses AS (
    SELECT COALESCE(SUM(ABS(amount_cents)), 0) AS total_expenses_cents
    FROM public.budget_entries
    WHERE user_id = target_user_id
      AND amount_cents < 0
      AND date >= v_last_payday_date
      AND date <= (restore_cutoff::date - INTERVAL '1 day')  -- up to 2026-03-13
  )
  UPDATE public.users u
  SET
    last_payday_date     = v_last_payday_date,
    monthly_budget_cents = v_desired_remaining_cents
                             + COALESCE(u.monthly_savings_cents, 0)
                             + (SELECT total_expenses_cents FROM expenses)
  WHERE u.id = target_user_id;

  RAISE NOTICE 'Restore completed: budget page data for user % rolled back to 2026-03-13 (last_payday_date=2026-03-05, remaining=€35.05).', target_user_id;
END $$;

-- Notes:
-- - This script assumes monthly_savings_cents is already correct for the period.
-- - It recalculates monthly_budget_cents so that, after rolling back post-13-03 changes,
--   the remaining budget on 2026-03-13 is exactly €35.05, given the real expenses since 2026-03-05.
