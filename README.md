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

   Create `public.users` on signup: use Supabase Auth → Webhooks (Database or Edge Function) to insert into `public.users` when a user signs up, or rely on the app’s `ensureUserProfile` on first dashboard load.

3. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up, then use Dashboard (daily state, quote, energy budget, tasks).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (local) |
| `npm run build` | Production build |
| `npm run start` | Run production server (after build) |
| `npm run lint` | ESLint |
| `npm run test` | Run tests (Vitest) |
| `npm run seed:quotes` | Generate full quotes SQL from `365_Philosophical_Quotes_Structured.txt` |
| `npm run db:types` | Generate TypeScript types from Supabase (requires Supabase CLI + project id) |

## Environment variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key  
- `SUPABASE_SERVICE_ROLE_KEY` — For cron and server-side admin  
- Optional: `CRON_SECRET` — Protects cron routes on Vercel  

## Database (Supabase)

1. Create a Supabase project and get URL + keys.  
2. Run migrations in order in SQL Editor (or use Supabase CLI):
   - `supabase/migrations/001_tables.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/005_seed_quotes_full.sql` (generate first with `npm run seed:quotes`)
3. See `supabase/README.md` for auth trigger (create `public.users` on signup).

## Vercel deployment

1. Connect the repo to Vercel.  
2. Set environment variables in Vercel (same as `.env.local`).  
3. Add **CRON_SECRET** in Vercel and (optional) in Vercel Cron config set “Authorization: Bearer \<CRON_SECRET\>” for cron invocations.  
4. Cron routes:
   - **Daily** (`/api/cron/daily`) — 00:00 UTC: task rollover, quote push  
   - **Weekly** (`/api/cron/weekly`) — Monday 09:00 UTC: reality report  
   - **Quarterly** (`/api/cron/quarterly`) — 1st of Jan/Apr/Jul/Oct 06:00 UTC: strategy reset  

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

## License

Private / unlicensed unless otherwise stated.
