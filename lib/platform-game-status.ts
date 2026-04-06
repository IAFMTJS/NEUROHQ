import type { ProfileSpecialGameRow } from "@/app/actions/profile-special-events";

export type PlatformGameStatusTone = "done" | "progress" | "neutral";

export function getPlatformGameStatusSummary(game: ProfileSpecialGameRow): {
  label: string;
  tone: PlatformGameStatusTone;
} {
  if (game.completedAt) return { label: "Voltooid", tone: "done" };
  const { interaction: i } = game;
  if (i.mode === "auto" && i.auto?.rules?.length) {
    const ok = i.auto.rules.filter((r) => r.satisfied).length;
    const n = i.auto.rules.length;
    return {
      label: `${ok}/${n} voorwaarden`,
      tone: i.auto.satisfied ? "done" : "progress",
    };
  }
  if (i.mode === "checklist" && i.checklist.length > 0) {
    const done = i.checklist.filter((x) => game.checklistState[x.id] === true).length;
    return {
      label: `${done}/${i.checklist.length} stappen`,
      tone: done >= i.checklist.length ? "done" : "progress",
    };
  }
  if (i.mode === "answer") return { label: "Antwoord invullen", tone: "progress" };
  return { label: "Actieve challenge", tone: "neutral" };
}

export function platformGameStatusBadgeClass(tone: PlatformGameStatusTone): string {
  if (tone === "done") return "bg-emerald-500/20 text-emerald-100 ring-emerald-400/35";
  if (tone === "progress") return "bg-amber-500/15 text-amber-100 ring-amber-400/30";
  return "bg-white/10 text-white/85 ring-white/15";
}
