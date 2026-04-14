/**
 * Growth protocol **content** is bundled from repo JSON (same source as `npm run import-protocols`).
 * Supabase stores only **per-user progress** (`user_protocol_progress`, focus in `user_preferences`).
 */
import { createHash } from "crypto";
import type { ProtocolCatalogRow } from "@/lib/growth/protocol-catalog-row";
import fullSeed from "@/lib/protocols-seed-full.json";
import catalogSeed from "@/lib/protocols-seed-catalog.json";

type SeedRow = {
  slug: string;
  locale?: string;
  title: string;
  summary?: string | null;
  sort_order?: number;
  body_md?: string;
  definition?: unknown;
  definition_json?: unknown;
};

/** Stable UUID-shaped id so React keys and lookups stay consistent across builds. */
export function protocolPresetStableId(slug: string, locale: string): string {
  const hex = createHash("sha256").update(`neurohq:protocol:${slug}:${locale}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function seedToRow(raw: SeedRow): ProtocolCatalogRow {
  const slug = raw.slug;
  const locale = raw.locale ?? "nl";
  const def = raw.definition ?? raw.definition_json ?? {};
  const ts = "2020-01-01T00:00:00.000Z";
  return {
    id: protocolPresetStableId(slug, locale),
    slug,
    locale,
    title: raw.title,
    summary: raw.summary ?? null,
    body_md: raw.body_md ?? "",
    definition_json: def,
    sort_order: raw.sort_order ?? 0,
    created_at: ts,
    updated_at: ts,
  };
}

let cached: ProtocolCatalogRow[] | null = null;

/** Merged seed files; duplicate slug+locale uses last occurrence (same as import script order). */
export function getBundledProtocolLibraryRows(): ProtocolCatalogRow[] {
  if (cached) return cached;

  const main = (Array.isArray(fullSeed) ? fullSeed : []) as SeedRow[];
  const catalog = (Array.isArray(catalogSeed) ? catalogSeed : []) as SeedRow[];
  const merged: SeedRow[] = [...main, ...catalog];

  const byKey = new Map<string, SeedRow>();
  for (const r of merged) {
    if (!r || typeof r.slug !== "string") continue;
    const loc = r.locale ?? "nl";
    byKey.set(`${r.slug}::${loc}`, r);
  }

  const rows = Array.from(byKey.values())
    .map(seedToRow)
    .sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug));

  cached = rows;
  return rows;
}

export function getBundledProtocolBySlugLocale(slug: string, locale: string): ProtocolCatalogRow | null {
  const id = protocolPresetStableId(slug, locale);
  return getBundledProtocolLibraryRows().find((p) => p.id === id) ?? null;
}

export function getBundledProtocolById(id: string): ProtocolCatalogRow | null {
  return getBundledProtocolLibraryRows().find((p) => p.id === id) ?? null;
}

export function getBundledProtocolLibraryForLocale(locale = "nl"): ProtocolCatalogRow[] {
  const all = getBundledProtocolLibraryRows();
  const forLocale = all.filter((p) => p.locale === locale);
  return forLocale.length > 0 ? forLocale : all;
}
