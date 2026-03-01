# NEUROHQ

Nervous-system-aware personal operating system — calendar-based, mood-adaptive, execution-focused. Built as a PWA with Next.js and Supabase.

## Get running (local)

1. **Install and env**
   ```bash
   npm install
   cp .env.example .env.local
   ```
   Edit `.env.local`: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your [Supabase](https://supabase.com) project.

2. **Database**
   In Supabase → SQL Editor, run the migrations in order:
   - `supabase/migrations/001_tables.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/005_seed_quotes_full.sql` (generate with `npm run seed:quotes` if needed)
   - `supabase/migrations/006_push_and_reports.sql` (push tracking + weekly reality reports)
   - `supabase/migrations/007_user_rollover_and_google_tokens.sql` (per-user rollover date + Google Calendar tokens)
   - `supabase/migrations/008_tasks_recurring_subtasks_snooze.sql` (recurrence, subtasks, snooze)

   Create `public.users` on signup: use Supabase Auth → Webhooks (Database or Edge Function) to insert into `public.users` when a user signs up, or rely on the app’s `ensureUserProfile` on first dashboard load.

3. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up, then use Dashboard (daily state, quote, energy budget, tasks).

## Local servers (what to run when)

| Command | Port | Use when |
|---------|------|----------|
| `npm run dev` | 3000 | Day-to-day dev: hot reload, fast feedback. |
| `npm run build` then `npm run serve` | 3000 | Production-like: faster page switches, no HMR. Stop dev first or port 3000 is in use. |
| `npm run serve:prod` | 3001 | Run production build alongside dev: dev on 3000, production on 3001 to compare speed. |
| `npm run test` | — | Run Vitest tests. `npm run test:watch` for watch mode. |

**Supabase local (optional)** — If you have [Docker](https://docs.docker.com/get-docker/) and [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase init    # once, creates config if missing
supabase start   # Postgres, Auth, etc. locally
```

Then point `.env.local` at the URLs Supabase prints (e.g. `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, anon key from `supabase status`). Good for: faster DB/auth (no network), offline dev, or testing without touching cloud.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (local) |
| `npm run build` | Production build |
| `npm run serve` | Production server on port 3000 (run after build) |
| `npm run serve:prod` | Production server on port 3001 (use when dev is on 3000) |
| `npm run start` | Same as dev (Next.js dev on 3000) |
| `npm run lint` | ESLint |
| `npm run test` | Run tests (Vitest) |
| `npm run seed:quotes` | Generate full quotes SQL from `365_Philosophical_Quotes_Structured.txt` |
| `npm run build:icons` | Generate PWA icons (192 & 512). Optional arg: path to source image. |
| `npm run generate-vapid` | Generate VAPID keys for Web Push (add to `.env.local`) |
| `npm run db:types` | Generate TypeScript types from Supabase (requires Supabase CLI + project id) |

## Environment variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key  
- `SUPABASE_SERVICE_ROLE_KEY` — For cron and server-side admin  
- Optional: `CRON_SECRET` — Protects cron routes on Vercel  
- Optional (push): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — from `npm run generate-vapid`  

## Database (Supabase)

1. Create a Supabase project and get URL + keys.  
2. Run migrations in order in SQL Editor (or use Supabase CLI):
   - `supabase/migrations/001_tables.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/005_seed_quotes_full.sql` (generate first with `npm run seed:quotes`)
   - `supabase/migrations/006_push_and_reports.sql`
   - `supabase/migrations/007_user_rollover_and_google_tokens.sql`
   - `supabase/migrations/008_tasks_recurring_subtasks_snooze.sql`
3. See `supabase/README.md` for auth trigger (create `public.users` on signup).

## Vercel deployment

1. Connect the repo to Vercel.  
2. Set environment variables in Vercel (same as `.env.local`).  
3. Add **CRON_SECRET** in Vercel and (optional) in Vercel Cron config set “Authorization: Bearer \<CRON_SECRET\>” for cron invocations.  
4. Cron routes (send `Authorization: Bearer <CRON_SECRET>` if set):
   - **Daily** (`/api/cron/daily`) — 00:00 UTC: rollover + quote for users without timezone; freeze reminders, avoidance alert
   - **Hourly** (`/api/cron/hourly`) — not scheduled on Vercel Hobby (limit: 1 run/day). Endpoint exists for manual/Pro use: rollover + quote for users with timezone when it’s 00:00 in their TZ
   - **Evening** (`/api/cron/evening`) — 21:00 UTC: shutdown reminder
   - **Weekly** (`/api/cron/weekly`) — Monday 09:00 UTC: reality report, learning reminder, savings alert
   - **Quarterly** (`/api/cron/quarterly`) — 1st of Jan/Apr/Jul/Oct 06:00 UTC: ensure current quarter strategy row per user
5. Deploy checklist: run migrations 001–008, enable Email/Password auth, set env vars. See **DEPLOY.md** for step-by-step Supabase/Vercel setup and a full smoke test checklist. For PWA installability and Lighthouse, see **LIGHTHOUSE_PWA.md**.

Build command: `npm run build`. Framework: Next.js.

## Docs (in repo)

| Document | Purpose |
|----------|---------|
| `NEUROHQ_MASTER_ARCHITECTURE.md` | Product definition, system layers, core logic |
| `NEUROHQ_DATABASE_INFRASTRUCTURE.md` | Tech stack, env, tables, cron, PWA, security |
| `NEUROHQ_DATABASE_SCHEMA.md` | Column-level schema |
| `NEUROHQ_ACTION_PLAN.md` | Phased implementation plan |
| `NEUROHQ_GAPS_AND_ADDITIONS.md` | Gaps checklist and what was added |
| `NEUROHQ_FINANCIAL_BEHAVIOUR_RULES.md` | Impulse detection, 24h freeze |
| `NEUROHQ_CALENDAR_PHASE2_AND_TESTING.md` | Calendar Phase 2, testing strategy |
| `NEUROHQ_VISUAL_AND_UX_DIRECTION.md` | Visual and UX direction |
| `NEUROHQ_SUGGESTIONS_AND_ENHANCEMENTS.md` | Backlog: actions, features, adjustments |
| `NEUROHQ_STARTUP_ANALYSIS_AND_REMAINING_TASKS.md` | Analysis of spec vs implementation and remaining work |

## Google Calendar (optional, Phase 8)

Manual calendar events are supported on the dashboard. Google Calendar read-only sync: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, add redirect URI `https://your-domain.com/api/auth/google/callback` in Google Cloud Console, then run migration 007. Users can connect in Settings; events sync on dashboard load.

## License

Private / unlicensed unless otherwise stated.
