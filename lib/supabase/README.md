# Supabase integration

Optimized loading and integration patterns used in NEUROHQ.

## Server (`server.ts`)

- **`createClient()`** — Uses React `cache()` so one request gets a single Supabase client instance. Always use this; do not create ad-hoc clients.
- **Timeout** — All server requests use `fetchWithTimeout` (12s) to avoid hanging on cold starts or network issues.
- **Cookies** — Uses `@supabase/ssr` for auth cookie handling; safe in Route Handlers and Server Actions.

## Dashboard data

- **Single round-trip** — Use `GET /api/dashboard/data?part=all` so critical + secondary are fetched together (no duplicate `buildTodayContext` or parallel critical/secondary calls).
- **In-memory cache** — The dashboard API caches full payloads per user+date for 60s to avoid repeated work on refresh.
- **Response cache** — Responses send `Cache-Control: private, max-age=30, stale-while-revalidate=60` so the client can reuse the payload briefly.

## Preferences

- **`getUserPreferences`** (in `app/actions/preferences.ts`) is wrapped in React `cache()` so multiple callers in the same request (e.g. dashboard API + any action) share one Supabase read.

## Client (`client.ts`)

- **Browser** — Use `createClient()` from `@/lib/supabase/client` for client-side Supabase (e.g. realtime, client-only fetches). Server data should go through the dashboard API or server actions.
