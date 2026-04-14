"use server";

import type { ProtocolCatalogRow } from "@/lib/growth/protocol-catalog-row";
import {
  getBundledProtocolById,
  getBundledProtocolLibraryForLocale,
} from "@/lib/growth/protocol-presets";

export type ProtocolLibraryRow = ProtocolCatalogRow;

/** Bundled presets include all columns; same shape as DB row for UI compatibility. */
export type ProtocolLibraryListRow = ProtocolLibraryRow;

/**
 * Published protocol trajectories from **site code** (`lib/protocols-seed-full.json` + catalog).
 * User progress lives in Supabase (`user_protocol_progress`, preferences).
 */
export async function getProtocolLibrary(locale = "nl"): Promise<ProtocolLibraryListRow[]> {
  return getBundledProtocolLibraryForLocale(locale);
}

export async function getProtocolLibraryById(id: string): Promise<ProtocolLibraryRow | null> {
  return getBundledProtocolById(id);
}

type UpdateProtocolInput = {
  id: string;
  title: string;
  summary?: string | null;
  body_md: string;
};

/** @deprecated Protocol content is versioned in repo JSON, not the database. */
export async function updateProtocolLibraryContent(_input: UpdateProtocolInput): Promise<never> {
  throw new Error(
    "Protocol-inhoud staat in de repo (lib/protocols-seed-full.json / protocols-seed-catalog.json). Pas die aan en deploy opnieuw.",
  );
}
