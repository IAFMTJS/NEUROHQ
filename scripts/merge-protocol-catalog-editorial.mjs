/**
 * Past unieke week_intent / why_it_matters / micro_actions toe op lib/protocols-seed-catalog.json.
 * Run: node scripts/merge-protocol-catalog-editorial.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { EDITORIAL } from "./protocol-catalog-editorial-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "lib", "protocols-seed-catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

for (const proto of catalog) {
  const slug = proto.slug;
  const weeksOverlay = EDITORIAL[slug];
  if (!weeksOverlay) {
    console.error("Missing EDITORIAL entry for slug:", slug);
    process.exit(1);
  }
  const weeks = proto.definition?.weeks;
  if (!Array.isArray(weeks) || weeks.length !== weeksOverlay.length) {
    console.error("Week count mismatch for", slug, weeks?.length, "vs", weeksOverlay.length);
    process.exit(1);
  }
  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    const o = weeksOverlay[i];
    w.week_intent = o.week_intent;
    if (!w.tasks?.[0] || !w.tasks?.[1]) {
      console.error("Expected 2 tasks/week", slug, w.week_index);
      process.exit(1);
    }
    w.tasks[0].why_it_matters = o.kern.why_it_matters;
    w.tasks[0].micro_actions = [...o.kern.micro_actions];
    w.tasks[1].why_it_matters = o.micro.why_it_matters;
    w.tasks[1].micro_actions = [...o.micro.micro_actions];
  }
}

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log("Updated", catalogPath);
