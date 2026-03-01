import { createClient } from "@supabase/supabase-js";

/**
 * Server-side only. Use for cron and admin operations.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin client");
  return createClient(url, key);
}
