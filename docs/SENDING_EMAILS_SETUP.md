# Every step to make the site send emails to users

This checklist covers both **auth emails** (signup, reset password, etc.) and **app emails** (morning/evening digest, weekly reminders). Do them in order.

---

## No domain yet?

You can still do this **without a domain**:

| What | No domain | With domain |
|------|-----------|-------------|
| **See how emails look** | Open `/api/test/daily-emails?preview=1` while logged in. No Resend, no config. | Same. |
| **Send app emails (dev only)** | **Resend:** API key only. **Brevo:** API key + **verified sender** in Brevo (e.g. your email); set `BREVO_API_KEY` + `EMAIL_FROM`. | Set `EMAIL_FROM` and either `RESEND_API_KEY` or `BREVO_API_KEY`. |
| **Auth emails (signup, reset)** | Use Supabase’s built-in mailer. Only **team members** receive auth emails until you add custom SMTP. Add test users in [Organization → Team](https://supabase.com/dashboard/org/_/team). | Add custom SMTP in Supabase (step 5) with your domain so **any** user gets auth emails. |

**When you get a domain:** buy one (e.g. Porkbun, Namecheap), then verify it in Resend, set `EMAIL_FROM`, and configure Supabase SMTP (steps 1, 2, 5). No code changes.

---

## 1. Get a domain (for production / any-user sending)

For **production** and so **any user** (not just team members) gets auth emails, you need a domain you control (e.g. `neurohq.com`).

- Verify it with Resend and send as `no-reply@yourdomain.com`.
- **If you don’t have one yet:** skip this step and use the “no domain” options above. Come back when you buy a domain (registrars: Porkbun, Namecheap, Cloudflare, etc.).

---

## 2. Sign up with an email provider (Resend or Brevo)

Use **one** of these for app emails (and optionally for Supabase auth SMTP).

### Option A: Brevo

- Go to [brevo.com](https://www.brevo.com) and create an account.
- **SMTP & API** → **API Keys** → **Generate a new API key** → copy the key (starts with `xkeysib-`).
- **Senders** (or **Settings** → **Senders**): add and **verify** a sender (name + email). You can use your own email for testing; for production use an address on your domain (e.g. `no-reply@yourdomain.com`) and verify the domain in Brevo.
- In the app you’ll set `BREVO_API_KEY` and `EMAIL_FROM=NEUROHQ <your-verified-sender@...>`.

**Supabase auth (step 5):** Use Brevo’s SMTP: host `smtp-relay.brevo.com`, port `587`, username = your Brevo login email, password = [SMTP key from Brevo](https://help.brevo.com/hc/en-us/articles/360000944599).

### Option B: Resend

- Go to [resend.com](https://resend.com) and create an account.
- **API Keys** → **Create API Key** → copy the key (starts with `re_`).

**If you have a domain:** **Domains** → **Add Domain** → add DNS records → wait until **Verified**. Then use `no-reply@yourdomain.com` as sender.

**If you don’t have a domain:** in **development** you can use only `RESEND_API_KEY`; the app sends from Resend’s test address (`onboarding@resend.dev`).

---

## 3. App env vars (morning/evening and weekly emails)

**Brevo:**

```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxx
EMAIL_FROM=NEUROHQ <no-reply@yourdomain.com>
```

The sender in `EMAIL_FROM` must be a [verified sender in Brevo](https://help.brevo.com/hc/en-us/articles/208836149).

**Resend (with domain or production):**

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
EMAIL_FROM=NEUROHQ <no-reply@yourdomain.com>
```

**Resend (dev only, no domain):**

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

Don’t set `EMAIL_FROM`; the app uses Resend’s test sender in development.

Use **either** Brevo or Resend (if both keys are set, Brevo is used). Set these in **`.env.local`** (dev) and in your **deployment** (Vercel, etc.).

Optional:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

(Used in the “Open NEUROHQ” link in emails.)

Restart the dev server or redeploy after changing env vars.

---

## 4. Database: email reminders column

Run the migration that adds the “email reminders” preference (default on):

- **Hosted Supabase:** run the SQL from `supabase/migrations/073_user_preferences_email_reminders.sql` in the Dashboard → SQL Editor, or apply migrations with the Supabase CLI.
- That adds `user_preferences.email_reminders_enabled` (default `true`). Users can turn reminders off in Settings.

---

## 5. Supabase: custom SMTP (auth emails) — only when you have a domain

Without custom SMTP, Supabase sends auth emails from its own mailer **only to addresses on your project’s team**. To send to **any user** (and use your own “From” address), you need custom SMTP — and for that, **you need a verified domain** in Resend (or another provider).

**If you don’t have a domain yet:** skip this step. Add your own email (and test users) in [Supabase → Organization → Team](https://supabase.com/dashboard/org/_/team) so they receive signup/reset emails. When you have a domain, come back here.

**If you have a domain (or verified sender in Brevo):**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **SMTP Settings**.
3. Enable **Custom SMTP** and fill in:

**Brevo:** Sender name `NEUROHQ`, Sender email = your verified sender; Host `smtp-relay.brevo.com`, Port `587`; Username = your Brevo account email; Password = your [Brevo SMTP key](https://help.brevo.com/hc/en-us/articles/360000944599) (not the API key).

**Resend:** Sender name `NEUROHQ`, Sender email `no-reply@yourdomain.com`; Host `smtp.resend.com`, Port `587`; Username `resend`; Password = your Resend API key.

Save. Auth emails will then go through your provider to any user.

---

## 6. Supabase: auth email templates (optional but recommended)

So auth emails look like NEUROHQ, not generic Supabase:

1. Supabase Dashboard → **Authentication** → **Email Templates**.
2. For each template (Confirm signup, Invite user, Magic link, Change email, Reset password, Reauthentication), set the **Subject** and **Body** from the files in `supabase/templates/` (see [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md#template-list)).

Paste the **full** HTML from each file; keep all `{{ .ConfirmationURL }}` / `{{ .Token }}` etc.

---

## 7. Cron: hourly and weekly

App emails are sent by **cron jobs**:

- **Hourly cron** (e.g. every hour at :00): sends morning email ~9 AM and evening email ~8 PM in each user’s timezone (for users with `email_reminders_enabled`).
- **Weekly cron**: sends learning reminder email to users who had &lt; 60 min learning last week.

**On Vercel:**

- In the project: **Settings** → **Cron Jobs** (or use `vercel.json`).
- Add a cron for the hourly route, e.g. `0 * * * *` → `https://yourdomain.com/api/cron/hourly` with `Authorization: Bearer YOUR_CRON_SECRET`.
- Add a cron for the weekly route (e.g. Monday 9:00 UTC) → `https://yourdomain.com/api/cron/weekly` with the same secret.

Set **CRON_SECRET** in the project env to a random string and use it in the `Authorization` header so only Vercel can call these URLs.

---

## 8. Settings: email reminders toggle

Users can turn reminder emails on/off in the app:

- The toggle is in **Settings** → **Time & notifications** → **Email reminders** (component `SettingsEmailReminders`).
- It updates `user_preferences.email_reminders_enabled`. Default is **on**; users can switch off.

No extra step needed if that section is already on the settings page.

---

## 9. Quick verification

- **Auth:** Sign up with a new email (or use “Forgot password”) and check that the email arrives from `NEUROHQ` / your domain and looks like the template.
- **App:** Log in, open `https://yourdomain.com/api/test/daily-emails` (or localhost in dev). You should get morning + evening test emails. Use `?preview=1` to see the HTML without sending.
- **Cron:** After the next hourly run, check that users with reminders on and timezone set get the morning/evening email at the right local time.

---

## Summary checklist

| Step | No domain | With domain |
|------|------------|-------------|
| 1 | Skip (or plan to buy one) | Get domain, verify in Brevo/Resend |
| 2 | **Brevo:** account + API key + verified sender. **Resend:** account + API key only | Brevo/Resend + verify domain |
| 3 | **Brevo:** `BREVO_API_KEY` + `EMAIL_FROM`. **Resend:** `RESEND_API_KEY` only | `EMAIL_FROM` + provider API key |
| 4 | Migration 073 | Same |
| 5 | Skip (auth only to team members) | Custom SMTP in Supabase |
| 6 | Auth templates (optional) | Same |
| 7 | Cron for app emails | Same |
| 8 | Toggle in Settings | Same |
| 9 | `?preview=1` and /api/test/daily-emails | Test signup + daily emails |

For more detail on templates and SMTP, see [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md).
