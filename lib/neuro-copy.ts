import type { NeuroProfileTagId } from "@/lib/neuro-profile";

/** Short lines for missions “next move” / command center when tags are set (non-clinical). */
export function neuroNextMoveHint(tags: NeuroProfileTagId[]): string | null {
  if (!tags.length) return null;
  if (tags.includes("adhd") || tags.includes("add")) {
    return "Kleine, concrete stappen werken vaak beter dan een grote push.";
  }
  if (tags.includes("autism")) {
    return "Voorspelbare volgorde en rust tussen taken helpen je focus vast te houden.";
  }
  if (tags.includes("odd")) {
    return "Kies waar mogelijk zelf je volgende stap — dat verlaagt weerstand.";
  }
  if (tags.includes("audhd")) {
    return "Mix korte blokken met vaste ankers in je dag (zelfde plek/tijd).";
  }
  return null;
}

/** Extra regel onder weekly focus budget (strategy tab). */
export function neuroStrategyBudgetHint(tags: NeuroProfileTagId[]): string | null {
  if (!tags.length) return null;
  if (tags.includes("adhd") || tags.includes("add")) {
    return "Als je allocatie vaak verschuift: dat is oké — alignment hieronder laat zien waar je naartoe groeit.";
  }
  if (tags.includes("autism")) {
    return "Vaste verhoudingen tussen domeinen kunnen rust geven; check alignment of je ze nog wilt.";
  }
  return null;
}
