import { cache } from "react";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

const SUPABASE_REQUEST_MS = 12_000;

/** Fetch wrapper that aborts after SUPABASE_REQUEST_MS to avoid ETIMEDOUT on Vercel → Supabase. */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), SUPABASE_REQUEST_MS);
  return fetch(input, {
    ...init,
    signal: init?.signal ?? ctrl.signal,
  }).finally(() => clearTimeout(id));
}

/** Next.js only allows cookies().set() in Server Actions and Route Handlers, not in Server Components */
function getCookieOptions(options?: Record<string, unknown>): { path?: string; maxAge?: number; expires?: Date; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: "lax" | "strict" | "none" } {
  if (!options) return {};
  return {
    path: typeof options.path === "string" ? options.path : "/",
    maxAge: typeof options.maxAge === "number" ? options.maxAge : undefined,
    expires: options.expires instanceof Date ? options.expires : undefined,
    domain: typeof options.domain === "string" ? options.domain : undefined,
    secure: typeof options.secure === "boolean" ? options.secure : undefined,
    httpOnly: typeof options.httpOnly === "boolean" ? options.httpOnly : undefined,
    sameSite: (options.sameSite === "lax" || options.sameSite === "strict" || options.sameSite === "none") ? options.sameSite : undefined,
  };
}

export const createClient = cache(async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    const err = new Error("Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables.");
    console.error("[Supabase server]", err.message);
    throw err;
  }
  try {
    const serverClient = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              const opts = getCookieOptions(options);
              cookieStore.set(name, value, { path: "/", ...opts });
            }
          } catch (e) {
            // In Server Components, set() throws (cannot set after streaming). Ignore so reads still work.
            if (process.env.NODE_ENV === "development") {
              console.warn("[Supabase] Could not set auth cookies (expected in Server Components):", (e as Error).message);
            }
          }
        },
      },
    });
    // Return a client created with Database generic so table types (Row/Insert/Update) are correct.
    // Reuse the server client's auth so cookies/session are shared.
    const typedClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
    });
    (typedClient as unknown as { auth: typeof serverClient.auth }).auth = serverClient.auth;
    return typedClient;
  } catch (e) {
    console.error("[Supabase server]", e instanceof Error ? e.message : e);
    throw e;
  }
});

/** Supabase client using only JWT (no cookies). Safe to use inside unstable_cache. */
export function createClientWithToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createSupabaseClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Service role client (bypasses RLS). Only use server-side; set SUPABASE_SERVICE_ROLE_KEY. Returns null if key not set. */
export function createServiceRoleClient(): ReturnType<typeof createSupabaseClient<Database>> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient<Database>(url, key, { global: { fetch: fetch } });
}
