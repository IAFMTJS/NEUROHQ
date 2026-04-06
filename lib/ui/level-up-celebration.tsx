"use client";

import { toast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";
import { playUiSound } from "@/lib/audio/ui-sounds";

export const LEVEL_UP_TOAST_ID = "neurohq-level-up";

/** Zelfde als level-up preset in `playUiSound` (voor backwards-compat imports). */
export function playLevelUpChime(): void {
  playUiSound("level_up");
}

export type LevelUpCelebrationOpts = {
  newLevel: number;
  rankPromotion?: boolean;
  newRank?: string;
  previousRank?: string;
};

/** Zichtbare level-up / rank promotion melding + geluid. Werkt alleen vanuit client components. */
export function showLevelUpCelebration(opts: LevelUpCelebrationOpts): void {
  playLevelUpChime();
  toast.dismiss(LEVEL_UP_TOAST_ID);

  const title =
    opts.rankPromotion && opts.newRank
      ? `Rank promotion · ${opts.newRank}`
      : `Level up · Level ${opts.newLevel}`;
  const description =
    opts.rankPromotion && opts.previousRank && opts.newRank
      ? `Van ${opts.previousRank} naar ${opts.newRank}.`
      : `Je bent nu level ${opts.newLevel}. Goed bezig.`;

  toast.custom(
    (tid) => (
      <div
        className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] gap-3 rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-950/95 via-[var(--bg-elevated)] to-violet-950/40 p-4 shadow-[0_0_32px_rgba(52,211,153,0.22)]"
        data-neurohq-level-up="true"
      >
        <span className="shrink-0 self-start pt-0.5">
          <NeuroToastIcon variant="success" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold tracking-tight text-emerald-50">{title}</p>
          <p className="mt-1.5 text-sm leading-snug text-emerald-50/85">{description}</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-emerald-100/70 hover:bg-white/10 hover:text-emerald-50"
          aria-label="Sluiten"
          onClick={() => toast.dismiss(tid)}
        >
          ×
        </button>
      </div>
    ),
    { id: LEVEL_UP_TOAST_ID, duration: 14_000, dismissible: true }
  );
}
