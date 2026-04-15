#!/usr/bin/env node
/**
 * Supabase Edge Logs → "egress" report (request frequency + error loops).
 *
 * Why this exists:
 * - Supabase billing egress is driven by responses; Edge Logs don't include bytes.
 * - But request frequency + repeated error loops (e.g. 406 on .single()) strongly predicts egress blowups.
 *
 * Input: CSV export from Supabase Edge Logs (as downloaded in dashboard).
 * Output: Markdown summary (stdout) + optional JSON.
 *
 * Usage:
 *   node scripts/egress-report.mjs "GIThub logs/supabase-edge-logs-xxxx.csv.csv" --top 25
 *   node scripts/egress-report.mjs "<file>" --since-minutes 120 --out-md egress-report.md --out-json egress-report.json
 */

import fs from "node:fs";
import path from "node:path";

function usageAndExit(code = 1) {
  // eslint-disable-next-line no-console
  console.log(
    [
      "",
      "Usage:",
      '  node scripts/egress-report.mjs "<edge-logs.csv>" [--top 30] [--since-minutes 1440] [--out-md report.md] [--out-json report.json]',
      "",
      "Notes:",
      "- Edge logs CSV has no byte counts; this report focuses on call volume + error loops.",
      "- 406 on PostgREST commonly indicates `.single()` where 0 rows exist (refetch loops).",
      "",
    ].join("\n")
  );
  process.exit(code);
}

function parseArgs(argv) {
  const args = {
    file: null,
    top: 30,
    sinceMinutes: null,
    outMd: null,
    outJson: null,
  };

  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (a === "--help" || a === "-h") usageAndExit(0);
    if (a === "--top") {
      args.top = Number(argv[++i] ?? "");
      continue;
    }
    if (a === "--since-minutes") {
      args.sinceMinutes = Number(argv[++i] ?? "");
      continue;
    }
    if (a === "--out-md") {
      args.outMd = argv[++i] ?? null;
      continue;
    }
    if (a === "--out-json") {
      args.outJson = argv[++i] ?? null;
      continue;
    }
    positional.push(a);
  }

  args.file = positional[0] ?? null;
  if (!args.file) usageAndExit(1);
  if (!Number.isFinite(args.top) || args.top <= 0) args.top = 30;
  if (args.sinceMinutes != null && (!Number.isFinite(args.sinceMinutes) || args.sinceMinutes <= 0)) args.sinceMinutes = null;
  return args;
}

// Minimal CSV parser (handles quoted fields with commas and escaped quotes).
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuotes = false;
        continue;
      }
      cur += ch;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function microsToIso(tsMicros) {
  const micros = Number(tsMicros);
  if (!Number.isFinite(micros) || micros <= 0) return null;
  const ms = Math.floor(micros / 1000);
  return new Date(ms).toISOString();
}

function minuteBucket(isoTs) {
  if (!isoTs) return null;
  return isoTs.slice(0, 16); // YYYY-MM-DDTHH:MM
}

function inc(map, key, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function topNFromMap(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ key: k, count: v }));
}

function pct(n, d) {
  if (!d) return "0.0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

function shorten(s, max = 120) {
  if (!s) return "";
  const t = String(s);
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function formatTable(rows) {
  if (!rows.length) return "_(none)_";
  const header = `| Metric | Count |\n|---|---:|`;
  const body = rows.map((r) => `| \`${r.key}\` | ${r.count} |`).join("\n");
  return `${header}\n${body}`;
}

function normalizeSearch(search) {
  if (!search || search === "null") return "";
  // Keep the most important part for grouping: select + filters.
  // Strip volatile tokens (like timestamps) if any appear.
  return String(search)
    .replace(/(ts|timestamp|t)=eq\.[^&]+/gi, "$1=eq.<redacted>")
    .replace(/(since|until)=\d+/gi, "$1=<redacted>");
}

function buildReport(records, opts) {
  const total = records.length;

  const byPath = new Map();
  const byPathAndStatus = new Map();
  const byStatus = new Map();
  const byMethod = new Map();
  const byMinute = new Map();
  const authUserByMinute = new Map();

  const loops406ByMinute = new Map(); // minute -> count
  const loops406BySig = new Map(); // signature -> count
  const slowestMinutes = new Map(); // minute -> count (proxy for bursts)

  for (const r of records) {
    inc(byPath, r.path);
    inc(byStatus, String(r.status_code));
    inc(byMethod, r.method);
    const sig = `${r.method} ${r.path}${r.search ? ` ${normalizeSearch(r.search)}` : ""} → ${r.status_code}`;
    inc(byPathAndStatus, sig);

    const mb = minuteBucket(r.timestamp_iso);
    if (mb) inc(byMinute, mb);
    if (mb) inc(slowestMinutes, mb);

    if (r.path === "/auth/v1/user" && mb) inc(authUserByMinute, mb);
    if (r.path === "/rest/v1/user_preferences" && r.status_code === 406) {
      if (mb) inc(loops406ByMinute, mb);
      inc(loops406BySig, sig);
    }
  }

  const topPaths = topNFromMap(byPath, opts.top);
  const topSigs = topNFromMap(byPathAndStatus, opts.top);
  const topStatus = topNFromMap(byStatus, 20);
  const topMethods = topNFromMap(byMethod, 10);

  const authFanout = topNFromMap(authUserByMinute, 10);
  const worst406 = topNFromMap(loops406BySig, opts.top);
  const worstMinutes = topNFromMap(byMinute, 15);
  const worst406Minutes = topNFromMap(loops406ByMinute, 15);

  const total406 = (byStatus.get("406") ?? 0);
  const total200 = (byStatus.get("200") ?? 0);
  const total401 = (byStatus.get("401") ?? 0);
  const total500p = [...byStatus.entries()]
    .filter(([k]) => k.startsWith("5"))
    .reduce((sum, [, v]) => sum + v, 0);

  const window = (() => {
    if (!records.length) return null;
    const first = records[records.length - 1]?.timestamp_iso ?? null;
    const last = records[0]?.timestamp_iso ?? null;
    return { first, last };
  })();

  const json = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalRequests: total,
      window,
      totals: {
        status200: total200,
        status401: total401,
        status406: total406,
        status5xx: total500p,
      },
    },
    topPaths,
    topSignatures: topSigs,
    topStatus,
    topMethods,
    authUserCallsByMinuteTop: authFanout,
    userPreferences406Top: worst406,
    busiestMinutesTop: worstMinutes,
    userPreferences406MinutesTop: worst406Minutes,
  };

  const md = [
    `## Supabase Edge Logs – custom egress report`,
    ``,
    `- **generated_at**: \`${json.meta.generatedAt}\``,
    `- **requests**: **${total}**`,
    window?.first && window?.last ? `- **window**: \`${window.first}\` → \`${window.last}\`` : null,
    ``,
    `### Key risks (egress blowups)`,
    ``,
    `- **406 rate**: **${total406}** (${pct(total406, total)})`,
    `- **5xx rate**: **${total500p}** (${pct(total500p, total)})`,
    ``,
    `### Top paths (by request count)`,
    ``,
    formatTable(topPaths.map((r) => ({ key: shorten(r.key, 160), count: r.count }))),
    ``,
    `### Top request signatures (method + path + query + status)`,
    ``,
    formatTable(topSigs.map((r) => ({ key: shorten(r.key, 180), count: r.count }))),
    ``,
    `### Status codes`,
    ``,
    formatTable(topStatus),
    ``,
    `### Methods`,
    ``,
    formatTable(topMethods),
    ``,
    `### Auth fanout (GET /auth/v1/user) – top minutes`,
    ``,
    authFanout.length
      ? formatTable(authFanout.map((r) => ({ key: `${r.key}Z`, count: r.count })))
      : "_(no /auth/v1/user calls found)_",
    ``,
    `### Potential error loop: 406 on /rest/v1/user_preferences`,
    ``,
    worst406.length
      ? formatTable(worst406.map((r) => ({ key: shorten(r.key, 180), count: r.count })))
      : "_(no 406 loops on user_preferences detected)_",
    ``,
    `### Busiest minutes (request bursts)`,
    ``,
    formatTable(worstMinutes.map((r) => ({ key: `${r.key}Z`, count: r.count }))),
    ``,
  ]
    .filter(Boolean)
    .join("\n");

  return { md, json };
}

function loadRecords(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  const idx = {
    method: header.indexOf("method"),
    path: header.indexOf("path"),
    search: header.indexOf("search"),
    status_code: header.indexOf("status_code"),
    timestamp: header.indexOf("timestamp"),
    event_message: header.indexOf("event_message"),
  };
  const required = ["method", "path", "status_code", "timestamp"].filter((k) => idx[k] < 0);
  if (required.length) {
    throw new Error(`CSV missing columns: ${required.join(", ")}`);
  }

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const method = row[idx.method] ?? "";
    const p = row[idx.path] ?? "";
    const search = row[idx.search] ?? "";
    const status_code = toNumberOrNull(row[idx.status_code]) ?? -1;
    const timestamp = row[idx.timestamp] ?? "";
    const timestamp_iso = microsToIso(timestamp);
    const event_message = idx.event_message >= 0 ? (row[idx.event_message] ?? "") : "";
    if (!p || !method || status_code < 0) continue;
    records.push({
      method,
      path: p,
      search: search && search !== "null" ? search : "",
      status_code,
      timestamp_micros: timestamp,
      timestamp_iso,
      event_message,
    });
  }

  // Sort descending by timestamp (latest first) for window reporting.
  records.sort((a, b) => {
    const am = Number(a.timestamp_micros);
    const bm = Number(b.timestamp_micros);
    return bm - am;
  });
  return records;
}

async function main() {
  const opts = parseArgs(process.argv);
  const filePath = path.resolve(process.cwd(), opts.file);
  if (!fs.existsSync(filePath)) {
    // eslint-disable-next-line no-console
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const csv = fs.readFileSync(filePath, "utf8");
  let records = loadRecords(csv);

  if (opts.sinceMinutes != null) {
    const cutoff = Date.now() - opts.sinceMinutes * 60_000;
    records = records.filter((r) => (r.timestamp_iso ? new Date(r.timestamp_iso).getTime() >= cutoff : false));
  }

  const { md, json } = buildReport(records, opts);

  if (opts.outMd) {
    const outPath = path.resolve(process.cwd(), opts.outMd);
    fs.writeFileSync(outPath, md, "utf8");
  } else {
    // eslint-disable-next-line no-console
    console.log(md);
  }

  if (opts.outJson) {
    const outPath = path.resolve(process.cwd(), opts.outJson);
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2), "utf8");
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e?.stack || String(e));
  process.exit(1);
});

