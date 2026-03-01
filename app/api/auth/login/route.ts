import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureUserProfile } from "@/app/actions/auth";

const SUPABASE_REQUEST_MS = 12_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), SUPABASE_REQUEST_MS);
  return fetch(input, { ...init, signal: init?.signal ?? ctrl.signal }).finally(() => clearTimeout(id));
}

/** Parse email and password from JSON or form body. */
async function parseBody(request: Request): Promise<{ email: string; password: string } | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    return email && password ? { email, password } : null;
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    const email = (form.get("email") ?? "").toString().trim();
    const password = (form.get("password") ?? "").toString();
    return email && password ? { email, password } : null;
  }
  return null;
}

/** Use the host the client used (e.g. x-forwarded-* on Vercel) so redirects and cookies match the deployment URL. */
function baseUrl(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? (request.url.startsWith("https") ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return request.url;
}

/**
 * POST /api/auth/login
 * Accepts JSON or form body. On success: 302 to /dashboard with session cookies.
 * On error: 302 to /login?error=... so the browser does a full navigation and never loses cookies.
 */
export async function POST(request: Request) {
  const base = baseUrl(request);
  const parsed = await parseBody(request);
  if (!parsed) {
    const loginUrl = new URL("/login", base);
    loginUrl.searchParams.set("error", "Email en wachtwoord zijn verplicht.");
    return NextResponse.redirect(loginUrl, 302);
  }
  const { email, password } = parsed;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = new URL("/login", base);
    loginUrl.searchParams.set("error", "Serverconfiguratie ontbreekt.");
    return NextResponse.redirect(loginUrl, 302);
  }

  const isHttps = request.url.startsWith("https://") || request.headers.get("x-forwarded-proto") === "https";
  const successRedirect = NextResponse.redirect(new URL("/dashboard", base), 302);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        const header = request.headers.get("cookie");
        if (!header) return [];
        return header.split(";").map((c) => {
          const eq = c.trim().indexOf("=");
          if (eq < 0) return { name: c.trim(), value: "" };
          const name = c.trim().slice(0, eq).trim();
          const value = c.trim().slice(eq + 1).trim();
          return { name, value };
        }).filter((c) => c.name.length > 0);
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const o = options && typeof options === "object" ? options : {};
          const opts: { path?: string; maxAge?: number; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: "lax" | "strict" | "none" } = {
            path: (typeof o.path === "string" ? o.path : undefined) ?? "/",
            sameSite: (o.sameSite === "lax" || o.sameSite === "strict" || o.sameSite === "none") ? o.sameSite : "lax",
            secure: isHttps ? true : (o.secure === true),
          };
          if (typeof o.maxAge === "number") opts.maxAge = o.maxAge;
          if (typeof o.domain === "string") opts.domain = o.domain;
          if (o.httpOnly === true) opts.httpOnly = true;
          successRedirect.cookies.set(name, value, opts);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const loginUrl = new URL("/login", base);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl, 302);
  }

  if (data.user) {
    void ensureUserProfile(data.user.id, data.user.email ?? undefined).catch(() => {});
  }

  return successRedirect;
}
