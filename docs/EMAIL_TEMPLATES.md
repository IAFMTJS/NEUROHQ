# Customizing NEUROHQ auth emails (Supabase)

Supabase sends auth emails (signup, magic link, password reset, etc.). By default they’re generic. This project includes **NEUROHQ-branded** HTML templates for all of them.

---

## Option 1: Supabase Dashboard (hosted project)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Email Templates**.
3. For each template below, select it, set **Subject** and paste the **Body** from the corresponding file in `supabase/templates/`.
4. Click **Save** after each.

### Auth links point to localhost?

If the “Confirm your email” or “Reset password” link in the email goes to `http://localhost:3000` instead of your live site, fix it in Supabase:

1. **Authentication** → **URL Configuration**.
2. Set **Site URL** to your real app URL (e.g. `https://neurohq.app` or `https://your-app.vercel.app`). This is the base URL Supabase uses when building links in auth emails.
3. Under **Redirect URLs**, add your production URL so redirects are allowed, e.g.:
   - `https://neurohq.app/**`
   - `https://your-app.vercel.app/**`  
   Keep `http://localhost:3000/**` if you test auth locally.

Save. New signup and reset emails will use the correct link. The app also sends `emailRedirectTo` / `redirectTo` from the current page when you sign up or request a reset, so if users are on the live site, the link should match; Site URL is the fallback and must be correct for invites and other server-generated links.

### Template list

| Dashboard template      | Subject to set                          | Body: paste from |
|------------------------|-----------------------------------------|-------------------|
| **Confirm signup**     | `Confirm your NEUROHQ account`          | `supabase/templates/confirmation.html` |
| **Invite user**        | `You're invited to NEUROHQ`             | `supabase/templates/invite.html` |
| **Magic link**         | `Your NEUROHQ sign-in link`             | `supabase/templates/magic_link.html` |
| **Change email address** | `Confirm your new email — NEUROHQ`    | `supabase/templates/email_change.html` |
| **Reset password**     | `Reset your NEUROHQ password`          | `supabase/templates/recovery.html` |
| **Reauthentication**   | `Confirm it's you — NEUROHQ`            | `supabase/templates/reauthentication.html` |

Paste the **full** file contents (including `<!DOCTYPE html>` and all `{{ .… }}` variables). Do not remove the link or token variables — they are required for the flow to work.

---

## Option 2: Local / self‑hosted (config.toml)

If you run Supabase locally or self‑hosted:

1. Ensure all files in `supabase/templates/` are available at that path in your Supabase project.
2. In `config.toml`, under `[auth]` / `[auth.email]`, add or merge:

```toml
[auth.email.template.confirmation]
subject = "Confirm your NEUROHQ account"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.invite]
subject = "You're invited to NEUROHQ"
content_path = "./supabase/templates/invite.html"

[auth.email.template.magic_link]
subject = "Your NEUROHQ sign-in link"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.email_change]
subject = "Confirm your new email — NEUROHQ"
content_path = "./supabase/templates/email_change.html"

[auth.email.template.recovery]
subject = "Reset your NEUROHQ password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.reauthentication]
subject = "Confirm it's you — NEUROHQ"
content_path = "./supabase/templates/reauthentication.html"
```

3. Restart Supabase (e.g. `supabase stop` then `supabase start`).

*(Template key names may vary by Supabase version; check the [Supabase email templates docs](https://supabase.com/docs/guides/auth/auth-email-templates) if a key is unknown.)*

---

## Template variables (Supabase)

| Variable | Description | Used in |
|----------|-------------|--------|
| `{{ .ConfirmationURL }}` | Link to complete the action (signup, magic link, reset, invite, change email). | All except reauthentication |
| `{{ .Email }}` | User’s email address. | Most templates |
| `{{ .NewEmail }}` | New email (after change). | Change email address only |
| `{{ .Token }}` | 6‑digit one-time code. | Reauthentication only |
| `{{ .SiteURL }}` | Your app’s site URL from auth settings. | Optional in any |

Do **not** remove `{{ .ConfirmationURL }}` or `{{ .Token }}` where they are used; the flow depends on them.

---

## Setting up custom SMTP

Without custom SMTP, Supabase sends auth emails from its own mailer: limited rate, “From” name can’t be changed, and (unless you add team addresses) only pre-authorized emails receive messages. For production and a proper **NEUROHQ** sender, use your own SMTP.

### No domain yet?

- **Use Supabase’s built-in mailer for now.** You can still use the NEUROHQ **email templates** (Dashboard → Authentication → Email Templates): the *content* of the email (subject + body) will be NEUROHQ-branded. The “From” will stay Supabase’s default.  
  **Catch:** without custom SMTP, Supabase only delivers to **addresses that are on your project’s team**. Add your own email (and any test users) in [Organization → Team](https://supabase.com/dashboard/org/_/team) so those addresses receive signup confirmations, magic links, etc. Other addresses will get “Email address not authorized” until you set up SMTP.

- **When you get a domain**, add custom SMTP (same docs below). No code changes—just configure SMTP in the Dashboard. A cheap domain (e.g. for your app or just for email like `no-reply@yourapp.com`) is enough; many registrars (Porkbun, Namecheap, Cloudflare, etc.) offer low-cost options.

- **SMTP providers (Resend, SendGrid, etc.) require a verified domain** for production sending—they don’t let you send from *their* domain to arbitrary users. So for real signups and password resets to any email, you’ll need a domain at some point.

### 1. Where to configure

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **SMTP Settings**  
   (direct: [Auth SMTP](https://supabase.com/dashboard/project/_/auth/smtp)).
3. Enable **Custom SMTP** and fill in the fields below.

### 2. Fields to fill

| Field | What to put | Example (NEUROHQ) |
|-------|---------------------|-------------------|
| **Sender name** | Name shown as “From” in inbox | `NEUROHQ` |
| **Sender email** | From address (use a domain you control) | `no-reply@yourdomain.com` |
| **Host** | SMTP server hostname from your provider | `smtp.resend.com` |
| **Port** | Usually `587` (TLS) or `465` (SSL) | `587` |
| **Username** | SMTP username from provider | often your API key or email |
| **Password** | SMTP password or API key | provider-specific |

Save the form. Supabase will send all auth emails (confirm signup, magic link, reset password, invite, etc.) through this SMTP server.

### 3. Choosing a provider

Use any SMTP-compatible provider. Common options:

- **[Resend](https://resend.com)** — [Send with Supabase (SMTP)](https://resend.com/docs/send-with-supabase-smtp): free tier, simple setup, good for apps.
- **[SendGrid](https://sendgrid.com)** — [SendGrid SMTP](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp).
- **[Postmark](https://postmarkapp.com)** — [Postmark SMTP](https://postmarkapp.com/developer/user-guide/send-email-with-smtp).
- **[AWS SES](https://aws.amazon.com/ses/)** — [SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html).

Create an account, add/verify your sending domain, then get the **SMTP host, port, username, and password** (or API key) from the provider’s dashboard.

### 4. Example: Resend

1. Sign up at [resend.com](https://resend.com) and add your domain (e.g. `yourdomain.com`).
2. In Resend: **Domains** → your domain → **SMTP** (or **API Keys** → create key for SMTP).
3. In Supabase **Authentication** → **SMTP Settings**:

   - **Sender name:** `NEUROHQ`  
   - **Sender email:** `no-reply@yourdomain.com` (must be from the domain you verified in Resend)  
   - **Host:** `smtp.resend.com`  
   - **Port:** `587`  
   - **Username:** `resend`  
   - **Password:** your Resend API key  

4. Save. Send a test (e.g. sign up or “forgot password”) and check inbox/spam.

### 5. After enabling SMTP

- **Rate limits:** Supabase may apply a default auth email rate limit (e.g. 30/hour). To change it: **Authentication** → **Rate Limits** → adjust email limits.
- **Deliverability:** Configure **SPF**, **DKIM**, and optionally **DMARC** for your sending domain in your DNS (provider docs explain how). That helps inbox placement and avoids “via …” or spam.
- **Custom domain for Auth:** For links inside emails to use your own domain, see [Supabase custom domains](https://supabase.com/docs/guides/platform/custom-domains).

Full reference: [Supabase — Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

---

## App reminder emails (digests, reminders)

Auth emails (signup, reset, etc.) are handled by Supabase. **App reminders** (daily quote, weekly learning reminder, streak nudge, etc.) are sent from your own backend via an email API (e.g. Resend).

### How it works

- **User email** is read from Supabase Auth (admin API) by user id.
- **Sending** uses [Resend](https://resend.com) when `RESEND_API_KEY` and `EMAIL_FROM` are set (see [Setting up custom SMTP](#setting-up-custom-smtp) for domain/from address).
- **Opt-in:** Users must enable “Email reminders” in settings. The preference is in `user_preferences.email_reminders_enabled` (migration `073`). Default is **on**; users can turn reminders off in Settings.

### Env vars

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key (from [resend.com/api-keys](https://resend.com/api-keys)). |
| `EMAIL_FROM` | From address, e.g. `no-reply@yourdomain.com` or `NEUROHQ <no-reply@yourdomain.com>`. Must use a [verified domain](https://resend.com/domains). |
| `NEXT_PUBLIC_APP_URL` | Optional; used in email “Open NEUROHQ” link (defaults to `https://neurohq.app`). |

### Code

- **`lib/email.ts`** — `getEmailForUser(supabase, userId)`, `sendAppEmail({ to, subject, html })`, `sendReminderToUser(supabase, userId, { subject, html })`, `wrapReminderHtml(body, title)` for NEUROHQ-styled HTML.
- **Crons** — The **hourly** cron sends:
  - **Morning email (~9 AM user local time):** daily quote, reminder to set brain status if not done, list of today’s missions and calendar events. Only to users with `email_reminders_enabled`.
  - **Evening email (~8 PM user local time):** check-in summary — tasks completed vs planned, expenses logged today, brain status. Only to users with `email_reminders_enabled`.
  - The **weekly** cron sends a learning-reminder email when learning &lt; target. All require Resend configured and the user opted in.

### Settings UI

Add a toggle in **Settings** that calls `updateUserPreferences({ email_reminders_enabled: true/false })`. The preference is in `UserPreferences` and `getUserPreferences()`; default is **on**. If you already ran migration 073 with the old default (false), run once: `ALTER TABLE public.user_preferences ALTER COLUMN email_reminders_enabled SET DEFAULT true; UPDATE public.user_preferences SET email_reminders_enabled = true;`

### Without a domain

Until you have a domain and Resend (or another provider) set up, leave `RESEND_API_KEY` and `EMAIL_FROM` unset. No app emails will be sent; push reminders continue to work as today. When you add a domain and Resend, set the env vars and run migration `073` so the `email_reminders_enabled` column exists.
