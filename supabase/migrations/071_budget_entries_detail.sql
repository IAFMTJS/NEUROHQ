-- NEUROHQ — Advanced budget logging: store and subscription detail
alter table public.budget_entries
  add column if not exists store_name text,
  add column if not exists subscription_name text;

comment on column public.budget_entries.store_name is 'For category boodschappen: which supermarket (e.g. Albert Heijn, Lidl)';
comment on column public.budget_entries.subscription_name is 'For category subscriptions: which subscription (e.g. Netflix, Spotify)';
