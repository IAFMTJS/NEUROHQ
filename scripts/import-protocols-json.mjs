/**
 * D.3 — Import protocol rows into public.protocol_library.
 * Default seed: lib/protocols-seed-full.json (PHASES → WEEKS → tasks).
 * Usage (service role): npm run import-protocols
 * Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY; optional PROTOCOLS_SEED=file.json
 * Loads .env.local then .env from project root when vars are not already set (same keys as Next.js).
 * Requires migrations 089 + 090 applied.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Minimal KEY=value loader so `npm run import-protocols` picks up .env.local like `next dev`. */
function loadEnvFile(relPath) {
  const full = join(root, relPath);
  if (!existsSync(full)) return;
  const text = readFileSync(full, "utf8").replace(/^\uFEFF/, "");
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice(7).trim();
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing Supabase credentials. Add to .env.local (or export in shell):\n" +
      "  SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Project Settings → API → service_role — never commit this)",
  );
  process.exit(1);
}

const seedFile = process.env.PROTOCOLS_SEED || "protocols-seed-full.json";
const catalogFile = process.env.PROTOCOLS_SEED_CATALOG || "protocols-seed-catalog.json";
const supabase = createClient(url, key);

const mainRaw = readFileSync(join(root, "lib", seedFile), "utf8");
const rows = JSON.parse(mainRaw);

let catalogRows = [];
try {
  const catPath = join(root, "lib", catalogFile);
  const catRaw = readFileSync(catPath, "utf8");
  catalogRows = JSON.parse(catRaw);
  if (!Array.isArray(catalogRows)) catalogRows = [];
} catch {
  // Optional second file — ok if missing
}

const merged = [...rows, ...catalogRows];

for (const row of merged) {
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

console.log("Done.", seedFile, "+", catalogFile, `(${rows.length} + ${catalogRows.length} = ${merged.length} rows)`);
