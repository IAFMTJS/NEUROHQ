import type { Json } from "@/types/database.types";
import { answerMatchesAccepts, normalizeQuestAnswer } from "@/lib/quests/engine";
import {
  parseAutoRulesFromConfig,
  type PlatformGameAutoRuleParsed,
  type RuleEvalResult,
} from "@/lib/platform-games-metrics-eval";

export type PlatformGameProgressSpec = {
  mode: "none" | "checklist" | "answer" | "auto";
  checklist: { id: string; label: string }[];
  /** Alleen server-side (zit in DB-config, nooit naar client). */
  accepts: string[];
  prompt: string | null;
  answerPlaceholder: string | null;
  winMessage: string | null;
  rewardXp: number;
  /** Automatische meting o.b.v. site-data (taken, learning, …). */
  autoWinLogic: "all" | "any";
  autoRules: PlatformGameAutoRuleParsed[];
};

const EMPTY: PlatformGameProgressSpec = {
  mode: "none",
  checklist: [],
  accepts: [],
  prompt: null,
  answerPlaceholder: null,
  winMessage: null,
  rewardXp: 0,
  autoWinLogic: "all",
  autoRules: [],
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

/** `progress: { ... }` in config, anders plat op root voor backwards compatibility. */
function progressSection(config: Record<string, unknown>): Record<string, unknown> {
  const nested = asRecord(config.progress);
  if (nested) return nested;
  return config;
}

export function parsePlatformGameProgressSpec(config: Json | null | undefined): PlatformGameProgressSpec {
  const root = asRecord(config);
  if (!root) return { ...EMPTY };

  const prog = progressSection(root);
  const modeRaw =
    typeof prog.mode === "string"
      ? prog.mode
      : typeof root.progressMode === "string"
        ? root.progressMode
        : "none";

  let mode: PlatformGameProgressSpec["mode"] = "none";
  if (modeRaw === "checklist" || modeRaw === "answer" || modeRaw === "auto") mode = modeRaw;

  const checklist: { id: string; label: string }[] = [];
  const checklistRaw = prog.checklist;
  if (Array.isArray(checklistRaw)) {
    for (const it of checklistRaw) {
      const o = asRecord(it);
      if (!o) continue;
      const id = typeof o.id === "string" ? o.id.trim() : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (id && label) checklist.push({ id, label });
    }
  }

  const accepts: string[] = [];
  const acc = prog.accepts ?? root.accepts;
  if (Array.isArray(acc)) {
    for (const a of acc) {
      if (typeof a === "string" && a.trim()) accepts.push(a.trim());
    }
  }

  const { winLogic: autoWinLogic, rules: autoRules } = parseAutoRulesFromConfig(prog);
  if (mode === "auto" && autoRules.length === 0) mode = "none";

  if (mode === "checklist" && checklist.length === 0) mode = "none";
  if (mode === "answer" && accepts.length === 0) mode = "none";

  const prompt = typeof prog.prompt === "string" ? prog.prompt : null;
  const answerPlaceholder =
    typeof prog.answerPlaceholder === "string"
      ? prog.answerPlaceholder
      : typeof prog.placeholder === "string"
        ? prog.placeholder
        : null;
  const winMessage = typeof prog.winMessage === "string" ? prog.winMessage : null;

  let rewardXp = 0;
  if (typeof prog.rewardXp === "number" && Number.isFinite(prog.rewardXp) && prog.rewardXp > 0) {
    rewardXp = Math.min(1_000_000, Math.round(prog.rewardXp));
  }
  if (rewardXp === 0 && typeof root.rewardXp === "number" && Number.isFinite(root.rewardXp) && root.rewardXp > 0) {
    rewardXp = Math.min(1_000_000, Math.round(root.rewardXp));
  }

  return { mode, checklist, accepts, prompt, answerPlaceholder, winMessage, rewardXp, autoWinLogic, autoRules };
}

/** Verwijdert geheime velden voor API / profiel payload. */
export function publicPlatformGameConfig(config: Json): Json {
  if (config == null || typeof config !== "object" || Array.isArray(config)) return config;
  try {
    const raw = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
    delete raw.accepts;
    const pr = asRecord(raw.progress);
    if (pr) {
      delete pr.accepts;
      raw.progress = pr as unknown as Json;
    }
    return raw as Json;
  } catch {
    return config;
  }
}

export type PlatformGameStateShape = {
  checklist?: Record<string, boolean>;
};

export function parseProgressState(raw: Json | null | undefined): PlatformGameStateShape {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const c = o.checklist;
  const checklist: Record<string, boolean> = {};
  if (c && typeof c === "object" && !Array.isArray(c)) {
    for (const [k, v] of Object.entries(c as Record<string, unknown>)) {
      if (typeof v === "boolean") checklist[k] = v;
    }
  }
  return Object.keys(checklist).length ? { checklist } : {};
}

export function checklistWin(spec: PlatformGameProgressSpec, checklist: Record<string, boolean> | undefined): boolean {
  if (spec.mode !== "checklist" || spec.checklist.length === 0) return false;
  return spec.checklist.every((item) => checklist?.[item.id] === true);
}

export function answerWin(spec: PlatformGameProgressSpec, rawAnswer: string): boolean {
  if (spec.mode !== "answer" || spec.accepts.length === 0) return false;
  const trimmed = rawAnswer.trim();
  if (!trimmed) return false;
  return answerMatchesAccepts(normalizeQuestAnswer(trimmed), spec.accepts);
}

/** Publieke weergave van auto-evaluatie (server vult dit in). */
export type PlatformGameAutoPublic = {
  winLogic: "all" | "any";
  rules: RuleEvalResult[];
  satisfied: boolean;
};
