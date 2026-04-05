-- Allow admins to read/update/delete any quest progress (e.g. wipe on campaign stop).

create policy "user_quest_progress_admin_all"
  on public.user_quest_campaign_progress
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
