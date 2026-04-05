-- =============================================================================
-- NEUROHQ — List admin users (public.users.role = 'admin')
--
-- Admin login checks this column only; auth metadata is ignored.
-- Run in Supabase Dashboard → SQL Editor as postgres (or any role that bypasses
-- RLS on public.users / can read auth.users).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Summary (profiles only — admin flag lives here)
-- -----------------------------------------------------------------------------
SELECT
  count(*) FILTER (WHERE role = 'admin') AS admin_count,
  count(*) FILTER (WHERE role = 'user' OR role IS NULL) AS non_admin_profile_count,
  count(*) AS total_public_users_rows
FROM public.users;

-- -----------------------------------------------------------------------------
-- Auth vs public.users — explains “3 accounts in Auth but only 2 profile rows”
-- -----------------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users_count,
  (SELECT count(*) FROM public.users) AS public_users_count,
  (SELECT count(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)) AS auth_without_profile_count;

-- Auth accounts that have NO row in public.users (backfill these before role = admin works)
SELECT
  au.id,
  au.email,
  au.created_at AS auth_created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ORDER BY au.created_at ASC;

-- All profiles with role (see who is still “user”)
SELECT
  u.id,
  u.email,
  u.role,
  u.created_at
FROM public.users u
ORDER BY u.created_at ASC;

-- -----------------------------------------------------------------------------
-- Every admin profile (what the app uses)
-- -----------------------------------------------------------------------------
SELECT
  u.id,
  u.email,
  u.role,
  u.created_at
FROM public.users u
WHERE u.role = 'admin'
ORDER BY u.created_at ASC;

-- -----------------------------------------------------------------------------
-- Optional: admins that still exist in Auth (spot stale profile-only rows)
-- -----------------------------------------------------------------------------
SELECT
  u.id,
  u.email AS profile_email,
  au.email AS auth_email,
  u.role,
  u.created_at
FROM public.users u
INNER JOIN auth.users au ON au.id = u.id
WHERE u.role = 'admin'
ORDER BY u.created_at ASC;

-- -----------------------------------------------------------------------------
-- Fix pattern (uncomment, set UUID): missing profile + admin
-- -----------------------------------------------------------------------------
-- INSERT INTO public.users (id, email)
-- SELECT id, email FROM auth.users WHERE id = 'YOUR_AUTH_USER_UUID'::uuid;
-- UPDATE public.users SET role = 'admin' WHERE id = 'YOUR_AUTH_USER_UUID'::uuid;
