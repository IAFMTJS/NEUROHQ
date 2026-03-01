#!/usr/bin/env node
"use strict";
const { execSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const outPath = path.join(__dirname, "..", "types", "database.types.ts");

// Supabase CLI expects the short "Reference ID" (~20 chars). It does NOT accept prj_xxx.
// You can find the ref in the dashboard URL when the project is open: .../dashboard/project/<ref>
let projectRef = process.env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_ID;
if (projectRef && projectRef.startsWith("prj_")) {
  console.error("SUPABASE_PROJECT_ID is set to prj_... but the CLI needs the short Reference ID.");
  console.error("  → Open your project in the dashboard; the URL is https://supabase.com/dashboard/project/<REF>");
  console.error("  → Copy that <REF> part (about 20 chars) and run:");
  console.error("  →   $env:SUPABASE_PROJECT_REF = \"<REF>\"; npm run db:types");
  process.exit(1);
}
if (!projectRef || projectRef.length > 22 || !/^[a-zA-Z0-9]+$/.test(projectRef)) {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    const env = readFileSync(envPath, "utf8");
    const m = env.match(/NEXT_PUBLIC_SUPABASE_URL=https?:\/\/([^.]+)\.supabase\.co/);
    if (m && m[1].length >= 18 && m[1].length <= 22 && /^[a-zA-Z0-9]+$/.test(m[1])) projectRef = m[1];
  } catch (_) {}
}
if (!projectRef) {
  console.error("Set SUPABASE_PROJECT_REF to the short Reference ID (~20 chars).");
  console.error("  → Dashboard URL when project is open: .../dashboard/project/<ref> — copy <ref>");
  console.error("  → PowerShell: $env:SUPABASE_PROJECT_REF = \"<ref>\"; npm run db:types");
  process.exit(1);
}
const cmd = `npx supabase gen types typescript --project-id ${projectRef}`;
console.log("Generating types from Supabase...");
const out = execSync(cmd, { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
writeFileSync(outPath, out, "utf8");
console.log("Wrote", outPath);
