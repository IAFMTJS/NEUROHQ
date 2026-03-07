-- NEUROHQ — Generic detail per category (e.g. restaurant, transport provider, meal type)
alter table public.budget_entries
  add column if not exists detail_name text;

comment on column public.budget_entries.detail_name is 'Category-specific detail: e.g. restaurant (Uit eten), transport provider (Vervoer), meal type (Eten), provider (Gezondheid), or free text (Overig).';
