-- Per-user voortgang voor platform_games (checklist / antwoord); win zonder geheime accepts naar de client te sturen.

create table if not exists public.user_platform_game_progress (
  user_id uuid not null references public.users (id) on delete cascade,
  game_id uuid not null references public.platform_games (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists idx_user_platform_game_progress_game on public.user_platform_game_progress (game_id);

comment on table public.user_platform_game_progress is 'Voortgang platform game: state.checklist[id], completed_at bij behalen win-voorwaarde.';

alter table public.user_platform_game_progress enable row level security;

create policy "user_platform_game_progress_own" on public.user_platform_game_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_platform_game_progress_admin_all" on public.user_platform_game_progress
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
