/**
 * Full-page shell examples for Visual Lab — pick one to compare background + container
 * before promoting styles to globals / layout.
 */

export type VisualLabPageShellId =
  | "flatGlassLegacy"
  | "commandStackCinematic"
  | "hubFlatDashboard"
  | "nebulaTokensOnly";

export type VisualLabPageShellPreset = {
  id: VisualLabPageShellId;
  /** Picker card title */
  label: string;
  /** One line for the picker */
  description: string;
  /** Where similar chrome exists today (if any) */
  matchesApp: string;
  /** Mini preview strip (Tailwind) */
  thumbClass: string;
};

export const VISUAL_LAB_PAGE_SHELL_ORDER: VisualLabPageShellId[] = [
  "flatGlassLegacy",
  "commandStackCinematic",
  "hubFlatDashboard",
  "nebulaTokensOnly",
];

export const VISUAL_LAB_PAGE_SHELL_PRESETS: Record<
  VisualLabPageShellId,
  VisualLabPageShellPreset
> = {
  flatGlassLegacy: {
    id: "flatGlassLegacy",
    label: "Flat glass (legacy)",
    description:
      "Frosted strip over body — geen dashboard-vignet, smalle kolom.",
    matchesApp: "Oud visual-lab · hub zonder cinematic",
    thumbClass:
      "bg-gradient-to-b from-slate-700/35 to-slate-950/90 backdrop-blur-[3px]",
  },
  commandStackCinematic: {
    id: "commandStackCinematic",
    label: "Command stack · cinematic",
    description:
      "PNG-base + HUD mist/sterren/grain + dashboard-page vignet + globals inner.",
    matchesApp: "Alleen vergelijken in lab (productie: hub shell)",
    thumbClass:
      "bg-gradient-to-br from-[rgba(8,26,42,0.95)] via-[rgba(12,24,40,0.92)] to-[rgba(4,10,18,0.98)]",
  },
  hubFlatDashboard: {
    id: "hubFlatDashboard",
    label: "Hub · flat + dashboard",
    description:
      "flatGlassPageRoot + container dashboard-page/cinematic + inner (geen starfield-lagen).",
    matchesApp: "Dashboard home, bootstrap, DashboardHubCommandShell",
    thumbClass:
      "bg-gradient-to-b from-slate-800/50 to-slate-950/95 [box-shadow:inset_0_0_0_1px_rgba(var(--mode-rgb),0.12)]",
  },
  nebulaTokensOnly: {
    id: "nebulaTokensOnly",
    label: "Nebula (tokens only)",
    description:
      "Alleen CSS-gradients (--cinematic-nebula + HUD-body), geen Background12.PNG.",
    matchesApp: "Concept / toekomstige body",
    thumbClass:
      "bg-[radial-gradient(ellipse_120%_80%_at_50%_20%,rgba(var(--mode-rgb),0.22),transparent_55%),linear-gradient(180deg,var(--hud-dark-1),var(--hud-dark-3))]",
  },
};
