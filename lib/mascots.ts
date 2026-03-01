/**
 * Mascot assets: one per page. Files in "New styling idea" are named after the pages.
 * Copy that folder into public/mascots/ – see docs/MASCOT_AND_ENGINE_SPEC.md
 *
 * State variants: mascot can react to brain status / momentum per page (e.g. xp-stable, xp-driven, xp-lowenergy).
 * Optional state is passed to getMascotSrcForPage; when no variant file exists we fall back to the default page image.
 */

export type DashboardPage =
  | "dashboard"
  | "login"
  | "tasks"
  | "learning"
  | "assistant"
  | "analytics"
  | "report"
  | "budget"
  | "strategy"
  | "settings"
  | "xp";

/** Page name (route segment) → mascot filename in "New styling idea" */
export const MASCOT_FILE_BY_PAGE: Record<DashboardPage, string> = {
  dashboard: "Homepage Mascotte.png",
  login: "Homepage Mascotte.png",
  tasks: "Mission page.png",
  learning: "Growth page.png",
  assistant: "page.png",
  analytics: "page.png",
  report: "page.png",
  budget: "Budget page.png",
  strategy: "Strategy page.png",
  settings: "Settings page.png",
  xp: "XP page.png",
};

/** State variants for XP page: maps brain mode / momentum to mascot variant. */
export type XPMascotState = "stable" | "driven" | "lowenergy";

/**
 * Optional state-variant filenames per page. When (page, state) is present we use this file;
 * otherwise we fall back to MASCOT_FILE_BY_PAGE[page]. Add files to public/mascots/ when you have assets.
 * Until variant PNGs exist, comment out the page entry here to fall back to the default page image.
 */
export const MASCOT_STATE_FILE: Partial<Record<DashboardPage, Record<string, string>>> = {
  xp: {
    stable: "XP page - stable.png",
    driven: "XP page - driven.png",
    lowenergy: "XP page - lowenergy.png",
  },
  // Later: dashboard, tasks: { stable, driven, lowenergy }
};

const MASCOTS_BASE = "/mascots";

/** Returns the public URL for a page’s mascot (e.g. /mascots/Budget%20page.png). */
/** Bump this when you edit a mascot image so the browser loads the new file. */
const MASCOT_CACHE_VERSION = 2;

/**
 * Returns the public URL for a page's mascot. Optionally pass a state (e.g. "stable" | "driven" | "lowenergy" for XP)
 * to use a state variant when available; otherwise uses the default page image.
 */
export function getMascotSrcForPage(
  page: DashboardPage,
  state?: XPMascotState | string
): string {
  const stateMap = state ? MASCOT_STATE_FILE[page] : undefined;
  const stateFile = state && stateMap?.[state];
  const file = stateFile ?? MASCOT_FILE_BY_PAGE[page];
  return `${MASCOTS_BASE}/${encodeURIComponent(file)}?v=${MASCOT_CACHE_VERSION}`;
}

/**
 * Derives XP mascot state from brain mode for getMascotSrcForPage("xp", state).
 * Cautious maps to stable. Use when the mascot should reflect current brain status on the XP page.
 */
export function getXPMascotState(brainModeLabel: "Stable" | "Driven" | "Cautious" | "LowEnergy"): XPMascotState {
  if (brainModeLabel === "LowEnergy") return "lowenergy";
  if (brainModeLabel === "Driven") return "driven";
  return "stable";
}

/** Parses pathname (e.g. /dashboard, /login, /tasks) to page; returns "dashboard" for unknown. */
export function pageFromPathname(pathname: string): DashboardPage {
  const segment = pathname.replace(/^\//, "").split("/")[0] || "dashboard";
  if (segment in MASCOT_FILE_BY_PAGE) return segment as DashboardPage;
  return "dashboard";
}

/** HeroMascotVariant (UI label) → DashboardPage (route). Used by HeroMascotImage. */
export const MASCOT_VARIANT_TO_PAGE: Record<
  "homepage" | "missions" | "assistant" | "analytics" | "budget" | "report" | "growth" | "strategy" | "settings" | "xp",
  DashboardPage
> = {
  homepage: "dashboard",
  missions: "tasks",
  assistant: "assistant",
  analytics: "analytics",
  budget: "budget",
  report: "report",
  growth: "learning",
  strategy: "strategy",
  settings: "settings",
  xp: "xp",
};
