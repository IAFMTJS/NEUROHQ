/** Query-driven profile UX: home strip vs settings workspace. */

export type ProfileMainView = "home" | "settings";

export type ProfileSettingsTabId = "identity" | "behavior" | "system" | "budget" | "insights";

const SETTINGS_TABS = new Set<ProfileSettingsTabId>([
  "identity",
  "behavior",
  "system",
  "budget",
  "insights",
]);

export function parseProfileMainView(raw: string | undefined | null): ProfileMainView {
  return raw === "settings" ? "settings" : "home";
}

export function parseProfileSettingsTab(raw: string | undefined | null): ProfileSettingsTabId {
  if (raw && SETTINGS_TABS.has(raw as ProfileSettingsTabId)) return raw as ProfileSettingsTabId;
  return "identity";
}

export function profileHomeHref(): string {
  return "/profile";
}

export function profileSettingsHref(tab: ProfileSettingsTabId): string {
  const p = new URLSearchParams();
  p.set("view", "settings");
  p.set("settingsTab", tab);
  return `/profile?${p.toString()}`;
}

/** Insights nested tab + optional week (used when settingsTab=insights). */
export function profileInsightsHref(insightsTab: string, weekStart?: string | null | undefined): string {
  const p = new URLSearchParams();
  p.set("view", "settings");
  p.set("settingsTab", "insights");
  p.set("insightsTab", insightsTab);
  if (weekStart) p.set("weekStart", weekStart);
  return `/profile?${p.toString()}`;
}
