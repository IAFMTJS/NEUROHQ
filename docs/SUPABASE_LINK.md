# Linking Supabase to your project (CLI and GitHub)

## 1. Link the Supabase CLI to your cloud project

This lets `supabase db push`, `supabase db pull`, and `npm run db:types` work against your hosted project.

### Step 1: Log in to Supabase (one-time)

```powershell
npx supabase login
```

- A browser window opens; log in with your Supabase account.
- Or create a [personal access token](https://supabase.com/dashboard/account/tokens) and run:
  `npx supabase login --token sbp_xxxxxxxx`

### Step 2: Get your project reference ID

- Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
- Look at the URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`.
- Copy the **short ref** (about 20 characters, e.g. `abcdefghijklmnopqrst`).  
  **Do not** use the long `prj_xxx` ID — the CLI needs the short ref.

### Step 3: Link from the project root

From the repo root (where `supabase/config.toml` lives):

```powershell
cd d:\NEUROHQ
npx supabase link --project-ref <PROJECT_REF>
```

When prompted, enter your **database password** (the one you set when creating the project). You can leave it blank to skip DB validation; `gen types` and API will still work, but `db push` / `db pull` need the password (or set `SUPABASE_DB_PASSWORD`).

You should see: **Finished supabase link.**

### Step 4: Verify

- **Generate types:**  
  `npm run db:types`  
  (Uses `SUPABASE_PROJECT_REF` or the ref from `.env`’s `NEXT_PUBLIC_SUPABASE_URL` if set.)
- **Push migrations:**  
  `npx supabase db push`
- **List migrations:**  
  `npx supabase migration list --linked`

---

## 2. Link your GitHub repo (optional — for branching / CI)

This is done in the **Supabase Dashboard**, not in Cursor or the CLI.

1. In the [Supabase Dashboard](https://supabase.com/dashboard), open your project.
2. Go to **Project Settings** → **Integrations** → **GitHub**.
3. Click **Enable integration** and authorize Supabase for your GitHub account.
4. Choose the **NEUROHQ** repository and the branch (e.g. `main`).
5. Set the **Supabase directory** to `supabase` (relative to repo root).
6. Save. You can then use **Branching** so each Git branch gets its own Supabase preview branch.

Your repo is already set up with a `supabase/` folder and migrations; the dashboard will use that.

---

## 3. “Linking” to Cursor

Cursor is your editor; there is no separate “Supabase ↔ Cursor” link. The app talks to Supabase via environment variables:

- **Local (Cursor terminal):**  
  Use a `.env` or `.env.local` in the project root with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (Optional) `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF` for scripts.

When you run `npm run dev` (or any script) from the project root in Cursor, Next.js loads `.env.local` automatically. No extra linking step is required.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `supabase link` says no config | Run `npx supabase init` once (already done if you have `supabase/config.toml`). |
| “Invalid project ref” or prj_xxx error | Use the **short** ref from the dashboard URL, not the long `prj_...` ID. |
| `npm run db:types` fails | Set `SUPABASE_PROJECT_REF` to the short ref, or ensure `NEXT_PUBLIC_SUPABASE_URL` in `.env` contains your project (e.g. `https://<ref>.supabase.co`). |
| GitHub integration not seeing migrations | In the integration settings, set “Supabase directory” to `supabase`. |
| DB password prompt every time | Set env var `SUPABASE_DB_PASSWORD` (e.g. in `.env`) so the CLI can use it in CI or when running `db push` / `db pull`. |
