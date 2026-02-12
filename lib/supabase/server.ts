import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export const createClient = cache(async () => {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    const err = new Error("Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables.");
    console.error("[Supabase server]", err.message);
    throw err;
  }
  try {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
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
  } catch (e) {
    console.error("[Supabase server]", e instanceof Error ? e.message : e);
    throw e;
  }
});
