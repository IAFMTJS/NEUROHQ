import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalDateHour } from "@/lib/utils/timezone";
import { isAppEmailConfigured, sendReminderToUser } from "@/lib/email";
import {
  getMorningEmailData,
  buildMorningEmailHtml,
  getEveningEmailData,
  buildEveningEmailHtml,
} from "@/lib/daily-email-content";

/**
 * One-time test: send or preview daily emails for the logged-in user.
 * - ?preview=1 — show morning + evening HTML in the browser (no email sent, no Resend needed).
 * - ?check=1 — JSON with loggedIn + emailConfigured.
 * - No query — send both emails (needs RESEND_API_KEY; in dev, EMAIL_FROM is optional).
 */
export async function GET(request: Request) {
  return runTest(request);
}

export async function POST(request: Request) {
  return runTest(request);
}

async function runTest(request: Request) {
  const url = new URL(request.url);
  const checkOnly = url.searchParams.get("check") === "1";
  const preview = url.searchParams.get("preview") === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "Not logged in",
        hint: "Open /api/test/daily-emails in the same browser tab where you are logged in to NEUROHQ (e.g. after opening the app at localhost:3000).",
      },
      { status: 401 }
    );
  }

  const isDev = process.env.NODE_ENV === "development";
  const testSecret = process.env.TEST_EMAIL_SECRET;
  const authHeader = request.headers.get("authorization");
  const allowed = isDev || (testSecret && authHeader === `Bearer ${testSecret}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Use this only in development or with TEST_EMAIL_SECRET" },
      { status: 403 }
    );
  }

  const emailConfigured = isAppEmailConfigured();
  if (checkOnly) {
    return NextResponse.json({
      loggedIn: true,
      emailConfigured,
      hint: emailConfigured
        ? "Remove ?check=1 to send both test emails. Use ?preview=1 to view emails in browser without sending."
        : "Add RESEND_API_KEY to .env.local to send (optional: EMAIL_FROM for your domain). Use ?preview=1 to view emails without any config.",
    });
  }

  const admin = createAdminClient();
  const userId = user.id;
  const { data: userRow } = await admin.from("users").select("timezone").eq("id", userId).single();
  const tz = (userRow?.timezone as string) ?? "Europe/Amsterdam";
  const { date: todayStr } = getLocalDateHour(tz);

  if (preview) {
    const [morningData, eveningData] = await Promise.all([
      getMorningEmailData(admin, userId, todayStr),
      getEveningEmailData(admin, userId, todayStr),
    ]);
    const morningHtml = buildMorningEmailHtml(morningData);
    const eveningHtml = buildEveningEmailHtml(eveningData);
    const page = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Daily emails preview</title></head>
<body style="margin:0;padding:24px;background:#0b1522;color:#e6fdff;font-family:system-ui,sans-serif;">
  <h1 style="color:#00c3ff;">Daily emails preview (no email sent)</h1>
  <p style="color:rgba(255,255,255,0.6);">Today: ${todayStr}. Remove ?preview=1 from the URL to send real emails (requires RESEND_API_KEY).</p>
  <hr style="border-color:rgba(0,195,255,0.3);margin:24px 0;">
  <h2 style="color:#00c3ff;">Morning (~9h)</h2>
  <div style="max-width:480px;border:1px solid rgba(0,195,255,0.2);border-radius:12px;overflow:hidden;">${morningHtml}</div>
  <hr style="border-color:rgba(0,195,255,0.3);margin:24px 0;">
  <h2 style="color:#00c3ff;">Evening (~20h)</h2>
  <div style="max-width:480px;border:1px solid rgba(0,195,255,0.2);border-radius:12px;overflow:hidden;">${eveningHtml}</div>
</body></html>`;
    return new NextResponse(page, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!emailConfigured) {
    return NextResponse.json(
      {
        error: "Email not configured",
        hint: "Add RESEND_API_KEY to .env.local (in dev that is enough). Or use ?preview=1 to view without sending.",
      },
      { status: 503 }
    );
  }

  let morningSent = false;
  let eveningSent = false;

  try {
    const morningData = await getMorningEmailData(admin, userId, todayStr);
    const morningHtml = buildMorningEmailHtml(morningData);
    morningSent = await sendReminderToUser(admin, userId, {
      subject: "NEUROHQ — Good morning (test)",
      html: morningHtml,
    });
  } catch (e) {
    return NextResponse.json({
      error: "Morning email failed",
      morningSent: false,
      eveningSent: false,
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }

  try {
    const eveningData = await getEveningEmailData(admin, userId, todayStr);
    const eveningHtml = buildEveningEmailHtml(eveningData);
    eveningSent = await sendReminderToUser(admin, userId, {
      subject: "NEUROHQ — Evening check-in (test)",
      html: eveningHtml,
    });
  } catch (e) {
    return NextResponse.json({
      ok: true,
      morningSent,
      eveningSent: false,
      message: "Morning sent; evening failed",
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    morningSent,
    eveningSent,
    message: "Both emails sent. Check your inbox.",
    todayStr,
  });
}
