/** Profiel: home, engine-workspace, of Insights. Site-instellingen: `/settings`. */

export type ProfileMainView = "home" | "engine" | "insights" | "special";

/** Subtabs onder Profiel → Engine (geen site-instellingen). */
export type ProfileEngineTabId = "identity" | "behavior" | "modes" | "strategy" | "play";

const ENGINE_TABS = new Set<ProfileEngineTabId>(["identity", "behavior", "modes", "strategy", "play"]);

export function parseProfileMainView(raw: string | undefined | null): ProfileMainView {
  if (raw === "engine") return "engine";
  if (raw === "insights") return "insights";
  if (raw === "special" || raw === "games") return "special";
  return "home";
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

/** Insights-tab onder Profiel (`view=insights`). */
export function profileInsightsHref(insightsTab: string, weekStart?: string | null | undefined): string {
  const p = new URLSearchParams();
  p.set("view", "insights");
  p.set("tab", insightsTab);
  if (weekStart) p.set("weekStart", weekStart);
  return `/profile?${p.toString()}`;
}

/** Profiel → Special events (quests + platform-events + banner-games). */
export function profileSpecialEventsHref(): string {
  const p = new URLSearchParams();
  p.set("view", "special");
  return `/profile?${p.toString()}`;
}

/** Alias: links naar analytics/insights (Profiel → Insights). */
export function reportInsightsHref(insightsTab: string, weekStart?: string | null | undefined): string {
  return profileInsightsHref(insightsTab, weekStart);
}
