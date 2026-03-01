/**
 * Google Calendar integration (Phase 8).
 * When GOOGLE_CLIENT_ID and tokens are configured:
 * - Use Supabase Auth with Google provider (scope: https://www.googleapis.com/auth/calendar.readonly)
 *   or a separate OAuth flow to obtain access_token/refresh_token.
 * - Fetch events via Google Calendar API and upsert into calendar_events (source: 'google').
 * - Run on dashboard load or a sync cron; feed duration into energy budget.
 *
 * Manual calendar events are already supported via AddCalendarEventForm and calendar_events (source: 'manual').
 */

export type GoogleCalendarEvent = {
  id: string;
  summary: string | null;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.ok || res.status === 401 || res.status === 403) return res;
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((r) => setTimeout(r, delay));
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr ?? new Error("Fetch failed");
}

/**
 * Fetch events for a date from Google Calendar API (primary calendar).
 * timeMin/timeMax in ISO format for that date in UTC. Retries on 5xx/network errors.
 */
export async function fetchGoogleCalendarEventsForDate(
  accessToken: string,
  dateStr: string
): Promise<GoogleCalendarEvent[]> {
  const timeMin = `${dateStr}T00:00:00Z`;
  const timeMax = `${dateStr}T23:59:59Z`;
  const url = `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
  try {
    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

/**
 * Exchange OAuth code for tokens. Returns { access_token, refresh_token?, expires_in }.
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Token exchange failed");
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in ?? 3600,
  };
}

/**
 * Create an event on the user's primary Google Calendar. Returns the created event id.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  params: { summary: string; start: string; end: string }
): Promise<string | null> {
  const url = `${CALENDAR_API}/calendars/primary/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: params.summary,
      start: { dateTime: params.start },
      end: { dateTime: params.end },
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}

/**
 * Delete an event from Google Calendar by id.
 */
export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  const url = `${CALENDAR_API}/calendars/primary/events/${encodeURIComponent(eventId)}`;
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
  return res.ok || res.status === 404;
}
