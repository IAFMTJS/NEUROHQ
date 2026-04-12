"use client";

import { toast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";
import { playUiSound } from "@/lib/audio/ui-sounds";
import type { PlatformLootRewardLine, PlatformLootToastModel } from "@/lib/platform-reward-celebration";

const QUEST_LOOT_TOAST_ID = "nhq-platform-quest-loot";
const GAME_LOOT_TOAST_ID = "nhq-platform-game-loot";
const QUEST_CLEARED_TOAST_ID = "nhq-platform-quest-cleared";
const GAME_STAGE_TOAST_ID = "nhq-platform-game-stage";

function toneClass(tone: PlatformLootRewardLine["tone"]): string {
  switch (tone) {
    case "xp":
      return "border-amber-400/35 bg-amber-500/10 text-amber-50/95";
    case "flex":
      return "border-emerald-400/35 bg-emerald-500/10 text-emerald-50/95";
    case "badge":
      return "border-violet-400/40 bg-violet-500/15 text-violet-50/95";
    case "warn":
      return "border-amber-600/40 bg-amber-950/35 text-amber-100/90";
    default:
      return "border-white/15 bg-white/[0.06] text-[var(--text-primary)]";
  }
}

function shellClass(variant: PlatformLootToastModel["variant"]): string {
  if (variant === "quest") {
    return "border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-950/90 via-[var(--bg-elevated)] to-violet-950/50 shadow-[0_0_36px_rgba(192,38,211,0.2)]";
  }
  return "border-cyan-400/30 bg-gradient-to-br from-cyan-950/88 via-[var(--bg-elevated)] to-indigo-950/45 shadow-[0_0_36px_rgba(34,211,238,0.16)]";
}

/** Rijke toast na quest-claim: titel, subregels, loot-chips. */
export function showQuestLootClaimToast(model: PlatformLootToastModel, duration = 12_000): void {
  playUiSound("success");
  toast.dismiss(QUEST_LOOT_TOAST_ID);
  toast.custom(
    (tid) => (
      <div
        className={`pointer-events-auto flex w-[min(100vw-2rem,24rem)] gap-3 rounded-2xl border p-4 ${shellClass("quest")}`}
        data-nhq-platform-loot="quest"
      >
        <span className="shrink-0 self-start pt-0.5 text-2xl leading-none" aria-hidden>
          🎁
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/80">Quest · loot</p>
          <p className="mt-1 text-[15px] font-bold tracking-tight text-fuchsia-50">{model.headline}</p>
          {model.subhead ? <p className="mt-1 text-xs leading-snug text-fuchsia-100/75">{model.subhead}</p> : null}
          <ul className="mt-3 space-y-2">
            {model.lines.map((line, i) => (
              <li
                key={i}
                className={`flex gap-2 rounded-xl border px-2.5 py-2 text-left text-xs leading-snug ${toneClass(line.tone)}`}
              >
                <span className="shrink-0 text-base leading-none" aria-hidden>
                  {line.icon}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold">{line.label}</span>
                  {line.detail ? <span className="mt-0.5 block text-[11px] opacity-90">{line.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-fuchsia-100/70 hover:bg-white/10 hover:text-fuchsia-50"
          aria-label="Sluiten"
          onClick={() => toast.dismiss(tid)}
        >
          ×
        </button>
      </div>
    ),
    { id: QUEST_LOOT_TOAST_ID, duration, dismissible: true }
  );
}

/** Rijke toast na platform-game claim. */
export function showGameLootClaimToast(model: PlatformLootToastModel, duration = 12_000): void {
  playUiSound("success");
  toast.dismiss(GAME_LOOT_TOAST_ID);
  toast.custom(
    (tid) => (
      <div
        className={`pointer-events-auto flex w-[min(100vw-2rem,24rem)] gap-3 rounded-2xl border p-4 ${shellClass("game")}`}
        data-nhq-platform-loot="game"
      >
        <span className="shrink-0 self-start pt-0.5 text-2xl leading-none" aria-hidden>
          🎮
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">Challenge · beloning</p>
          <p className="mt-1 text-[15px] font-bold tracking-tight text-cyan-50">{model.headline}</p>
          {model.subhead ? <p className="mt-1 text-xs leading-snug text-cyan-100/75">{model.subhead}</p> : null}
          <ul className="mt-3 space-y-2">
            {model.lines.map((line, i) => (
              <li
                key={i}
                className={`flex gap-2 rounded-xl border px-2.5 py-2 text-left text-xs leading-snug ${toneClass(line.tone)}`}
              >
                <span className="shrink-0 text-base leading-none" aria-hidden>
                  {line.icon}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold">{line.label}</span>
                  {line.detail ? <span className="mt-0.5 block text-[11px] opacity-90">{line.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-cyan-100/70 hover:bg-white/10 hover:text-cyan-50"
          aria-label="Sluiten"
          onClick={() => toast.dismiss(tid)}
        >
          ×
        </button>
      </div>
    ),
    { id: GAME_LOOT_TOAST_ID, duration, dismissible: true }
  );
}

/** Quest volledig af — nog loot claimen (modal / flow). */
export function showQuestClearedPendingLootToast(duration = 8_000): void {
  playUiSound("success");
  toast.dismiss(QUEST_CLEARED_TOAST_ID);
  toast.custom(
    (tid) => (
      <div
        className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] gap-3 rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-950/92 via-[var(--bg-elevated)] to-fuchsia-950/40 p-4 shadow-[0_0_28px_rgba(139,92,246,0.22)]"
        data-nhq-platform-loot="quest-cleared"
      >
        <span className="shrink-0 self-start pt-0.5">
          <NeuroToastIcon variant="success" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/85">Objective complete</p>
          <p className="mt-1 text-[15px] font-bold text-violet-50">Quest uitgespeeld</p>
          <p className="mt-1.5 text-sm leading-snug text-violet-100/85">
            Haal je loot op: tik op <span className="font-semibold text-amber-200/95">Beloning claimen</span> op je Events-tab of in dit venster.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-violet-100/70 hover:bg-white/10"
          aria-label="Sluiten"
          onClick={() => toast.dismiss(tid)}
        >
          ×
        </button>
      </div>
    ),
    { id: QUEST_CLEARED_TOAST_ID, duration, dismissible: true }
  );
}

/** Juiste antwoord in platform-game; wijst naar claim. */
export function showGameStageClearedToast(winMessage: string | null | undefined, duration = 7_000): void {
  playUiSound("success");
  toast.dismiss(GAME_STAGE_TOAST_ID);
  const body = (winMessage ?? "Code geaccepteerd.").trim();
  toast.custom(
    (tid) => (
      <div
        className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] gap-3 rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-950/88 via-[var(--bg-elevated)] to-cyan-950/35 p-4 shadow-[0_0_28px_rgba(52,211,153,0.18)]"
        data-nhq-platform-loot="game-stage"
      >
        <span className="shrink-0 self-start pt-0.5 text-2xl" aria-hidden>
          ✦
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/85">Checkpoint gehaald</p>
          <p className="mt-1 text-[15px] font-bold text-emerald-50">Challenge doorbroken</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-emerald-100/88">{body}</p>
          <p className="mt-2 text-[11px] font-medium text-emerald-200/75">Volgende stap: claim je loot hieronder.</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-emerald-100/70 hover:bg-white/10"
          aria-label="Sluiten"
          onClick={() => toast.dismiss(tid)}
        >
          ×
        </button>
      </div>
    ),
    { id: GAME_STAGE_TOAST_ID, duration, dismissible: true }
  );
}
