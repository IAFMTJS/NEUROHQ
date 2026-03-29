/**
 * Panel chrome recipes for Visual Lab — aligned with production shells:
 * Strategy analyse / Growth command, Budget insight hub, toast stacks, etc.
 */

export type VisualLabUiBackdropId =
  | "strategyAnalysis"
  | "insightHub"
  | "toastDeep"
  | "budgetEmerald"
  | "minimalGlass"
  | "sandboxLegacy";

export type VisualLabUiBackdropPreset = {
  id: VisualLabUiBackdropId;
  /** Short label in the picker */
  label: string;
  /** Where this matches in the app */
  source: string;
  /** Outer classes (border, fill, shadow) — no padding */
  shell: string;
  /** Optional top glow; omit layer when null */
  radialClass: string | null;
};

/** Strategy / analyse panels — comparable weight to Missies command deck (deck shell: globals `tasks-command-deck`). */
const STRATEGY_ANALYSIS_SHELL =
  "relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_40px_rgba(var(--mode-rgb),0.14),inset_0_1px_0_rgba(255,255,255,0.07)]";

const STRATEGY_ANALYSIS_RADIAL =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.16),transparent_58%),radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.1),transparent_55%)]";

export const VISUAL_LAB_UI_BACKDROP_ORDER: VisualLabUiBackdropId[] = [
  "strategyAnalysis",
  "insightHub",
  "toastDeep",
  "budgetEmerald",
  "minimalGlass",
  "sandboxLegacy",
];

export const VISUAL_LAB_UI_BACKDROP_PRESETS: Record<VisualLabUiBackdropId, VisualLabUiBackdropPreset> = {
  strategyAnalysis: {
    id: "strategyAnalysis",
    label: "Strategy · Analyse",
    source: "StrategyAnalysisSquare",
    shell: STRATEGY_ANALYSIS_SHELL,
    radialClass: STRATEGY_ANALYSIS_RADIAL,
  },
  insightHub: {
    id: "insightHub",
    label: "Budget · Inzicht-hub",
    source: "BudgetInsightHub",
    shell:
      "relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.09)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.2)] via-[var(--bg-elevated)]/10 to-[var(--bg-primary)]/26 shadow-[0_12px_48px_rgba(0,0,0,0.32),0_0_24px_rgba(var(--mode-rgb),0.05)] backdrop-blur-xl",
    radialClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.1),transparent_52%)]",
  },
  toastDeep: {
    id: "toastDeep",
    label: "Toast · Diepte",
    source: "BudgetInsightHub toast shell",
    shell:
      "relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md",
    radialClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_5%,rgba(var(--mode-rgb),0.11),transparent_50%)]",
  },
  budgetEmerald: {
    id: "budgetEmerald",
    label: "Budget · Emerald",
    source: "RemainingBudgetHero modals / groene accent",
    shell:
      "relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-[linear-gradient(165deg,rgba(6,24,20,0.97),rgba(15,23,42,0.98))] shadow-[0_0_36px_rgba(16,185,129,0.12),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md",
    radialClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_0%,rgba(52,211,153,0.11),transparent_55%)]",
  },
  minimalGlass: {
    id: "minimalGlass",
    label: "Flat glas",
    source: "Light lab panels",
    shell:
      "relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.14)] bg-[var(--bg-elevated)]/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm",
    radialClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_12%,rgba(var(--mode-rgb),0.06),transparent_58%)]",
  },
  sandboxLegacy: {
    id: "sandboxLegacy",
    label: "Lab (legacy)",
    source: "Oude Visual Lab-panel",
    shell:
      "relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/95 to-[rgba(var(--mode-rgb-deep),0.12)] shadow-[var(--hud-elevation-panel),0_0_40px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)]",
    radialClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.16),transparent_55%)]",
  },
};
