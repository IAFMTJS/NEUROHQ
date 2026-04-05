-- Bewaar ingediende antwoorden (geschiedenis) per user/campagne.

alter table public.user_quest_campaign_progress
  add column if not exists answer_log jsonb not null default '{"history":[]}'::jsonb;

comment on column public.user_quest_campaign_progress.answer_log is
  'Append-only pogingen: { history: [{ at, day, step, answer, correct }] }, afgekapt in de app.';
