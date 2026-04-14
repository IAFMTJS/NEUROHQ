/**
 * D.3 — Protocol presets live in repo JSON; the app bundles them (see lib/growth/protocol-presets.ts).
 * public.protocol_library is removed by migration 136_drop_protocol_library.sql.
 *
 * This script only validates that seed JSON parses. Optional: npm run import-protocols
 */
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const seedFile = process.env.PROTOCOLS_SEED || "protocols-seed-full.json";
const catalogFile = process.env.PROTOCOLS_SEED_CATALOG || "protocols-seed-catalog.json";

const mainRaw = readFileSync(join(root, "lib", seedFile), "utf8");
const rows = JSON.parse(mainRaw);
if (!Array.isArray(rows)) {
  console.error(seedFile, "must be a JSON array");
  process.exit(1);
}

let catalogRows = [];
try {
  const catPath = join(root, "lib", catalogFile);
  const catRaw = readFileSync(catPath, "utf8");
  catalogRows = JSON.parse(catRaw);
  if (!Array.isArray(catalogRows)) catalogRows = [];
} catch {
  // optional
}

console.log(
  "OK —",
  rows.length,
  "+",
  catalogFile,
  "=",
  rows.length + catalogRows.length,
  "preset rows (bundled at build/deploy; not written to Supabase).",
);
