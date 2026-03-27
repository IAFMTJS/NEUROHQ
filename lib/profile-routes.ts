/** Profiel: home vs engine-workspace. Site-instellingen: `/settings`. Insights: `/report`. */

export type ProfileMainView = "home" | "engine";

/** Subtabs onder Profiel → Engine (geen site-instellingen). */
export type ProfileEngineTabId = "identity" | "behavior" | "modes";

const ENGINE_TABS = new Set<ProfileEngineTabId>(["identity", "behavior", "modes"]);

export function parseProfileMainView(raw: string | undefined | null): ProfileMainView {
  return raw === "engine" ? "engine" : "home";
}

export function parseProfileEngineTab(raw: string | undefined | null): ProfileEngineTabId {
  if (raw && ENGINE_TABS.has(raw as ProfileEngineTabId)) return raw as ProfileEngineTabId;
  return "identity";
}

export function profileHomeHref(): string {
  return "/profile";
}

export function profileEngineHref(tab: ProfileEngineTabId): string {
  const p = new URLSearchParams();
  p.set("view", "engine");
  p.set("engineTab", tab);
  return `/profile?${p.toString()}`;
}

/** Insights: altijd op `/report`. */
export function reportInsightsHref(insightsTab: string, weekStart?: string | null | undefined): string {
  const p = new URLSearchParams();
  p.set("tab", insightsTab);
  if (weekStart) p.set("weekStart", weekStart);
  return `/report?${p.toString()}`;
}
