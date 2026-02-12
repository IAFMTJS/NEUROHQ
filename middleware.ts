import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = ["/dashboard", "/tasks", "/settings", "/budget", "/learning", "/strategy", "/report"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

function isAppRoute(pathname: string) {
  return APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}
function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((r) => pathname === r);
}

export async function middleware(request: NextRequest) {
  // Use a single response object so any cookies set by Supabase are returned
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as { path?: string; maxAge?: number; domain?: string; sameSite?: "lax" | "strict" | "none"; secure?: boolean; httpOnly?: boolean } | undefined);
        });
      },
    },
  });

  // getUser() validates the JWT and refreshes session; updates cookies via setAll
  const { data: { user } } = await supabase.auth.getUser();

  if (isAppRoute(request.nextUrl.pathname) && !user) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    // Copy over any cookies Supabase set (e.g. during refresh)
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }
  if (isAuthRoute(request.nextUrl.pathname) && user) {
    const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
