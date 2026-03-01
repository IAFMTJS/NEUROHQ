-- NEUROHQ — Assistant: user context (leren uit antwoorden) + laatste beurt (gespreksgeheugen)
-- Run after 021_assistant_escalation_identity.sql

-- 1. assistant_user_context: wat de user noemt (taak, doel, skill) → opslaan en later hergebruiken
create table if not exists public.assistant_user_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  type text not null check (type in ('task', 'goal', 'skill')),
  created_at timestamptz not null default now()
);

create index if not exists idx_assistant_user_context_user_created
  on public.assistant_user_context(user_id, created_at desc);
alter table public.assistant_user_context enable row level security;

create policy "users_own_assistant_context" on public.assistant_user_context
  for all using (auth.uid() = user_id);

comment on table public.assistant_user_context is 'Wat de user noemt (taak/doel/skill); gebruikt voor "leren uit antwoorden" en templates';

-- 2. assistant_conversation_turn: laatste beurt (één rij per user) voor follow-up ("vanavond" → "Eten maken vanavond")
create table if not exists public.assistant_conversation_turn (
  user_id uuid primary key references public.users(id) on delete cascade,
  last_user_message text,
  last_response_type text,
  last_extracted_content text,
  last_extracted_type text check (last_extracted_type is null or last_extracted_type in ('task', 'goal', 'skill')),
  updated_at timestamptz not null default now()
);

alter table public.assistant_conversation_turn enable row level security;

create policy "users_own_assistant_turn" on public.assistant_conversation_turn
  for all using (auth.uid() = user_id);

comment on table public.assistant_conversation_turn is 'Laatste assistant-beurt per user; voor gespreksgeheugen (bv. vanavond → koppelen aan laatste task)';
