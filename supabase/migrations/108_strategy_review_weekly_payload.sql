-- Rich weekly strategy review: 4 pillars × (3 Likert + open text). Drives app lock until complete when review is due.
ALTER TABLE public.strategy_review
  ADD COLUMN IF NOT EXISTS weekly_review_payload jsonb;

COMMENT ON COLUMN public.strategy_review.weekly_review_payload IS
  'Per pillar (savings, learning, xp, discipline): { q1–q3: 1–5, open: string }. Required for lock release when week review is due.';
