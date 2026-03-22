/**
 * D.3 — Import protocol rows into public.protocol_library.
 * Default seed: lib/protocols-seed-full.json (PHASES → WEEKS → tasks).
 * Usage (service role): npm run import-protocols
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; optional PROTOCOLS_SEED=file.json
 * Requires migrations 089 + 090 applied.
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

const seedFile = process.env.PROTOCOLS_SEED || "protocols-seed-full.json";
const supabase = createClient(url, key);
const raw = readFileSync(join(root, "lib", seedFile), "utf8");
const rows = JSON.parse(raw);

for (const row of rows) {
  const definition = row.definition ?? row.definition_json ?? {};
  const { error } = await supabase.from("protocol_library").upsert(
    {
      slug: row.slug,
      locale: row.locale ?? "nl",
      title: row.title,
      summary: row.summary ?? null,
      body_md: row.body_md ?? "",
      definition_json: definition,
      sort_order: row.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug,locale" },
  );
  if (error) console.error("Upsert error", row.slug, error.message);
  else console.log("OK", row.slug);
}

console.log("Done.", seedFile);
