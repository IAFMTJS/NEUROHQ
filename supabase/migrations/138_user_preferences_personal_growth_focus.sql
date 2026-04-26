-- Personal Growth hub: store user's active growth area + focus goal + influence controls.
alter table if exists public.user_preferences
  add column if not exists personal_growth_focus_area text null,
  add column if not exists personal_growth_focus_goal text null,
  add column if not exists personal_growth_focus_tags text[] null,
  add column if not exists personal_growth_intensity text null
    check (personal_growth_intensity is null or personal_growth_intensity in ('light', 'normal', 'intense')),
  add column if not exists personal_growth_horizon_days int null
    check (personal_growth_horizon_days is null or personal_growth_horizon_days between 7 and 28),
  add column if not exists personal_growth_updated_at timestamptz null;

comment on column public.user_preferences.personal_growth_focus_area is
  'Optional personal growth area label (preset or user custom).';
comment on column public.user_preferences.personal_growth_focus_goal is
  'Optional active personal growth focus goal (free text).';
comment on column public.user_preferences.personal_growth_focus_tags is
  'Optional tags for personal growth focus goal.';
comment on column public.user_preferences.personal_growth_intensity is
  'Influence control: light|normal|intense influences task count/density.';
comment on column public.user_preferences.personal_growth_horizon_days is
  'Influence control: number of days to spread generated tasks across (7–28).';
comment on column public.user_preferences.personal_growth_updated_at is
  'Last update timestamp for personal growth focus settings.';

