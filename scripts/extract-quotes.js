const fs = require("fs");
const path = require("path");

const sqlPath = path.join(__dirname, "../supabase/migrations/005_seed_quotes_full.sql");
const content = fs.readFileSync(sqlPath, "utf8");
const lines = content.split("\n").filter((l) => l.trim().startsWith("("));

const out = {};
for (const line of lines) {
  const match = line.match(/^\((\d+),\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'\)/);
  if (!match) continue;
  const id = parseInt(match[1], 10);
  const unescape = (s) => s.replace(/''/g, "'");
  out[id] = { author_name: unescape(match[2]), quote_text: unescape(match[5]) };
}

const outPath = path.join(__dirname, "../lib/quotes-data.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 0));
console.log("Count:", Object.keys(out).length);
