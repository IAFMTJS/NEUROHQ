import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureUserProfile } from "@/app/actions/auth";

const SUPABASE_REQUEST_MS = 12_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), SUPABASE_REQUEST_MS);
  return fetch(input, { ...init, signal: init?.signal ?? ctrl.signal }).finally(() => clearTimeout(id));
}

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

function baseUrl(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? (request.url.startsWith("https") ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return request.url;
}

/**
 * POST /api/auth/admin-login
 * Same session as normal login, but only completes redirect to /admin when public.users.role = 'admin'.
 */
export async function POST(request: Request) {
  const base = baseUrl(request);
  const adminLogin = new URL("/admin/login", base);
  const parsed = await parseBody(request);
  if (!parsed) {
    adminLogin.searchParams.set("error", "E-mail en wachtwoord zijn verplicht.");
    return NextResponse.redirect(adminLogin, 302);
  }
  const { email, password } = parsed;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    adminLogin.searchParams.set("error", "Serverconfiguratie ontbreekt.");
    return NextResponse.redirect(adminLogin, 302);
  }

  const isHttps = request.url.startsWith("https://") || request.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.redirect(new URL("/admin", base), 302);

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
          res.cookies.set(name, value, opts);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    adminLogin.searchParams.set("error", error.message);
    return NextResponse.redirect(adminLogin, 302);
  }

  const uid = data.user?.id;
  if (uid) {
    await ensureUserProfile(uid, data.user?.email ?? undefined);
  }

  if (!uid) {
    adminLogin.searchParams.set("error", "Inloggen mislukt.");
    return NextResponse.redirect(adminLogin, 302);
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", uid).maybeSingle();
  const role = (profile as { role?: string } | null)?.role;

  if (role !== "admin") {
    await supabase.auth.signOut();
    adminLogin.searchParams.set(
      "error",
      "Dit account heeft geen beheerderstoegang. Vraag een admin om role = admin in de database te zetten."
    );
    res.headers.set("Location", adminLogin.toString());
    return res;
  }

  return res;
}
