"use client";

import type { ReactNode } from "react";
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
      return "border-amber-300/55 bg-gradient-to-br from-amber-500/25 to-amber-950/40 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_14px_rgba(245,158,11,0.12)]";
    case "flex":
      return "border-emerald-300/50 bg-gradient-to-br from-emerald-500/25 to-emerald-950/40 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_14px_rgba(16,185,129,0.14)]";
    case "badge":
      return "border-violet-300/55 bg-gradient-to-br from-violet-500/30 to-violet-950/45 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_14px_rgba(139,92,246,0.2)]";
    case "warn":
      return "border-amber-500/50 bg-gradient-to-br from-amber-600/25 to-amber-950/50 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
    default:
      return "border-white/25 bg-gradient-to-br from-white/10 to-black/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]";
  }
}

function LootRewardRows({ lines }: { lines: PlatformLootRewardLine[] }) {
  return (
    <ul className="mt-3.5 space-y-2.5">
      {lines.map((line, i) => (
        <li
          key={i}
          className={`flex gap-3 rounded-xl border-2 px-3 py-2.5 text-left ${toneClass(line.tone)}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/25 text-lg leading-none ring-1 ring-white/15" aria-hidden>
            {line.icon}
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="text-sm font-bold tracking-tight">{line.label}</span>
            {line.detail ? <span className="mt-1 block text-xs font-medium leading-snug text-white/80">{line.detail}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

type LootClaimVisual = "quest" | "game";

function lootClaimShellClasses(v: LootClaimVisual): { outer: string; topBar: string; kicker: string; headline: string; sub: string; iconWrap: string; close: string } {
  if (v === "quest") {
    return {
      outer:
        "relative overflow-hidden rounded-3xl border-2 border-fuchsia-400/55 bg-gradient-to-br from-fuchsia-950/95 via-[#1a0a2e]/95 to-violet-950/90 p-4 pr-3 shadow-[0_0_0_1px_rgba(232,121,249,0.15),0_0_48px_rgba(217,70,239,0.42),0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-fuchsia-300/25",
      topBar: "from-transparent via-fuchsia-400 to-transparent opacity-90",
      kicker: "text-fuchsia-200",
      headline: "text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(232,121,249,0.45)]",
      sub: "text-sm font-medium text-fuchsia-100/90",
      iconWrap:
        "flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/50 to-violet-900/70 text-3xl shadow-[0_0_28px_rgba(232,121,249,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] ring-2 ring-fuchsia-300/60",
      close: "text-fuchsia-100/80 hover:bg-fuchsia-500/25 hover:text-white",
    };
  }
  return {
    outer:
      "relative overflow-hidden rounded-3xl border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-950/95 via-[#0a1628]/95 to-indigo-950/90 p-4 pr-3 shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_48px_rgba(34,211,238,0.35),0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-cyan-300/25",
    topBar: "from-transparent via-cyan-400 to-transparent opacity-90",
    kicker: "text-cyan-200",
    headline: "text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(34,211,238,0.4)]",
    sub: "text-sm font-medium text-cyan-100/90",
    iconWrap:
      "flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/45 to-indigo-900/70 text-3xl shadow-[0_0_28px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] ring-2 ring-cyan-300/55",
    close: "text-cyan-100/80 hover:bg-cyan-500/25 hover:text-white",
  };
}

function LootClaimToastFrame({
  visual,
  kickerText,
  emoji,
  model,
  toastId,
  dataAttr,
}: {
  visual: LootClaimVisual;
  kickerText: string;
  emoji: string;
  model: PlatformLootToastModel;
  toastId: string | number;
  dataAttr: string;
}) {
  const s = lootClaimShellClasses(visual);
  return (
    <div className={`pointer-events-auto flex w-[min(100vw-2rem,26rem)] gap-3 ${s.outer}`} data-nhq-platform-loot={dataAttr}>
      <div
        className={`pointer-events-none absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-gradient-to-r ${s.topBar}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl"
        aria-hidden
      />
      <span className={`relative shrink-0 self-start pt-1 ${s.iconWrap}`} aria-hidden>
        {emoji}
      </span>
      <div className="relative min-w-0 flex-1 pt-0.5">
        <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${s.kicker}`}>{kickerText}</p>
        <p className={`mt-1.5 ${s.headline}`}>{model.headline}</p>
        {model.subhead ? <p className={`mt-1.5 leading-snug ${s.sub}`}>{model.subhead}</p> : null}
        <LootRewardRows lines={model.lines} />
      </div>
      <button
        type="button"
        className={`relative shrink-0 rounded-xl px-2.5 py-1 text-xl font-light leading-none transition ${s.close}`}
        aria-label="Sluiten"
        onClick={() => toast.dismiss(toastId)}
      >
        ×
      </button>
    </div>
  );
}

/** Rijke toast na quest-claim: titel, subregels, loot-chips. */
export function showQuestLootClaimToast(model: PlatformLootToastModel, duration = 14_000): void {
  playUiSound("success");
  toast.dismiss(QUEST_LOOT_TOAST_ID);
  toast.custom(
    (tid) => (
      <LootClaimToastFrame
        visual="quest"
        kickerText="Quest · loot drop"
        emoji="🎁"
        model={model}
        toastId={tid}
        dataAttr="quest"
      />
    ),
    { id: QUEST_LOOT_TOAST_ID, duration, dismissible: true }
  );
}

/** Rijke toast na platform-game claim. */
export function showGameLootClaimToast(model: PlatformLootToastModel, duration = 14_000): void {
  playUiSound("success");
  toast.dismiss(GAME_LOOT_TOAST_ID);
  toast.custom(
    (tid) => (
      <LootClaimToastFrame
        visual="game"
        kickerText="Challenge · loot drop"
        emoji="🎮"
        model={model}
        toastId={tid}
        dataAttr="game"
      />
    ),
    { id: GAME_LOOT_TOAST_ID, duration, dismissible: true }
  );
}

export type QuestPendingLootToastOptions = {
  duration?: number;
  /** Puzzels af; finale HELPEN/STOPPEN staat nog open. */
  awaitingFinaleChoice?: boolean;
  /** Finale gekozen; story-XP is al toegekend — nog flex/badge claimen. */
  afterFinaleChoice?: boolean;
};

/** Questmijlpaal — uitleg wat de speler nog moet doen (puzzel klaar / keuze / claim). */
export function showQuestClearedPendingLootToast(options: QuestPendingLootToastOptions = {}): void {
  const duration = options.duration ?? 10_000;
  const { awaitingFinaleChoice, afterFinaleChoice } = options;

  let kicker = "Objective complete";
  let title = "Quest uitgespeeld";
  let body: ReactNode = (
    <>
      Haal je loot op: tik op{" "}
      <span className="font-bold text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">Beloning claimen</span> op je
      Events-tab of in dit venster.
    </>
  );

  if (awaitingFinaleChoice) {
    kicker = "Log compleet";
    title = "Finale keuze";
    body = (
      <>
        Alle puzzels zijn opgelost. Kies nu <span className="font-bold text-rose-200">HELPEN</span> of{" "}
        <span className="font-bold text-sky-200">STOPPEN</span> in de quest — hier of via{" "}
        <span className="font-bold text-violet-200">Quest openen</span> op je profiel (Events). Daarna volgt het verhaal (
        gevolgen + slot) en kun je flex/badge claimen.
      </>
    );
  } else if (afterFinaleChoice) {
    kicker = "Keuze vastgelegd";
    title = "Story-XP binnen";
    body = (
      <>
        Je keuze staat: het vervolg en het slot lees je in de quest. Story-XP is al toegepast (geen bedrag in de UI). Tik op{" "}
        <span className="font-bold text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">Beloning claimen</span> voor
        flex en badge op Events of in dit venster.
      </>
    );
  }

  playUiSound("success");
  toast.dismiss(QUEST_CLEARED_TOAST_ID);
  toast.custom(
    (tid) => (
      <div
        className="pointer-events-auto relative flex w-[min(100vw-2rem,26rem)] gap-3 overflow-hidden rounded-3xl border-2 border-violet-400/55 bg-gradient-to-br from-violet-950/95 via-[#16082a]/96 to-fuchsia-950/55 p-4 pr-3 shadow-[0_0_0_1px_rgba(167,139,250,0.2),0_0_52px_rgba(139,92,246,0.4),0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-violet-300/30"
        data-nhq-platform-loot="quest-cleared"
      >
        <div
          className="pointer-events-none absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-95"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl"
          aria-hidden
        />
        <span className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/45 to-fuchsia-900/50 shadow-[0_0_28px_rgba(167,139,250,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] ring-2 ring-violet-300/55">
          <NeuroToastIcon variant="success" />
        </span>
        <div className="relative min-w-0 flex-1 pt-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">{kicker}</p>
          <p className="mt-1.5 text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(167,139,250,0.4)]">
            {title}
          </p>
          <div className="mt-2 space-y-2.5">
            <p className="text-sm font-medium leading-relaxed text-violet-100/95">{body}</p>
            <p className="border-t border-violet-400/20 pt-2 text-[11px] leading-snug text-violet-200/75">
              <span className="font-semibold text-violet-100/90">Vragenlog: </span>
              eerdere vragen (incl. hints/tekst per dag) en jouw antwoorden staan onderaan in de quest, en hetzelfde overzicht
              op <span className="font-semibold text-violet-100/95">Profiel → Events</span>. Deze toast toont dat niet — daar is te
              weinig ruimte voor.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="relative shrink-0 rounded-xl px-2.5 py-1 text-xl font-light leading-none text-violet-100/85 transition hover:bg-violet-500/30 hover:text-white"
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
export function showGameStageClearedToast(winMessage: string | null | undefined, duration = 9_000): void {
  playUiSound("success");
  toast.dismiss(GAME_STAGE_TOAST_ID);
  const body = (winMessage ?? "Code geaccepteerd.").trim();
  toast.custom(
    (tid) => (
      <div
        className="pointer-events-auto relative flex w-[min(100vw-2rem,26rem)] gap-3 overflow-hidden rounded-3xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-950/95 via-[#052018]/96 to-cyan-950/50 p-4 pr-3 shadow-[0_0_0_1px_rgba(52,211,153,0.15),0_0_52px_rgba(52,211,153,0.35),0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-emerald-300/25"
        data-nhq-platform-loot="game-stage"
      >
        <div
          className="pointer-events-none absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-95"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl"
          aria-hidden
        />
        <span
          className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/45 to-cyan-900/55 text-2xl font-black text-emerald-100 shadow-[0_0_28px_rgba(52,211,153,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] ring-2 ring-emerald-300/55"
          aria-hidden
        >
          ✦
        </span>
        <div className="relative min-w-0 flex-1 pt-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Checkpoint gehaald</p>
          <p className="mt-1.5 text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(52,211,153,0.35)]">
            Challenge doorbroken
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-emerald-50/95">{body}</p>
          <p className="mt-2.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-100">
            Volgende stap: claim je loot hieronder.
          </p>
        </div>
        <button
          type="button"
          className="relative shrink-0 rounded-xl px-2.5 py-1 text-xl font-light leading-none text-emerald-100/85 transition hover:bg-emerald-500/25 hover:text-white"
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
