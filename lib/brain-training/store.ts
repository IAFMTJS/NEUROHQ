import { getTodayKey, getYesterdayKey } from "@/lib/daily-date";
import { boardStringToCells, generateDailySudoku, toBoardString } from "@/lib/brain-training/sudoku";

const BRAIN_DB_NAME = "neurohq-brain-training";
const BRAIN_DB_VERSION = 1;
const BRAIN_STORE = "stateByUser";
export const BRAIN_QUEUE_UPDATED_EVENT = "neurohq-brain-queue-updated";

export const BRAIN_DAILY_CAP = 300;

const ACTIVITY_XP = {
  sudoku: 50,
  choice_rt: 30,
  stroop: 25,
  sequence_recall: 25,
  tile_merge: 30,
  word_scramble: 25,
} as const;

export type BrainActivityType = keyof typeof ACTIVITY_XP;

export type PendingXpItem = {
  id: string;
  xp: number;
  reason: string;
  createdAt: number;
};

export type BrainTrainingState = {
  id: string;
  userId: string;
  dailyKey: string;
  sudokuDone: boolean;
  choiceRtDone: boolean;
  stroopDone: boolean;
  sequenceRecallDone: boolean;
  tileMergeDone: boolean;
  wordScrambleDone: boolean;
  dailyCompletionAwarded: boolean;
  dailyXpEarned: number;
  streakCount: number;
  lastCompletionDate: string | null;
  localTotalXp: number;
  pendingXpQueue: PendingXpItem[];
  lastSyncAt: number | null;
  syncRetryCount: number;
  choiceRtBestMs: number | null;
  choiceRtLastAvgMs: number | null;
  choiceRtLastWrong: number | null;
  stroopBestScore: number | null;
  stroopLastScore: number | null;
  sequenceBestLevel: number | null;
  sequenceLastLevel: number | null;
  tileBestScore: number | null;
  tileLastScore: number | null;
  wordBestStreak: number | null;
  wordLastStreak: number | null;
  sudokuBoard: string;
};

export type BrainRewardResult = {
  state: BrainTrainingState;
  appliedXp: number;
  skippedReason: string | null;
  dailyCompletedNow: boolean;
};

type XpSyncResponse = {
  accepted_xp: number;
  total_xp: number;
  xp_today: number;
  server_date: string | null;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BRAIN_DB_NAME, BRAIN_DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("brain-idb-open-failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BRAIN_STORE)) {
        db.createObjectStore(BRAIN_STORE, { keyPath: "id" });
      }
    };
  });
}

async function getStateRaw(userId: string): Promise<BrainTrainingState | null> {
  const db = await openDB();
  try {
    return await new Promise<BrainTrainingState | null>((resolve, reject) => {
      const tx = db.transaction(BRAIN_STORE, "readonly");
      const req = tx.objectStore(BRAIN_STORE).get(userId);
      req.onsuccess = () => {
        const row = req.result as BrainTrainingState | undefined;
        resolve(row ?? null);
      };
      req.onerror = () => reject(req.error ?? new Error("brain-idb-get-failed"));
    });
  } finally {
    db.close();
  }
}

export async function putBrainState(state: BrainTrainingState): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BRAIN_STORE, "readwrite");
      tx.objectStore(BRAIN_STORE).put(state);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("brain-idb-put-failed"));
    });
  } finally {
    db.close();
  }
  if (typeof window !== "undefined") {
    const pendingXp = state.pendingXpQueue.reduce((sum, item) => sum + item.xp, 0);
    window.dispatchEvent(
      new CustomEvent(BRAIN_QUEUE_UPDATED_EVENT, {
        detail: { pendingXp },
      })
    );
  }
}

export async function getBrainPendingXpTotal(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDB();
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(BRAIN_STORE, "readonly");
      const req = tx.objectStore(BRAIN_STORE).getAll();
      req.onsuccess = () => {
        const rows = (req.result as BrainTrainingState[] | undefined) ?? [];
        const total = rows.reduce(
          (sum, row) => sum + row.pendingXpQueue.reduce((qSum, item) => qSum + item.xp, 0),
          0
        );
        resolve(Math.max(0, total));
      };
      req.onerror = () => reject(req.error ?? new Error("brain-idb-get-all-failed"));
    });
  } catch {
    return 0;
  } finally {
    db.close();
  }
}

function defaultBoard(userId: string, dailyKey: string): string {
  return toBoardString(generateDailySudoku(`${userId}:${dailyKey}:sudoku`).puzzle);
}

function normalizeForToday(state: BrainTrainingState, todayKey: string): BrainTrainingState {
  if (state.dailyKey === todayKey) return state;
  return {
    ...state,
    dailyKey: todayKey,
    sudokuDone: false,
    choiceRtDone: false,
    stroopDone: false,
    sequenceRecallDone: false,
    tileMergeDone: false,
    wordScrambleDone: false,
    dailyCompletionAwarded: false,
    dailyXpEarned: 0,
    sudokuBoard: defaultBoard(state.userId, todayKey),
    choiceRtLastAvgMs: null,
    choiceRtLastWrong: null,
    stroopLastScore: null,
    sequenceLastLevel: null,
    tileLastScore: null,
    wordLastStreak: null,
  };
}

export async function loadBrainState(userId: string, serverTotalXp: number): Promise<BrainTrainingState> {
  const todayKey = getTodayKey();
  const existing = await getStateRaw(userId);
  const base: BrainTrainingState =
    existing ??
    {
      id: userId,
      userId,
      dailyKey: todayKey,
      sudokuDone: false,
      choiceRtDone: false,
      stroopDone: false,
      sequenceRecallDone: false,
      tileMergeDone: false,
      wordScrambleDone: false,
      dailyCompletionAwarded: false,
      dailyXpEarned: 0,
      streakCount: 0,
      lastCompletionDate: null,
      localTotalXp: Math.max(0, Math.floor(serverTotalXp)),
      pendingXpQueue: [],
      lastSyncAt: null,
      syncRetryCount: 0,
      choiceRtBestMs: null,
      choiceRtLastAvgMs: null,
      choiceRtLastWrong: null,
      stroopBestScore: null,
      stroopLastScore: null,
      sequenceBestLevel: null,
      sequenceLastLevel: null,
      tileBestScore: null,
      tileLastScore: null,
      wordBestStreak: null,
      wordLastStreak: null,
      sudokuBoard: defaultBoard(userId, todayKey),
    };

  const normalized = normalizeForToday(base, todayKey);
  const ensured: BrainTrainingState = {
    ...normalized,
    choiceRtDone: normalized.choiceRtDone ?? false,
    stroopDone: normalized.stroopDone ?? false,
    sequenceRecallDone: normalized.sequenceRecallDone ?? false,
    tileMergeDone: normalized.tileMergeDone ?? false,
    wordScrambleDone: normalized.wordScrambleDone ?? false,
    choiceRtBestMs: normalized.choiceRtBestMs ?? null,
    choiceRtLastAvgMs: normalized.choiceRtLastAvgMs ?? null,
    choiceRtLastWrong: normalized.choiceRtLastWrong ?? null,
    stroopBestScore: normalized.stroopBestScore ?? null,
    stroopLastScore: normalized.stroopLastScore ?? null,
    sequenceBestLevel: normalized.sequenceBestLevel ?? null,
    sequenceLastLevel: normalized.sequenceLastLevel ?? null,
    tileBestScore: normalized.tileBestScore ?? null,
    tileLastScore: normalized.tileLastScore ?? null,
    wordBestStreak: normalized.wordBestStreak ?? null,
    wordLastStreak: normalized.wordLastStreak ?? null,
  };

  const upgraded: BrainTrainingState = {
    ...ensured,
    localTotalXp: Math.max(normalized.localTotalXp, Math.max(0, Math.floor(serverTotalXp))),
    sudokuBoard:
      normalized.sudokuBoard && normalized.sudokuBoard.length === 81
        ? normalized.sudokuBoard
        : defaultBoard(userId, todayKey),
  };

  await putBrainState(upgraded);
  return upgraded;
}

function appendPendingXp(state: BrainTrainingState, xp: number, reason: string): BrainTrainingState {
  if (xp <= 0) return state;
  return {
    ...state,
    pendingXpQueue: [
      ...state.pendingXpQueue,
      {
        id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        xp,
        reason,
        createdAt: Date.now(),
      },
    ],
  };
}

function applyXpWithCap(state: BrainTrainingState, requestedXp: number, reason: string): BrainTrainingState {
  if (requestedXp <= 0) return state;
  const remaining = Math.max(0, BRAIN_DAILY_CAP - state.dailyXpEarned);
  const applied = Math.min(remaining, requestedXp);
  if (applied <= 0) return state;
  return appendPendingXp(
    {
      ...state,
      dailyXpEarned: state.dailyXpEarned + applied,
      localTotalXp: state.localTotalXp + applied,
    },
    applied,
    reason
  );
}

function resolveStreak(lastCompletionDate: string | null, todayKey: string, currentStreak: number): number {
  if (lastCompletionDate === todayKey) return currentStreak;
  const yesterday = getYesterdayKey();
  if (lastCompletionDate === yesterday) return Math.max(1, currentStreak + 1);
  return 1;
}

export function applyActivityCompletion(
  state: BrainTrainingState,
  activity: BrainActivityType,
  todayKey: string
): BrainRewardResult {
  const normalized = normalizeForToday(state, todayKey);
  if (activity === "sudoku" && normalized.sudokuDone) {
    return { state: normalized, appliedXp: 0, skippedReason: "Sudoku al voltooid vandaag.", dailyCompletedNow: false };
  }
  if (activity === "choice_rt" && normalized.choiceRtDone) {
    return { state: normalized, appliedXp: 0, skippedReason: "Choice RT al voltooid vandaag.", dailyCompletedNow: false };
  }
  if (activity === "stroop" && normalized.stroopDone) {
    return { state: normalized, appliedXp: 0, skippedReason: "Stroop al voltooid vandaag.", dailyCompletedNow: false };
  }
  if (activity === "sequence_recall" && normalized.sequenceRecallDone) {
    return { state: normalized, appliedXp: 0, skippedReason: "Sequence al voltooid vandaag.", dailyCompletedNow: false };
  }
  if (activity === "tile_merge" && normalized.tileMergeDone) {
    return { state: normalized, appliedXp: 0, skippedReason: "Tile Merge al voltooid vandaag.", dailyCompletedNow: false };
  }
  if (activity === "word_scramble" && normalized.wordScrambleDone) {
    return { state: normalized, appliedXp: 0, skippedReason: "Word Scramble al voltooid vandaag.", dailyCompletedNow: false };
  }

  const withActivityFlag: BrainTrainingState =
    activity === "sudoku"
      ? { ...normalized, sudokuDone: true }
      : activity === "choice_rt"
        ? { ...normalized, choiceRtDone: true }
        : activity === "stroop"
          ? { ...normalized, stroopDone: true }
          : activity === "sequence_recall"
            ? { ...normalized, sequenceRecallDone: true }
            : activity === "tile_merge"
              ? { ...normalized, tileMergeDone: true }
              : { ...normalized, wordScrambleDone: true };

  const beforeXp = withActivityFlag.dailyXpEarned;
  let updated = applyXpWithCap(withActivityFlag, ACTIVITY_XP[activity], activity);
  let dailyCompletedNow = false;

  const dailySetComplete =
    updated.sudokuDone &&
    updated.choiceRtDone &&
    updated.stroopDone &&
    updated.sequenceRecallDone &&
    updated.tileMergeDone &&
    updated.wordScrambleDone &&
    !updated.dailyCompletionAwarded;
  if (dailySetComplete) {
    dailyCompletedNow = true;
    const streak = resolveStreak(updated.lastCompletionDate, todayKey, updated.streakCount);
    const streakBonus = Math.min(100, streak * 10);
    updated = applyXpWithCap(
      {
        ...updated,
        dailyCompletionAwarded: true,
        streakCount: streak,
        lastCompletionDate: todayKey,
      },
      50 + streakBonus,
      "daily_completion_bonus"
    );
  }

  return {
    state: updated,
    appliedXp: Math.max(0, updated.dailyXpEarned - beforeXp),
    skippedReason: null,
    dailyCompletedNow,
  };
}

export function setSudokuBoard(state: BrainTrainingState, board: number[]): BrainTrainingState {
  return {
    ...state,
    sudokuBoard: toBoardString(board),
  };
}

export function getSudokuBoard(state: BrainTrainingState, fallback: number[]): number[] {
  return boardStringToCells(state.sudokuBoard, fallback);
}

export function updateChoiceRtResult(
  state: BrainTrainingState,
  avgMs: number,
  wrong: number
): BrainTrainingState {
  const roundedAvg = Math.max(0, Math.floor(avgMs));
  const wrongCount = Math.max(0, Math.floor(wrong));
  return {
    ...state,
    choiceRtLastAvgMs: roundedAvg,
    choiceRtLastWrong: wrongCount,
    choiceRtBestMs: state.choiceRtBestMs == null ? roundedAvg : Math.min(state.choiceRtBestMs, roundedAvg),
  };
}

export function updateStroopScore(state: BrainTrainingState, score: number): BrainTrainingState {
  const s = Math.max(0, Math.floor(score));
  return {
    ...state,
    stroopLastScore: s,
    stroopBestScore: state.stroopBestScore == null ? s : Math.max(state.stroopBestScore, s),
  };
}

export function updateSequenceLevel(state: BrainTrainingState, level: number): BrainTrainingState {
  const lvl = Math.max(0, Math.floor(level));
  return {
    ...state,
    sequenceLastLevel: lvl,
    sequenceBestLevel: state.sequenceBestLevel == null ? lvl : Math.max(state.sequenceBestLevel, lvl),
  };
}

export function updateTileScore(state: BrainTrainingState, score: number): BrainTrainingState {
  const s = Math.max(0, Math.floor(score));
  return {
    ...state,
    tileLastScore: s,
    tileBestScore: state.tileBestScore == null ? s : Math.max(state.tileBestScore, s),
  };
}

export function updateWordStreak(state: BrainTrainingState, streak: number): BrainTrainingState {
  const s = Math.max(0, Math.floor(streak));
  return {
    ...state,
    wordLastStreak: s,
    wordBestStreak: state.wordBestStreak == null ? s : Math.max(state.wordBestStreak, s),
  };
}

export async function syncBrainXpQueue(state: BrainTrainingState): Promise<{
  state: BrainTrainingState;
  acceptedXp: number;
}> {
  const pendingTotal = state.pendingXpQueue.reduce((sum, item) => sum + item.xp, 0);
  if (pendingTotal <= 0) return { state, acceptedXp: 0 };

  const res = await fetch("/api/brain/xp-sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      xp_gained: pendingTotal,
      client_date: state.dailyKey,
    }),
  });

  if (!res.ok) {
    throw new Error(`Sync failed (${res.status})`);
  }

  const payload = (await res.json()) as XpSyncResponse;
  const acceptedXp = Math.max(0, Math.floor(payload.accepted_xp ?? 0));
  const serverTotal = Math.max(0, Math.floor(payload.total_xp ?? state.localTotalXp));
  const serverToday = Math.max(0, Math.floor(payload.xp_today ?? state.dailyXpEarned));

  const synced: BrainTrainingState = {
    ...state,
    pendingXpQueue: [],
    localTotalXp: serverTotal,
    dailyXpEarned: Math.min(BRAIN_DAILY_CAP, serverToday),
    lastSyncAt: Date.now(),
    syncRetryCount: 0,
  };

  return { state: synced, acceptedXp };
}
