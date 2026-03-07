-- NEUROHQ — Evening no-task explanation (for ML / analytics)
CREATE TABLE IF NOT EXISTS public.daily_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason_type text,
  explanation_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

comment on table public.daily_explanations is 'Optional user explanation when no task added or no task completed by 21:00 (for ML/analytics)';
comment on column public.daily_explanations.reason_type is 'no_tasks_added | no_tasks_completed | both';
comment on column public.daily_explanations.explanation_text is 'Free-text explanation from the user';

alter table public.daily_explanations enable row level security;

create policy "Users can insert own daily_explanations"
  on public.daily_explanations for insert
  with check (auth.uid() = user_id);

create policy "Users can select own daily_explanations"
  on public.daily_explanations for select
  using (auth.uid() = user_id);

create policy "Users can update own daily_explanations"
  on public.daily_explanations for update
  using (auth.uid() = user_id);
