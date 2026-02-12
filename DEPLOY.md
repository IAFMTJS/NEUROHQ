# NEUROHQ — Ship & Validate Guide

Step-by-step Supabase + Vercel setup and smoke test checklist. Use this for first deploy or a new environment.

---

## 1. Supabase setup

### 1.1 Create project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Choose org, name (e.g. `neurohq`), region, and database password. Save the password.
3. Wait for the project to be ready.

### 1.2 Get credentials

In Project Settings → API:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; server/cron only)

### 1.3 Enable Email auth

Authentication → Providers → Email: enable **Email** and optionally **Confirm email** (you can disable confirm for faster testing).

### 1.4 Run migrations (in order)

In SQL Editor, run each file from `supabase/migrations/` in order:

| Order | File | Purpose |
|-------|------|--------|
| 1 | `001_tables.sql` | Core tables |
| 2 | `002_rls.sql` | Row Level Security |
| 3 | `003_triggers.sql` | e.g. users / timestamps |
| 4 | `005_seed_quotes_full.sql` | 365 quotes (generate with `npm run seed:quotes` if needed) |
| 5 | `006_push_and_reports.sql` | Push tracking, reality_reports |
| 6 | `007_user_rollover_and_google_tokens.sql` | last_rollover_date, user_google_tokens |
| 7 | `008_tasks_recurring_subtasks_snooze.sql` | recurrence_rule, parent_task_id, snooze_until |

After each run, confirm “Success” and that no errors appear.

### 1.5 User profile on signup

Either:

- **Option A:** Rely on the app: the dashboard calls `ensureUserProfile` on first load and creates a row in `public.users` for the signed-in user. No Supabase trigger needed.
- **Option B:** In Supabase, Database → Webhooks (or Edge Function): on `auth.users` insert, run SQL to insert into `public.users` (id, email). See `supabase/README.md` if present.

---

## 2. Local environment

### 2.1 Env file

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional for later:

- `CRON_SECRET` — random string (e.g. `openssl rand -hex 24`) for securing cron routes.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — from `npm run generate-vapid` for push.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL` for Google Calendar.

### 2.2 Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the app (redirect to login if not authenticated).

---

## 3. Vercel deployment

### 3.1 Connect repo

1. [vercel.com](https://vercel.com) → Add New → Project.
2. Import your Git repo (e.g. GitHub). Framework: **Next.js** (auto-detected).
3. Build command: `npm run build`. Output: default. Install: `npm install`.

### 3.2 Environment variables

In Vercel → Project → Settings → Environment Variables, add the same as `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (recommended so crons are protected)

For push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.  
For Google Calendar: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL` (your Vercel URL, e.g. `https://neurohq.vercel.app`).

### 3.3 Deploy

Push to the connected branch or click Deploy. Wait for build to succeed.

### 3.4 Cron jobs (Vercel)

Crons are defined in `vercel.json`. Ensure they are enabled in Vercel (Pro plan may be required for crons). To authorize cron invocations, set **CRON_SECRET** and in Vercel Cron configuration (if available) set header: `Authorization: Bearer <CRON_SECRET>`.

---

## 4. Smoke test checklist

Run through this after deploy (or locally) to validate core flows.

### 4.1 Auth

- [ ] Open app URL (or localhost:3000). Redirects to login if not logged in.
- [ ] Sign up with email + password. No error; redirect to dashboard or login.
- [ ] Log in with same email. Redirect to dashboard.
- [ ] Dashboard shows: date, daily state form, quote card, energy bar, today’s events, task list.

### 4.2 Daily state & mode

- [ ] Set energy, focus, sensory (e.g. 3, 3, 8). Submit. Values persist after refresh.
- [ ] With sensory ≥ 7: mode banner “High sensory” and minimal UI (no quote/energy/calendar blocks).
- [ ] Set energy/focus to 7+ and sensory &lt; 7: “Driven” banner and Focus block (timer) visible.

### 4.3 Tasks

- [ ] Add a task. It appears in the list.
- [ ] Complete a task. It shows as done (strikethrough / check).
- [ ] Add 5 incomplete tasks, set energy low: with 5 carry-over, “Stabilize” mode: only 2 tasks visible, “Add task” disabled.

### 4.4 Budget

- [ ] Open Budget. Add savings goal (name, target, deadline). Card shows weekly required.
- [ ] Add budget entry (expense). It appears in the list. Use “Freeze 24h” on an expense; it appears in Frozen section.

### 4.5 Learning & report

- [ ] Open Learning. Log a session (minutes). Progress and streak update.
- [ ] Open Report. Current week summary and (if weekly cron has run) past weeks selector.

### 4.6 Settings & PWA

- [ ] Open Settings. Account email shown; Push, Export, Delete account sections present.
- [ ] (Optional) Enable push; accept browser permission; “Notifications enabled” message.
- [ ] (Optional) Install PWA: browser “Install” or “Add to Home Screen”. App opens in standalone window.

### 4.7 Cron (manual trigger)

If you have **CRON_SECRET** and a way to call APIs (e.g. curl or Vercel Cron logs):

- [ ] `GET /api/cron/daily` with `Authorization: Bearer <CRON_SECRET>` returns 200 and JSON (`ok: true`, `job: "daily"`). In Supabase, next day’s date: incomplete tasks from yesterday have moved to today and `carry_over_count` increased.
- [ ] `GET /api/cron/hourly` with auth: 200. For users with `timezone` set, when it’s 00:00 in that TZ, rollover and quote run (check `users.last_rollover_date` and push logs).
- [ ] `GET /api/cron/weekly` with auth: 200. `reality_reports` has new rows for last week; learning/savings push sent if conditions met.
- [ ] `GET /api/cron/evening` with auth: 200. Shutdown reminder push sent (if push enabled).

---

## 5. Troubleshooting

- **Redirect loop:** Check middleware: protected paths redirect to `/login`; after login redirect to `/dashboard` or `/`.
- **RLS errors:** Ensure migrations 002 (RLS) and 003 ran; policies use `auth.uid() = user_id`.
- **No quote on dashboard:** Ensure migration 005 (quotes seed) ran and `quotes` has rows for id 1–365.
- **Cron 401:** Set `CRON_SECRET` in Vercel and send `Authorization: Bearer <CRON_SECRET>` in the request.
- **Push not received:** Check VAPID keys; subscription saved in `users.push_subscription_json`; browser allows notifications; `sw.js` registered (e.g. from Settings push flow).

---

## 6. Lighthouse PWA check (manual)

See [LIGHTHOUSE_PWA.md](./LIGHTHOUSE_PWA.md) for how to run Lighthouse and the PWA checklist. Aim for PWA score ≥ 90 and “Add to Home Screen” working.
