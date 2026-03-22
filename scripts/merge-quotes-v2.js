/**
 * Builds lib/quotes-data.json from "Quotes V2.json" (author + quote per id).
 * Missing ids (e.g. if V2 omits 141–240) are filled from lib/quotes-gap-fallback.json.
 *   node scripts/merge-quotes-v2.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const v2Path = path.join(root, "Quotes V2.json");
const gapPath = path.join(root, "lib", "quotes-gap-fallback.json");
const outPath = path.join(root, "lib", "quotes-data.json");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const gap = fs.existsSync(gapPath) ? loadJson(gapPath) : {};
const v2 = loadJson(v2Path);
const out = {};

for (const row of v2) {
  const id = row.id;
  if (typeof id !== "number" || id < 1 || id > 365) continue;
  out[String(id)] = {
    author_name: String(row.author ?? "").trim(),
    quote_text: String(row.quote ?? "").trim(),
  };
}

let fromGapCount = 0;
for (let i = 1; i <= 365; i++) {
  const k = String(i);
  if (!out[k] && gap[k]) {
    out[k] = { author_name: gap[k].author_name, quote_text: gap[k].quote_text };
    fromGapCount++;
  }
}

for (let i = 1; i <= 365; i++) {
  if (!out[String(i)]) {
    console.error("Still missing id", i, "(add to Quotes V2.json or quotes-gap-fallback.json)");
    process.exit(1);
  }
}

fs.writeFileSync(outPath, JSON.stringify(out));
console.log("Wrote", outPath, "365 quotes (" + v2.length + " V2 rows, " + fromGapCount + " ids from gap-fallback).");
