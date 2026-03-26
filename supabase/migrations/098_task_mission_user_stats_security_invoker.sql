-- Views on RLS-protected event tables must use the invoker's privileges so row
-- visibility matches the querying user (avoids SECURITY DEFINER / owner bypass).
ALTER VIEW public.task_user_stats SET (security_invoker = true);
ALTER VIEW public.mission_user_stats SET (security_invoker = true);
