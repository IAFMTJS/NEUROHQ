# NEUROHQ -- DATABASE & INFRASTRUCTURE SPEC

------------------------------------------------------------------------

# 1. TECH STACK

Frontend: - Next.js (App Router) - TypeScript - TailwindCSS - next-pwa

Backend: - Supabase (PostgreSQL) - Supabase Auth - Row Level Security -
Edge Functions

Deployment: - Vercel

------------------------------------------------------------------------

# 2. ENVIRONMENT VARIABLES

NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= NEXT_PUBLIC_APP_VERSION=1.0.0

------------------------------------------------------------------------

# 3. DATABASE TABLES

users\
daily_state\
tasks\
budget_entries\
savings_goals\
learning_sessions\
education_options\
calendar_events\
quotes\
feature_flags\
alternatives

All user-bound tables must: - Enable RLS - Enforce auth.uid() =
user_id - Include created_at timestamp

------------------------------------------------------------------------

# 4. RLS EXAMPLE

create policy "Users access own data" on tasks for all using (auth.uid()
= user_id);

Admin override policy required.

------------------------------------------------------------------------

# 5. CRON JOBS (VERCEL)

Daily: - Task rollover - Quote dispatch

Weekly: - Reality report

Quarterly: - Strategy reset

------------------------------------------------------------------------

# 6. PWA REQUIREMENTS

-   Service Worker
-   Manifest.json
-   IndexedDB caching
-   Installable
-   Lighthouse ≥90

------------------------------------------------------------------------

# 7. PUSH NOTIFICATIONS (TECH)

- Web Push via VAPID (browser + service worker); or Firebase Cloud Messaging (FCM) for web.
- Subscription stored per user (e.g. users.push_subscription_json or push_subscriptions table).
- Sending: Supabase Edge Function or Vercel serverless calls push API; respect "max 3 per day" and user preferences (morning/evening quote).

------------------------------------------------------------------------

# 8. ADMIN & FEATURE FLAGS

- Admin: users.role = 'admin'; RLS policies allow admin to read (and optionally manage) all user rows. See NEUROHQ_DATABASE_SCHEMA.md.
- Feature flags: table feature_flags (name, enabled, optional user_id). Flags e.g. calendar_integration, push_quotes, push_avoidance, push_learning, push_savings, push_shutdown, stabilize_mode_forced.

------------------------------------------------------------------------

# 9. SECURITY & PRIVACY

- Session: rely on Supabase Auth; optional session timeout (e.g. 7 days).
- Passwords: Supabase defaults; optional min length in Auth settings.
- Export: JSON export of user data (per backup spec).
- Delete account: delete auth user (cascade or explicit delete of user rows); document in UI.

------------------------------------------------------------------------

# 10. ERROR HANDLING & LOGGING

- Errors: log in Vercel (serverless); optional Sentry (or similar) for production.
- Cron: log success/failure and payload in Vercel logs; alert on repeated failure if needed.

------------------------------------------------------------------------

# 11. BACKUPS

-   Supabase daily backups enabled
-   JSON export option for users

------------------------------------------------------------------------

# 12. SCHEMA REFERENCE

Full column-level schema: see NEUROHQ_DATABASE_SCHEMA.md.

------------------------------------------------------------------------

END OF INFRASTRUCTURE SPEC
