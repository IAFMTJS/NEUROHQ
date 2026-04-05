-- Publieke prijsomschrijving voor platformquest (getoond aan start + op profiel).

alter table public.platform_quest_campaigns
  add column if not exists prize_summary text;

comment on column public.platform_quest_campaigns.prize_summary is
  'Vrije tekst: wat spelers kunnen winnen (XP, flex, badge). Leeg = app vult af uit numerieke velden.';
