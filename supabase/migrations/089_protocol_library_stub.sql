-- Content library for long-form protocols (D.3 import path). Seeds via scripts/import-protocols-json.mjs
create table if not exists public.protocol_library (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale text not null default 'nl',
  title text not null,
  summary text,
  body_md text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale)
);

create index if not exists protocol_library_locale_sort_idx
  on public.protocol_library (locale, sort_order);

alter table public.protocol_library enable row level security;

create policy "protocol_library_select_authenticated"
  on public.protocol_library for select
  to authenticated
  using (true);

comment on table public.protocol_library is 'Imported protocol content (e.g. training trajectories); not mission-critical app state';
