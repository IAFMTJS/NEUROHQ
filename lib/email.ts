/**
 * App reminder emails (distinct from Supabase auth emails).
 * Supports Resend (RESEND_API_KEY) or Brevo (BREVO_API_KEY). User email from Supabase Auth admin API.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const FROM_DEFAULT = "NEUROHQ <no-reply@neurohq.app>";
/** Resend's test sender; only for development when you don't have a domain yet. */
const FROM_DEV_TEST = "NEUROHQ <onboarding@resend.dev>";

/** Get a user's email from Auth (admin only). Returns null if not found or no email. */
export async function getEmailForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  const email = (data.user as { email?: string | null }).email;
  return email && typeof email === "string" ? email : null;
}

/** Which provider is configured (Brevo takes precedence if both keys set). */
function getEmailProvider(): "brevo" | "resend" | null {
  if (process.env.BREVO_API_KEY) return "brevo";
  if (process.env.RESEND_API_KEY) return "resend";
  return null;
}

/** Check if app email sending is configured. Brevo needs EMAIL_FROM; Resend in dev can work without it. */
export function isAppEmailConfigured(): boolean {
  const provider = getEmailProvider();
  if (!provider) return false;
  if (provider === "brevo") return !!process.env.EMAIL_FROM;
  if (process.env.EMAIL_FROM) return true;
  if (process.env.NODE_ENV === "development") return true;
  return !!FROM_DEFAULT;
}

/** From address when sending. In dev with Resend only, uses Resend test sender. */
function getFromAddress(): string {
  if (process.env.EMAIL_FROM) {
    const from = process.env.EMAIL_FROM;
    return from.includes("<") ? from : `NEUROHQ <${from}>`;
  }
  if (process.env.NODE_ENV === "development") return FROM_DEV_TEST;
  return FROM_DEFAULT;
}

/** Parse "Name <email>" or "email" into { name, email }. */
function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "NEUROHQ", email: from.trim() };
}

export type AppEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send one app email via Brevo or Resend (whichever is configured). Returns true if sent.
 */
export async function sendAppEmail(options: AppEmailOptions): Promise<boolean> {
  const provider = getEmailProvider();
  if (!provider) return false;

  if (provider === "brevo") {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || !process.env.EMAIL_FROM) return false;
    const from = parseFrom(process.env.EMAIL_FROM);
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: { name: from.name, email: from.email },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
          ...(options.text && { textContent: options.text }),
        }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { messageId?: string };
      return !!data?.messageId;
    } catch {
      return false;
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = getFromAddress();
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (error) return false;
    return !!data?.id;
  } catch {
    return false;
  }
}

/** NEUROHQ-styled HTML wrapper for reminder/digest body (dark theme, cyan accent). */
export function wrapReminderHtml(bodyHtml: string, title?: string): string {
  const heading = title ?? "NEUROHQ";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#0b1522; font-family: system-ui, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1522;">
    <tr><td align="center" style="padding:32px 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:420px;">
        <tr><td style="font-size:24px; font-weight:700; color:#00c3ff; padding-bottom:16px;">NEUROHQ</td></tr>
        <tr><td style="font-size:11px; color:rgba(255,255,255,0.5); letter-spacing:0.1em; padding-bottom:24px;">YOUR DAILY HQ</td></tr>
        <tr><td style="background:#0e1928; border:1px solid rgba(0,195,255,0.2); border-radius:16px; padding:24px;">
          <h1 style="margin:0 0 16px 0; font-size:18px; color:#e6fdff;">${escapeHtml(heading)}</h1>
          <div style="font-size:14px; line-height:1.55; color:rgba(230,253,255,0.85);">${bodyHtml}</div>
          <p style="margin:20px 0 0 0; font-size:12px;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://neurohq.app"}" style="color:#00c3ff;">Open NEUROHQ</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendReminderToUserOptions = {
  subject: string;
  html: string;
  text?: string;
};

/**
 * Resolve user email and send a reminder. Does not check email_reminders_enabled;
 * caller (e.g. cron) should filter users by that preference first.
 * Returns true if email was sent, false otherwise.
 */
export async function sendReminderToUser(
  supabase: SupabaseClient,
  userId: string,
  options: SendReminderToUserOptions
): Promise<boolean> {
  const email = await getEmailForUser(supabase, userId);
  if (!email) return false;
  return sendAppEmail({
    to: email,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
