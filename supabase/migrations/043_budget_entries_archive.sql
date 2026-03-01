-- Archive for budget entries older than 1 month. Data stays for slim budgetbeheer and analytics.
-- Entries are copied here; originals remain in budget_entries (no delete).

CREATE TABLE IF NOT EXISTS public.budget_entries_archive (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  date date NOT NULL,
  category text,
  note text,
  is_planned boolean NOT NULL DEFAULT false,
  freeze_until timestamptz,
  freeze_reminder_sent boolean NOT NULL DEFAULT false,
  recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_entries_archive_user_date ON public.budget_entries_archive(user_id, date);

ALTER TABLE public.budget_entries_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_budget_entries_archive" ON public.budget_entries_archive
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.budget_entries_archive IS 'Historical budget entries (older than display window) for analytics and smart budget distribution.';
