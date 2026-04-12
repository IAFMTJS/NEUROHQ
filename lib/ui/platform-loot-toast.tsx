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
      return "border-amber-400/45 bg-gradient-to-br from-amber-500/30 to-amber-950/55 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-amber-400/25";
    case "flex":
      return "border-emerald-400/45 bg-gradient-to-br from-emerald-500/28 to-emerald-950/55 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-emerald-400/25";
    case "badge":
      return "border-violet-400/45 bg-gradient-to-br from-violet-500/35 to-violet-950/55 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-violet-400/30";
    case "warn":
      return "border-amber-500/45 bg-gradient-to-br from-amber-600/28 to-amber-950/55 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-amber-500/25";
    default:
      return "border-white/20 bg-gradient-to-br from-white/12 to-black/40 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/15";
  }
}

function LootRewardRows({ lines, questBoard }: { lines: PlatformLootRewardLine[]; questBoard?: boolean }) {
  return (
    <ul className={`space-y-2.5 ${questBoard ? "mt-3 border-t border-white/10 pt-3" : "mt-3.5"}`}>
      {lines.map((line, i) => (
        <li
          key={i}
          className={`flex gap-3 rounded-xl border px-3 py-2.5 text-left ${toneClass(line.tone)} ${questBoard ? "pl-3" : ""}`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none ${
              questBoard ? "bg-black/35 ring-1 ring-white/12" : "bg-black/25 ring-1 ring-white/15"
            }`}
            aria-hidden
          >
            {line.icon}
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="text-sm font-bold tracking-tight">{line.label}</span>
            {line.detail ? (
              <span className="mt-1 block text-xs font-medium leading-snug text-white/78">{line.detail}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Zelfde familie als Profiel → Events hoofdquest + quest-log. */
const QUEST_BOARD_OUTER =
  "relative overflow-hidden rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-950/96 via-violet-950/90 to-[#14081f]/95 p-4 pr-2.5 shadow-[0_0_0_1px_rgba(129,140,248,0.18),0_0_36px_rgba(99,102,241,0.32),0_14px_36px_rgba(0,0,0,0.5)] ring-1 ring-indigo-500/20";

const QUEST_BOARD_TOPBAR = "from-transparent via-indigo-400/85 to-transparent";

const QUEST_BOARD_GLOW_RIGHT = "bg-indigo-500/22";

const QUEST_ICON_WRAP =
  "flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/45 to-violet-900/65 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_24px_rgba(129,140,248,0.35)] ring-2 ring-indigo-400/45";

type LootClaimVisual = "quest" | "game";

function lootClaimShellClasses(v: LootClaimVisual): { outer: string; topBar: string; kicker: string; headline: string; sub: string; iconWrap: string; close: string; glow: string } {
  if (v === "quest") {
    return {
      outer: `${QUEST_BOARD_OUTER} flex gap-3`,
      topBar: QUEST_BOARD_TOPBAR,
      kicker: "text-indigo-200/95",
      headline:
        "text-xl font-black tracking-tight text-white drop-shadow-[0_2px_14px_rgba(129,140,248,0.4)]",
      sub: "text-[13px] font-medium leading-snug text-violet-100/88",
      iconWrap: QUEST_ICON_WRAP,
      close: "text-indigo-200/90 hover:bg-indigo-500/30 hover:text-white",
      glow: QUEST_BOARD_GLOW_RIGHT,
    };
  }
  return {
    outer:
      "pointer-events-auto relative flex w-[min(100vw-2rem,26rem)] gap-3 overflow-hidden rounded-2xl border border-cyan-400/45 bg-gradient-to-br from-cyan-950/96 via-[#0a1628]/95 to-indigo-950/90 p-4 pr-2.5 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_0_40px_rgba(34,211,238,0.32),0_14px_36px_rgba(0,0,0,0.5)] ring-1 ring-cyan-400/22",
    topBar: "from-transparent via-cyan-400/85 to-transparent",
    kicker: "text-cyan-200",
    headline: "text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(34,211,238,0.4)]",
    sub: "text-[13px] font-medium leading-snug text-cyan-100/88",
    iconWrap:
      "flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/45 to-indigo-900/70 text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_24px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/45",
    close: "text-cyan-100/85 hover:bg-cyan-500/25 hover:text-white",
    glow: "bg-cyan-400/14",
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
    <div className={`pointer-events-auto w-[min(100vw-2rem,26rem)] ${s.outer}`} data-nhq-platform-loot={dataAttr}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r ${s.topBar}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full ${s.glow} blur-3xl`}
        aria-hidden
      />
      <span className={`relative shrink-0 self-start pt-0.5 ${s.iconWrap}`} aria-hidden>
        {emoji}
      </span>
      <div className="relative min-w-0 flex-1 pt-0.5">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.kicker}`}>{kickerText}</p>
        <p className={`mt-1 ${s.headline}`}>{model.headline}</p>
        {model.subhead ? (
          <p
            className={`mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 leading-snug ${s.sub}`}
          >
            {model.subhead}
          </p>
        ) : null}
        <LootRewardRows lines={model.lines} questBoard={visual === "quest"} />
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
        kickerText="Quest · beloning"
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

const MILESTONE_ICON_FINALE =
  "flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/35 via-violet-800/50 to-sky-600/35 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_26px_rgba(244,63,94,0.22)] ring-2 ring-rose-400/35";

const MILESTONE_ICON_XP =
  "flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/42 to-violet-900/60 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_26px_rgba(52,211,153,0.28)] ring-2 ring-emerald-400/40";

/** Questmijlpaal — zelfde visuele taal als Profiel → Events + quest-beloningtoast. */
export function showQuestClearedPendingLootToast(options: QuestPendingLootToastOptions = {}): void {
  const duration = options.duration ?? 10_000;
  const { awaitingFinaleChoice, afterFinaleChoice } = options;

  let kicker = "Mijlpaal";
  let title = "Quest uitgespeeld";
  let body: ReactNode = (
    <>
      Haal je loot op: tik op{" "}
      <span className="font-bold text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">Beloning claimen</span> op{" "}
      <span className="font-semibold text-indigo-100/95">Profiel → Events</span> of in dit venster.
    </>
  );

  let iconSlot: ReactNode = (
    <span className={QUEST_ICON_WRAP} aria-hidden>
      <NeuroToastIcon variant="success" />
    </span>
  );

  if (awaitingFinaleChoice) {
    kicker = "Quest-log compleet";
    title = "Finale keuze";
    body = (
      <>
        Alle puzzels zijn opgelost. Kies <span className="font-bold text-rose-200">HELPEN</span> of{" "}
        <span className="font-bold text-sky-200">STOPPEN</span> in de quest — of open{" "}
        <span className="font-semibold text-indigo-100">Quest openen · keuze</span> op Events. Daarna: gevolgen, slot, en flex
        / badge claimen.
      </>
    );
    iconSlot = (
      <span className={`relative ${MILESTONE_ICON_FINALE}`} aria-hidden>
        ⚖️
      </span>
    );
  } else if (afterFinaleChoice) {
    kicker = "Keuze vastgelegd";
    title = "Story-XP binnen";
    body = (
      <>
        Vervolg en slot staan in de quest. Story-XP is toegepast (zonder bedrag in de UI). Tik{" "}
        <span className="font-bold text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">Beloning claimen</span> voor
        flex en badge — Events of hier.
      </>
    );
    iconSlot = (
      <span className={`relative ${MILESTONE_ICON_XP}`} aria-hidden>
        ✨
      </span>
    );
  }

  playUiSound("success");
  toast.dismiss(QUEST_CLEARED_TOAST_ID);
  toast.custom(
    (tid) => (
      <div
        className={`pointer-events-auto flex w-[min(100vw-2rem,26rem)] gap-3 ${QUEST_BOARD_OUTER}`}
        data-nhq-platform-loot="quest-cleared"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r ${QUEST_BOARD_TOPBAR}`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full ${QUEST_BOARD_GLOW_RIGHT} blur-3xl`}
          aria-hidden
        />
        <span className="relative shrink-0 self-start pt-0.5">{iconSlot}</span>
        <div className="relative min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/95">{kicker}</p>
          <p className="mt-1 text-xl font-black tracking-tight text-white drop-shadow-[0_2px_14px_rgba(129,140,248,0.38)]">
            {title}
          </p>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] font-medium leading-relaxed text-violet-100/90">
            {body}
          </div>
          <div className="mt-2.5 rounded-xl border border-violet-400/25 bg-violet-950/35 px-3 py-2 ring-1 ring-violet-500/15">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-300/85">Quest-log</p>
            <p className="mt-1 text-[11px] leading-snug text-violet-100/78">
              Volledige vraagteksten en antwoorden staan onderaan in de quest en in het uitklapbare{" "}
              <span className="font-semibold text-indigo-100/95">Jouw vragen en antwoorden</span> op{" "}
              <span className="font-semibold text-indigo-100/95">Profiel → Events</span> — niet in deze toast.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="relative shrink-0 rounded-xl px-2.5 py-1 text-xl font-light leading-none text-indigo-200/90 transition hover:bg-indigo-500/30 hover:text-white"
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
