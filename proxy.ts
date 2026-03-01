import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = ["/dashboard", "/tasks", "/settings", "/budget", "/learning", "/strategy", "/report", "/xp", "/assistant", "/analytics"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const SUPABASE_PROXY_MS = 8_000;

function isAppRoute(pathname: string) {
  return APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}
function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((r) => pathname === r);
}

/** Use the host the client used so redirects stay on same domain (avoids "might be moved" when request.url is internal). */
function baseUrl(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? (request.url.startsWith("https") ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return request.url;
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), SUPABASE_PROXY_MS);
  return fetch(input, { ...init, signal: init?.signal ?? ctrl.signal }).finally(() => clearTimeout(id));
}

type CookieOpts = { path?: string; maxAge?: number; domain?: string; sameSite?: "lax" | "strict" | "none"; secure?: boolean; httpOnly?: boolean };

/**
 * Proxy: validate session with Supabase getUser() so auth works on deploy (Vercel).
 * API routes are excluded so /api/auth/login can set cookies and redirect.
 * Redirects use baseUrl() so the client stays on the same domain.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const base = baseUrl(request);
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  let user: { id: string } | null = null;
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const o = (options ?? {}) as CookieOpts;
            response.cookies.set(name, value, {
              path: o.path ?? "/",
              sameSite: o.sameSite ?? "lax",
              secure: o.secure,
              maxAge: o.maxAge,
              domain: o.domain,
              httpOnly: o.httpOnly,
            });
          });
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Supabase timeout or error (e.g. on deploy): fall back to cookie presence so users aren't blocked
  }

  const hasSession = !!user || hasSbCookie;

  if (isAppRoute(pathname) && !hasSession) {
    const redirect = NextResponse.redirect(new URL("/login", base), 302);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }
  // Only redirect GET when logged-in user hits auth page (avoid redirecting POST e.g. server actions)
  if (isAuthRoute(pathname) && hasSession && request.method === "GET") {
    const redirect = NextResponse.redirect(new URL("/dashboard", base), 302);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude API routes so login/callback responses are never touched by the proxy
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
