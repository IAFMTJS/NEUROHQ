/**
 * D.3 — Import protocol rows from lib/protocols-seed-sample.json into public.protocol_library.
 * Usage (service role): node scripts/import-protocols-json.mjs
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, migration 089 applied.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const raw = readFileSync(join(root, "lib", "protocols-seed-sample.json"), "utf8");
const rows = JSON.parse(raw);

for (const row of rows) {
  const { error } = await supabase.from("protocol_library").upsert(
    {
      slug: row.slug,
      locale: row.locale ?? "nl",
      title: row.title,
      summary: row.summary ?? null,
      body_md: row.body_md ?? "",
      sort_order: row.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug,locale" }
  );
  if (error) console.error("Upsert error", row.slug, error.message);
  else console.log("OK", row.slug);
}

console.log("Done.");
