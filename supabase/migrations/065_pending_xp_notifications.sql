-- Pending XP notification: show once on next login after automatic XP (e.g. end-of-day bonus).
CREATE TABLE IF NOT EXISTS public.pending_xp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  sources jsonb NOT NULL DEFAULT '[]',
  for_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_xp_notifications_user_id ON public.pending_xp_notifications(user_id);

ALTER TABLE public.pending_xp_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pending_xp_notifications"
  ON public.pending_xp_notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.pending_xp_notifications IS 'One-time XP summary to show on next login (e.g. after automatic end-of-day XP). Deleted after shown.';
