"use server";

import { createClient } from "@/lib/supabase/server";

export type FeatureFlagName =
  | "calendar_integration"
  | "push_quotes"
  | "push_avoidance"
  | "push_learning"
  | "push_savings"
  | "push_shutdown"
  | "stabilize_mode_forced";

const DEFAULTS: Record<FeatureFlagName, boolean> = {
  calendar_integration: false,
  push_quotes: true,
  push_avoidance: true,
  push_learning: true,
  push_savings: true,
  push_shutdown: true,
  stabilize_mode_forced: false,
};

export async function getFeatureFlags(): Promise<Record<FeatureFlagName, boolean>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const flags = { ...DEFAULTS };
  if (!user) return flags;

  const { data: rows } = await supabase
    .from("feature_flags")
    .select("name, enabled, user_id")
    .or(`user_id.eq.${user.id},user_id.is.null`);

  const byName = new Map<string, { enabled: boolean; user_id: string | null }>();
  for (const r of rows ?? []) {
    const name = r.name as FeatureFlagName;
    if (!(name in DEFAULTS)) continue;
    const existing = byName.get(name);
    if (!existing || (existing.user_id === null && r.user_id !== null)) {
      byName.set(name, { enabled: r.enabled, user_id: r.user_id });
    }
  }
  for (const [name, { enabled }] of byName) {
    (flags as Record<string, boolean>)[name] = enabled;
  }
  return flags;
}

export async function isFeatureEnabled(name: FeatureFlagName): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[name] ?? DEFAULTS[name];
}
