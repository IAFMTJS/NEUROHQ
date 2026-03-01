# NEUROHQ — Supabase migrations

## Order

1. **001_tables.sql** — Tables and indexes  
2. **002_rls.sql** — Row Level Security policies  
3. **003_triggers.sql** — `updated_at` triggers; optional `handle_new_user` for auth  
4. **004_seed_quotes_sample.sql** — Sample quotes (or skip if using 005)  
5. **005_seed_quotes_full.sql** — Full 365 quotes (generate with `npm run seed:quotes`)

## Apply migrations

- **Supabase Dashboard:** SQL Editor → paste and run each file in order.  
- **Supabase CLI:** `supabase db push` or `supabase migration up` (if using local project).

## Auth trigger (create `public.users` on signup)

Supabase may not allow triggers on `auth.users` from the public schema. Options:

1. **Database Webhook (Dashboard):** Auth → Webhooks → “Send to Database” or “Call Edge Function” that inserts into `public.users`.  
2. **Edge Function:** On `auth.user.created`, insert into `public.users`.  
3. **App logic:** On first login, upsert `public.users` in a server action or API route.

## Full quote seed

From project root:

```bash
npm run seed:quotes
```

This writes `005_seed_quotes_full.sql`. Run that file in Supabase after 003 (and skip 004 if you want only the full seed).
