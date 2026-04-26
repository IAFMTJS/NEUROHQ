"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HQModal } from "@/components/hq";
import { Modal } from "@/components/Modal";
import {
  openBudgetLedgerToast,
  type BudgetLedgerToastEntry,
  type BudgetLedgerToastGoal,
} from "@/components/budget/open-budget-ledger-toast";
import { BudgetLockHeaderBadge } from "@/components/budget/BudgetLockHeaderBadge";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";
import { updateBudgetSettings, type ScheduledNextBudget } from "@/app/actions/budget";
import { updateFlexBudgetSettings, type FlexBudgetHeroPayload } from "@/app/actions/flex-budget";
import { formatCents, formatCentsValue, getCurrencySymbol } from "@/lib/utils/currency";
import {
  clearPendingBudgetSnapshot,
  derivePendingBudgetRemaining,
  markPendingBudgetSynced,
  setPendingBudgetSnapshot,
  usePendingBudgetSnapshot,
} from "@/lib/client-pending-budget";
import { useSettings } from "@/lib/settings-context";
import { BudgetHistorySelector } from "@/components/BudgetHistorySelector";
import { budgetDeckShellClass } from "@/lib/budget/budget-deck-chrome";
import { openBudgetWeeklyReviewToast } from "@/components/budget/budget-weekly-review-toast";

function budgetRingMode(
  hasSettings: boolean,
  spendableCents: number,
  isOverBudget: boolean,
  remainingPctClamped: number
): EnergyRingMode {
  if (!hasSettings) return "locked";
  if (isOverBudget) return "high-alert";
  if (spendableCents <= 0) return "locked";
  if (remainingPctClamped <= 12) return "alert";
  if (remainingPctClamped <= 38) return "default";
  if (remainingPctClamped <= 68) return "green";
  return "green-peak";
}

/** Volle boog bij over budget (crisis); anders resterend % van spendable. */
function budgetRingProgress(isOverBudget: boolean, remainingPctForMeter: number): number {
  if (isOverBudget) return 100;
  return remainingPctForMeter;
}

function formatRangeShort(d0: Date, d1: Date): string {
  const sameMonth = d0.getMonth() === d1.getMonth() && d0.getFullYear() === d1.getFullYear();
  if (sameMonth) {
    return `${format(d0, "d", { locale: nl })}–${format(d1, "d MMM", { locale: nl })}`;
  }
  return `${format(d0, "d MMM", { locale: nl })} – ${format(d1, "d MMM yyyy", { locale: nl })}`;
}

type CycleStripSegment = {
  key: string;
  label: string;
  current: boolean;
  /** Korte datumrange binnen de budgetcyclus */
  rangeShort: string;
  /** bv. "Nog 5 dagen tot einde" of "7 dagen" */
  detail: string;
};

function cycleStripSegments(
  budgetPeriod: "monthly" | "weekly",
  periodStart: string | undefined,
  periodEnd: string | undefined,
  today: string,
  periodLabel: string
): { headline: string | null; segments: CycleStripSegment[] } {
  const emptySegments = (): CycleStripSegment[] =>
    [1, 2, 3, 4].map((n) => ({
      key: `w${n}`,
      label: `W${n}`,
      current: false,
      rangeShort: "—",
      detail: "—",
    }));

  if (!periodStart || !periodEnd) {
    return {
      headline: periodLabel ? `${periodLabel} · geen datums` : null,
      segments: emptySegments(),
    };
  }
  const start = new Date(periodStart + "T12:00:00Z");
  const end = new Date(periodEnd + "T12:00:00Z");
  const todayDate = new Date(today + "T12:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(todayDate.getTime())) {
    return {
      headline: periodLabel || null,
      segments: emptySegments(),
    };
  }

  const totalDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const daysToPeriodEnd = Math.max(0, differenceInCalendarDays(end, todayDate) + 1);
  const rangeFull = formatRangeShort(start, end);
  const cycleWord = budgetPeriod === "weekly" ? "week" : "cyclus";
  const headline = `${rangeFull} · ${totalDays} dagen in deze ${cycleWord}`;

  if (budgetPeriod === "weekly") {
    return {
      headline,
      segments: [
        {
          key: "week",
          label: "Deze periode",
          current: true,
          rangeShort: rangeFull,
          detail:
            daysToPeriodEnd <= 0
              ? "Laatste dag van periode"
              : `Nog ${daysToPeriodEnd} ${daysToPeriodEnd === 1 ? "dag" : "dagen"} tot einde`,
        },
      ],
    };
  }

  const slotCount = Math.min(4, Math.max(1, Math.ceil(totalDays / 7)));
  const dayOffset = Math.max(0, Math.min(totalDays - 1, differenceInCalendarDays(todayDate, start)));

  let activeIndex = 0;
  for (let i = 0; i < slotCount; i++) {
    const lo = Math.floor((i * totalDays) / slotCount);
    const hi = Math.floor(((i + 1) * totalDays) / slotCount) - 1;
    if (dayOffset >= lo && dayOffset <= hi) {
      activeIndex = i;
      break;
    }
  }

  return {
    headline,
    segments: Array.from({ length: slotCount }, (_, i) => {
      const lo = Math.floor((i * totalDays) / slotCount);
      const hi = Math.floor(((i + 1) * totalDays) / slotCount) - 1;
      const segStart = addDays(start, lo);
      const segEnd = addDays(start, hi);
      const rangeShort = formatRangeShort(segStart, segEnd);
      const segLen = hi - lo + 1;
      const current = i === activeIndex;
      const detail = current
        ? daysToPeriodEnd <= 0
          ? "Laatste dag cyclus"
          : `Nog ${daysToPeriodEnd} d. tot einde · ${segLen} d. in dit blok`
        : `${segLen} dagen in dit blok`;
      return {
        key: `w-${i}`,
        label: slotCount === 1 ? "Cyclus" : `W${i + 1}`,
        current,
        rangeShort,
        detail,
      };
    }),
  };
}

type Props = {
  /** Total budget for the current cycle (month/week) in cents. */
  budgetCents: number;
  /** Savings reserved from the budget for the current cycle in cents. */
  savingsCents: number;
  /** Expenses booked in the current cycle in cents. */
  expensesCents: number;
  currency: string;
  periodLabel: string;
  budgetPeriod: "monthly" | "weekly";
  historyMode?: boolean;
  /** YYYY-MM-DD for quick log default date */
  logDate: string;
  /** Days until next payday; null if unknown */
  daysUntilNextIncome?: number | null;
  /** Short label for next payday (e.g. "28 mrt") */
  nextPaydayShortLabel?: string | null;
  /** Canonical safe daily spend (remaining / days to income). */
  safeDailySpendCents?: number | null;
  /** Previous cycle remainder when computed (payday-aligned months). */
  previousPeriodRemaining?: { remainingCents: number; label: string } | null;
  disciplineXpThisWeek?: number;
  periodStart?: string;
  periodEnd?: string;
  /** e.g. `/budget?tab=execute#entries-frozen` */
  executeHref?: string;
  /** Aligns with `/budget?month=` when viewing history; omit on live view. */
  historyMonthParam?: string;
  /** Export + Strategy links (or other compact actions) next to period picker. */
  commandToolbar?: ReactNode;
  /** Base/flex game layer; null when DB column set unavailable. */
  flexPayload?: FlexBudgetHeroPayload | null;
  lockPanelHref?: string;
  /** Gepland budget voor de eerstvolgende loonsperiode. */
  scheduledNextBudget?: ScheduledNextBudget | null;
  /** `false` = toon vaste CTA voor budget-weekreview (los van Strategy-weekreview). */
  weeklyReviewCompleted?: boolean;
  /** Period lines for the full “Boekingen” toast opened from Quick log. */
  budgetLedgerEntries: BudgetLedgerToastEntry[];
  budgetLedgerGoals: BudgetLedgerToastGoal[];
};

export function RemainingBudgetHero({
  budgetCents,
  savingsCents,
  expensesCents,
  currency,
  periodLabel,
  budgetPeriod,
  historyMode = false,
  logDate,
  daysUntilNextIncome = null,
  nextPaydayShortLabel = null,
  safeDailySpendCents = null,
  previousPeriodRemaining = null,
  disciplineXpThisWeek = 0,
  periodStart,
  periodEnd,
  executeHref,
  historyMonthParam,
  commandToolbar,
  flexPayload = null,
  lockPanelHref,
  scheduledNextBudget = null,
  weeklyReviewCompleted,
  budgetLedgerEntries,
  budgetLedgerGoals,
}: Props) {
  const pendingBudget = usePendingBudgetSnapshot();
  const pendingActive = pendingBudget != null && pendingBudget.synced !== true;
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [budgetApplyTarget, setBudgetApplyTarget] = useState<"current" | "next">("current");
  const [flexEnabledInput, setFlexEnabledInput] = useState(false);
  const [flexChunkInput, setFlexChunkInput] = useState("");
  const [flexCapInput, setFlexCapInput] = useState("");
  const [flexMaxChunksInput, setFlexMaxChunksInput] = useState("");
  const [flexSettingsError, setFlexSettingsError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [budgetInput, setBudgetInput] = useState(String(Math.max(0, budgetCents) / 100));
  const [savingsInput, setSavingsInput] = useState(String(Math.max(0, savingsCents) / 100));
  const [periodInput, setPeriodInput] = useState<"monthly" | "weekly">(budgetPeriod);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { invalidate: invalidateSettings } = useSettings();
  const prevOverBudgetRef = useRef<boolean | null>(null);

  const effectiveBudgetCents =
    pendingActive && pendingBudget?.monthlyBudgetCents !== undefined ? pendingBudget.monthlyBudgetCents ?? 0 : budgetCents;
  const effectiveSavingsCents =
    pendingActive && pendingBudget?.monthlySavingsCents !== undefined ? pendingBudget.monthlySavingsCents ?? 0 : savingsCents;
  const effectiveCurrency = pendingActive ? pendingBudget?.currency ?? currency : currency;
  const effectiveBudgetPeriod = pendingActive ? pendingBudget?.budgetPeriod ?? budgetPeriod : budgetPeriod;
  const spendableCents = Math.max(0, effectiveBudgetCents - effectiveSavingsCents);
  const remainingCents =
    pendingActive && pendingBudget?.budgetRemainingCents != null
      ? pendingBudget.budgetRemainingCents
      : derivePendingBudgetRemaining(effectiveBudgetCents, effectiveSavingsCents, expensesCents);
  const isOverBudget = remainingCents < 0;

  useEffect(() => {
    if (historyMode) {
      prevOverBudgetRef.current = isOverBudget;
      return;
    }
    if (prevOverBudgetRef.current === null) {
      prevOverBudgetRef.current = isOverBudget;
      return;
    }
    if (prevOverBudgetRef.current === false && isOverBudget) {
      void import("@/lib/audio/budget-over-feedback").then((m) => m.playBudgetOverFeedback());
    }
    prevOverBudgetRef.current = isOverBudget;
  }, [historyMode, isOverBudget]);

  let remainingRatio: number;
  if (spendableCents > 0) {
    remainingRatio = (remainingCents / spendableCents) * 100;
  } else if (remainingCents < 0) {
    // No explicit spendable budget, but you've spent money → treat as fully overspent.
    remainingRatio = -100;
  } else {
    remainingRatio = 0;
  }

  // Circle: clamp between 0–100 so the arc doesn't break.
  const remainingPctForMeter =
    spendableCents > 0
      ? Math.min(100, Math.max(0, remainingRatio))
      : 0;

  // Text: show real percentage, including negatives when overspent (also when spendable is 0 but there are expenses).
  const remainingPctDisplay = Math.round(remainingRatio);

  const hasSettings = effectiveBudgetCents > 0 || effectiveSavingsCents > 0;

  const commandStatus = (() => {
    if (!hasSettings) return { label: "Geen budget", pill: "border-slate-500/35 bg-slate-900/50 text-slate-300" };
    if (isOverBudget) return { label: "Over budget", pill: "border-red-500/45 bg-red-950/55 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.25)]" };
    const p = remainingPctForMeter;
    if (p <= 12) return { label: "Kritiek laag", pill: "border-amber-400/45 bg-amber-950/40 text-amber-100" };
    if (p <= 35) return { label: "Onder druk", pill: "border-orange-400/35 bg-orange-950/30 text-orange-100" };
    if (p <= 60) return { label: "Gecontroleerd", pill: "border-cyan-400/35 bg-cyan-950/25 text-cyan-100" };
    return { label: "Ruim", pill: "border-emerald-400/40 bg-emerald-950/35 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.2)]" };
  })();

  const ringMode = budgetRingMode(hasSettings, spendableCents, isOverBudget, remainingPctForMeter);
  const ringProgress = budgetRingProgress(isOverBudget, remainingPctForMeter);
  const ringValue = hasSettings ? formatCents(remainingCents, effectiveCurrency) : "—";
  const ringCenterTag = flexPayload?.enabled ? "Base resterend" : hasSettings ? "Resterend" : undefined;

  const nextPeriodStartIso =
    !historyMode && periodEnd && /^\d{4}-\d{2}-\d{2}$/.test(periodEnd)
      ? addDays(new Date(periodEnd + "T12:00:00Z"), 1).toISOString().slice(0, 10)
      : null;
  const nextPeriodStartLabel =
    nextPeriodStartIso != null
      ? format(new Date(nextPeriodStartIso + "T12:00:00Z"), "d MMMM yyyy", { locale: nl })
      : null;
  const canChooseNextPeriod = Boolean(nextPeriodStartLabel) && !historyMode;

  useEffect(() => {
    if (!showEdit) return;
    setBudgetApplyTarget("current");
    setBudgetInput(String(Math.max(0, effectiveBudgetCents) / 100));
    setSavingsInput(String(Math.max(0, effectiveSavingsCents) / 100));
    setPeriodInput(effectiveBudgetPeriod);
    setError(null);
    setFlexSettingsError(null);
    if (flexPayload) {
      setFlexEnabledInput(flexPayload.enabled);
      setFlexChunkInput(formatCentsValue(flexPayload.chunkCents));
      setFlexCapInput(formatCentsValue(flexPayload.capMonthlyCents));
      setFlexMaxChunksInput(String(flexPayload.maxChunksPerDay));
    }
  }, [effectiveBudgetCents, effectiveBudgetPeriod, effectiveSavingsCents, showEdit, flexPayload]);

  function parseFlexForSave():
    | { ok: true; chunkCents: number; capCents: number; maxChunks: number }
    | { ok: false; message: string } {
    const chunkCents = Math.round(parseFloat(flexChunkInput.replace(",", ".")) * 100);
    const capCents = Math.round(parseFloat(flexCapInput.replace(",", ".")) * 100);
    const maxChunks = Math.round(parseFloat(flexMaxChunksInput.replace(",", ".")));
    if (!Number.isFinite(chunkCents) || chunkCents <= 0) {
      return { ok: false, message: "Chunk moet groter zijn dan 0." };
    }
    if (!Number.isFinite(capCents) || capCents < 0) {
      return { ok: false, message: "Maandcap ongeldig." };
    }
    if (!Number.isFinite(maxChunks) || maxChunks < 1 || maxChunks > 10) {
      return { ok: false, message: "Max. regels per dag: 1 tot 10." };
    }
    return { ok: true, chunkCents, capCents, maxChunks };
  }

  async function persistFlexIfNeeded(): Promise<void> {
    if (!flexPayload) return;
    const parsed = parseFlexForSave();
    if (!parsed.ok) throw new Error(parsed.message);
    await updateFlexBudgetSettings({
      flex_budget_enabled: flexEnabledInput,
      flex_chunk_cents: parsed.chunkCents,
      flex_cap_monthly_cents: parsed.capCents,
      flex_max_chunks_per_day: parsed.maxChunks,
    });
  }

  function handleSaveSettings() {
    setError(null);
    setFlexSettingsError(null);
    const b = budgetInput.trim() ? Math.round(parseFloat(budgetInput) * 100) : null;
    const s = savingsInput.trim() ? Math.round(parseFloat(savingsInput) * 100) : null;
    if (b != null && (isNaN(b) || b < 0)) {
      setError("Budget must be a positive number.");
      return;
    }
    if (s != null && (isNaN(s) || s < 0)) {
      setError("Savings must be a positive number.");
      return;
    }
    if (b != null && s != null && s > b) {
      setError("Savings cannot exceed budget.");
      return;
    }

    if (flexPayload) {
      const parsed = parseFlexForSave();
      if (!parsed.ok) {
        setFlexSettingsError(parsed.message);
        return;
      }
    }

    if (budgetApplyTarget === "next") {
      startTransition(async () => {
        try {
          await persistFlexIfNeeded();
          await updateBudgetSettings({
            monthly_budget_cents: b ?? null,
            monthly_savings_cents: s ?? null,
            budget_period: periodInput,
            apply_to_next_period: true,
          });
          toast.success(
            flexPayload
              ? nextPeriodStartLabel
                ? `Volgende loonsperiode gepland (actief vanaf ${nextPeriodStartLabel}) en flex-laag opgeslagen.`
                : "Volgende loonsperiode gepland en flex-laag opgeslagen."
              : nextPeriodStartLabel
                ? `Budget gepland voor volgende loonsperiode (actief vanaf ${nextPeriodStartLabel}).`
                : "Budget gepland voor volgende loonsperiode."
          );
          setShowEdit(false);
          router.refresh();
          await invalidateSettings();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to save.");
        }
      });
      return;
    }

    const nextRemainingCents = derivePendingBudgetRemaining(b, s, expensesCents);
    setPendingBudgetSnapshot({
      monthlyBudgetCents: b ?? null,
      monthlySavingsCents: s ?? null,
      budgetPeriod: periodInput,
      currency: effectiveCurrency,
      budgetRemainingCents: historyMode ? null : nextRemainingCents,
    });

    startTransition(async () => {
      try {
        await persistFlexIfNeeded();
        await updateBudgetSettings({
          monthly_budget_cents: b ?? null,
          monthly_savings_cents: s ?? null,
          budget_period: periodInput,
        });
        markPendingBudgetSynced();
        setShowEdit(false);
        if (flexPayload) {
          toast.success("Budget en flex-laag opgeslagen.");
        }
        router.refresh();
        await invalidateSettings();
        window.setTimeout(() => clearPendingBudgetSnapshot(), 1500);
      } catch (e) {
        clearPendingBudgetSnapshot();
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  function openQuickLogToast() {
    const href = executeHref ?? "/budget?tab=execute#entries-frozen";
    openBudgetLedgerToast({
      date: logDate,
      currency: effectiveCurrency,
      entries: budgetLedgerEntries,
      goals: budgetLedgerGoals,
      executeEntriesHref: href,
    });
  }

  const paydayLine =
    typeof daysUntilNextIncome === "number"
      ? daysUntilNextIncome <= 0
        ? "Loon vandaag of binnen 24u"
        : daysUntilNextIncome === 1
          ? "Nog 1 dag tot loon"
          : `Nog ${daysUntilNextIncome} dagen tot loon`
      : null;

  const syncOk = !pendingActive;
  const cycleMeta = !historyMode
    ? cycleStripSegments(effectiveBudgetPeriod, periodStart, periodEnd, logDate, periodLabel)
    : { headline: null as string | null, segments: [] as CycleStripSegment[] };

  const safeDailyLine =
    hasSettings && typeof safeDailySpendCents === "number" && safeDailySpendCents > 0
      ? formatCents(safeDailySpendCents, effectiveCurrency)
      : null;

  const previousTileLabel =
    previousPeriodRemaining != null
      ? `${formatCents(previousPeriodRemaining.remainingCents, effectiveCurrency)}${previousPeriodRemaining.remainingCents > 0 ? " +" : ""}`
      : "—";

  return (
    <>
      <section
        className={`${budgetDeckShellClass} px-4 py-5 sm:px-6`}
        aria-label="Remaining budget overview"
        data-tutorial="budget-hero"
      >
        <div className="relative z-[1] flex flex-col gap-3 border-b border-[rgba(var(--mode-rgb),0.1)] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Budget command</p>
            <p className="mt-1 max-w-xl text-xs leading-snug text-[var(--text-secondary)]">
              {flexPayload?.enabled ? (
                <>
                  {effectiveBudgetPeriod === "weekly" ? "Weekcyclus" : "Maandcyclus"} · base = je vaste lijn; flex =
                  aparte pot (alleen niet-essentieel).
                </>
              ) : (
                <>
                  {effectiveBudgetPeriod === "weekly" ? "Weekcyclus" : "Maandcyclus"} · resterend t.o.v. spendable (na
                  spaarreserve)
                </>
              )}
            </p>
            {!historyMode && scheduledNextBudget ? (
              <p className="mt-2 max-w-xl rounded-lg border border-cyan-500/25 bg-cyan-950/30 px-2.5 py-2 text-[10px] leading-snug text-cyan-100/95">
                Gepland voor volgende loonsperiode (actief vanaf{" "}
                {format(new Date(scheduledNextBudget.applies_from + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}):
                budget{" "}
                {scheduledNextBudget.monthly_budget_cents != null
                  ? formatCents(scheduledNextBudget.monthly_budget_cents, effectiveCurrency)
                  : "—"}{" "}
                · spaarreserve{" "}
                {scheduledNextBudget.monthly_savings_cents != null
                  ? formatCents(scheduledNextBudget.monthly_savings_cents, effectiveCurrency)
                  : "—"}
                {scheduledNextBudget.budget_period
                  ? ` · ${scheduledNextBudget.budget_period === "weekly" ? "week" : "maand"}cyclus`
                  : ""}
              </p>
            ) : null}
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:shrink-0 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
              <BudgetHistorySelector currentMonth={historyMonthParam} />
              {commandToolbar}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span
                className={`inline-flex items-center gap-2 text-[10px] font-medium tabular-nums ${syncOk ? "text-emerald-300/90" : "text-amber-200/95"}`}
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${syncOk ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"}`}
                  aria-hidden
                />
                {syncOk ? "Sync OK" : "Pending sync"}
              </span>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${commandStatus.pill}`}
              >
                {commandStatus.label}
              </span>
            </div>
          </div>
        </div>

        {!historyMode && weeklyReviewCompleted === false ? (
          <div
            className="relative z-[1] mt-3 flex flex-col gap-2 rounded-xl border border-violet-500/30 bg-violet-950/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            role="status"
          >
            <p className="text-[11px] leading-snug text-violet-100/95">
              <span className="font-semibold">Budget-weekreview</span> van deze week staat nog open — kort check-in
              (geen extra invoer), telt mee voor discipline.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openBudgetWeeklyReviewToast(false)}
                className="inline-flex items-center rounded-lg bg-violet-500/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-violet-500"
              >
                Open weekreview
              </button>
              <Link
                href="/budget?tab=analysis#budget-optimization-hub"
                className="text-[11px] font-medium text-violet-200 underline underline-offset-2 hover:text-white"
              >
                Naar Inzicht-tab
              </Link>
            </div>
          </div>
        ) : null}

        <div className="relative z-[1] mt-5 grid gap-8 lg:grid-cols-[minmax(0,auto)_1fr] lg:items-center lg:gap-10">
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div
                className="absolute left-1/2 top-1/2 h-[128%] w-[128%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.34)_0%,rgba(var(--mode-rgb),0.12)_38%,transparent_68%)] blur-lg sm:h-[132%] sm:w-[132%]"
                aria-hidden
              />
              <div className="relative drop-shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_48px_rgba(var(--mode-rgb),0.2)]">
                <EnergyRing
                  softGlow
                  profileOrbit
                  budgetHub
                  centerTag={ringCenterTag}
                  size={268}
                  progress={ringProgress}
                  label={hasSettings ? `${remainingPctDisplay}%` : "Geen budget"}
                  value={ringValue}
                  mode={ringMode}
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Signalen</p>
            <ul className="space-y-2">
              {paydayLine && (
                <li className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
                  <span className="mt-0.5 text-lg leading-none" aria-hidden>
                    📍
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{paydayLine}</p>
                    {nextPaydayShortLabel && (
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        Volgende storting · {nextPaydayShortLabel}
                      </p>
                    )}
                  </div>
                </li>
              )}
              {hasSettings && (
                <li className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
                  <span className="mt-0.5 text-lg leading-none" aria-hidden>
                    🛡️
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      {safeDailyLine ? (
                        <>
                          Veilige dag · <span className="tabular-nums">{safeDailyLine}</span>
                        </>
                      ) : isOverBudget ? (
                        "Geen veilige dag — je zit over budget"
                      ) : (
                        "Veilige dag — stel loondag in voor een dagbedrag"
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      Resterend gedeeld door dagen tot inkomen (zelfde logica als Strategy-stack)
                    </p>
                  </div>
                </li>
              )}
              {!historyMode && (
                <li className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
                  <span className="mt-0.5 text-lg leading-none" aria-hidden>
                    ⚡
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Discipline deze week ·{" "}
                      <span className="tabular-nums">{disciplineXpThisWeek > 0 ? `+${disciplineXpThisWeek} XP` : "0 XP"}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      Budget-discipline missies in deze week
                    </p>
                  </div>
                </li>
              )}
            </ul>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["Spendable", hasSettings ? formatCents(spendableCents, effectiveCurrency) : "—"],
                ["Uitgegeven", hasSettings ? formatCents(expensesCents, effectiveCurrency) : "—"],
                ["Vorige periode", previousTileLabel],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 px-2.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{k}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{v}</p>
                </div>
              ))}
            </div>

            {previousPeriodRemaining != null && (
              <p className="text-[11px] text-[var(--text-muted)]">
                Vorige periode ({previousPeriodRemaining.label}): resterend{" "}
                <span
                  className={`font-medium ${previousPeriodRemaining.remainingCents < 0 ? "text-amber-300" : "text-[var(--text-primary)]"}`}
                >
                  {formatCents(previousPeriodRemaining.remainingCents, effectiveCurrency)}
                </span>
              </p>
            )}

            {!hasSettings && (
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                Stel je {effectiveBudgetPeriod === "weekly" ? "week" : "maand"}budget en spaarreserve in voor tempo en
                signalen.
              </p>
            )}
          </div>
        </div>

        {flexPayload != null && !historyMode && !flexPayload.enabled ? (
          <p className="relative z-[1] mt-3 border-b border-[rgba(var(--mode-rgb),0.08)] pb-3 text-[11px] leading-snug text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">Flex-laag</span> (beloningen en straffen) zet je
            aan en stel je in via <span className="text-[var(--text-primary)]">Budget bewerken</span>.
          </p>
        ) : null}

        {flexPayload?.enabled && (
          <div className="relative z-[1] mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-black/25 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Base (vast)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCents(spendableCents, effectiveCurrency)}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-[var(--text-muted)]">
                Budget minus spaarreserve — vaste lijn voor normaal leven.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200/90">Flex (game)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-100">
                {formatCents(flexPayload.flexCents, effectiveCurrency)}
                {flexPayload.todayDeltaCents !== 0 ? (
                  <span
                    className={`ml-2 text-sm font-medium tabular-nums ${
                      flexPayload.todayDeltaCents > 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    ({flexPayload.todayDeltaCents > 0 ? "+" : ""}
                    {formatCents(flexPayload.todayDeltaCents, effectiveCurrency)} vandaag)
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-[var(--text-muted)]">
                Alleen voor niet-essentieel · Strategy: {flexPayload.strategyMultiplierLabel}
              </p>
            </div>
            {(flexPayload.weekEarnedCents > 0 || flexPayload.weekLostCents > 0) && (
              <div className="space-y-0.5 text-[11px] leading-snug text-[var(--text-secondary)] sm:col-span-2">
                {flexPayload.weekEarnedCents > 0 ? (
                  <p>
                    Deze week verdiend op flex:{" "}
                    <span className="font-medium tabular-nums text-emerald-300">
                      {formatCents(flexPayload.weekEarnedCents, effectiveCurrency)}
                    </span>
                  </p>
                ) : null}
                {flexPayload.weekLostCents > 0 ? (
                  <p>
                    Deze week kwijt door regels:{" "}
                    <span className="font-medium tabular-nums text-rose-300">
                      {formatCents(flexPayload.weekLostCents, effectiveCurrency)}
                    </span>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}

        {flexPayload?.enabled && flexPayload.lockTier === "critical" && lockPanelHref ? (
          <div className="relative z-[1] mt-3 rounded-lg border border-rose-500/35 bg-rose-950/30 px-3 py-2 text-[11px] leading-snug text-rose-100">
            Flex onder €20 —{" "}
            <Link href={lockPanelHref} className="font-semibold underline underline-offset-2">
              open no-spend lock
            </Link>{" "}
            en houd base strak.
          </div>
        ) : null}

        {flexPayload?.enabled && flexPayload.lockTier === "bonus" ? (
          <div className="relative z-[1] mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-3 py-2 text-[11px] leading-snug text-emerald-100">
            Flex boven €100 — bonuszone: meer ruimte; blijf niet-essentieel uit flex halen.
          </div>
        ) : null}

        {!historyMode && cycleMeta.segments.length > 0 && (
          <div className="relative z-[1] mt-6 border-t border-[rgba(var(--mode-rgb),0.1)] pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Cyclus</p>
            {cycleMeta.headline ? (
              <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">{cycleMeta.headline}</p>
            ) : null}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {cycleMeta.segments.map((w) => (
                <div
                  key={w.key}
                  className={
                    w.current
                      ? "min-w-[7.25rem] max-w-[11rem] shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.3)] px-3 py-2.5 text-left shadow-[0_0_16px_rgba(var(--mode-rgb),0.2)] sm:min-w-[7.5rem]"
                      : "min-w-[7.25rem] max-w-[11rem] shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(0,0,0,0.2)] px-3 py-2.5 text-left text-[var(--text-muted)] sm:min-w-[7.5rem]"
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        w.current
                          ? "h-2.5 w-2.5 shrink-0 rounded-full bg-[rgb(var(--mode-rgb))] shadow-[0_0_10px_rgba(var(--mode-rgb),0.55)]"
                          : "h-2 w-2 shrink-0 rounded-full bg-[var(--text-muted)]/35"
                      }
                      aria-hidden
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-primary)]">
                      {w.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium leading-tight text-[var(--text-primary)] opacity-95">
                    {w.rangeShort}
                  </p>
                  <p className="mt-1 text-[9px] leading-snug opacity-85">{w.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-[1] mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="btn-primary inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:flex-initial sm:min-w-[140px]"
          >
            Details
          </button>
          {!historyMode && (
            <>
              <button
                type="button"
                onClick={openQuickLogToast}
                className="btn-secondary inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:flex-initial sm:min-w-[140px]"
              >
                Quick log openen
              </button>
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="btn-secondary inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:flex-initial sm:min-w-[140px]"
              >
                Budget bewerken
              </button>
              {executeHref && (
                <Link
                  href={executeHref}
                  className="btn-secondary inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:flex-initial sm:min-w-[140px]"
                >
                  Naar sparen & boeken
                </Link>
              )}
            </>
          )}
        </div>
        <p className="relative z-[1] mt-3 text-[10px] leading-snug text-[var(--text-muted)]">
          {flexPayload?.enabled
            ? "Base-restant = budget − spaarreserve − uitgaven. Flex is apart en wordt door gedrag bijgewerkt."
            : "budget − spaarreserve − uitgaven = restant"}
          {pendingActive && (
            <span className="mt-1 block text-[11px] text-[var(--accent-focus)]">
              Bijwerken… tijdelijke waarden actief.
            </span>
          )}
        </p>
      </section>

      <HQModal open={showDetails} onClose={() => setShowDetails(false)} width={520}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <BudgetLockHeaderBadge />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Remaining budget
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {budgetPeriod === "weekly" ? "This week" : "This month"} overview
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your spendable budget is your total budget minus savings. Remaining is what&apos;s
              left after expenses.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Budget (total)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCents(effectiveBudgetCents, effectiveCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Savings reserved</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--accent-focus)]">
                {formatCents(effectiveSavingsCents, effectiveCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Spent {periodLabel}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCents(expensesCents, effectiveCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/90 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Remaining to spend</p>
              <p
                className={`mt-0.5 text-lg font-semibold tabular-nums ${
                  isOverBudget ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {formatCents(remainingCents, effectiveCurrency)}
              </p>
              {spendableCents > 0 && (
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {remainingPctDisplay}% of spendable left
                  {isOverBudget ? " (over budget)" : ""}.
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Tip: keep remaining above zero before the end of{" "}
            {effectiveBudgetPeriod === "weekly" ? "the week" : "the month"} to stay in the safe zone.
          </p>
        </div>
      </HQModal>

      <Modal
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          setError(null);
          setFlexSettingsError(null);
        }}
        title={hasSettings ? "Edit budget & savings" : "Set budget & savings"}
        showBranding
        headerBadge={<BudgetLockHeaderBadge />}
        size={flexPayload ? "lg" : "md"}
      >
        <p className="text-sm text-[var(--text-muted)]">
          Total amount per {periodInput === "weekly" ? "week" : "month"}, and how much you reserve for savings.
        </p>
        {canChooseNextPeriod ? (
          <div className="mt-4 space-y-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Waarvoor geldt dit?</p>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--text-secondary)]">
              <input
                type="radio"
                name="budgetApplyTarget"
                className="mt-1 h-3.5 w-3.5 shrink-0 border-[var(--card-border)] text-[rgb(var(--mode-rgb))] focus:ring-[rgb(var(--mode-rgb))]/40"
                checked={budgetApplyTarget === "current"}
                onChange={() => setBudgetApplyTarget("current")}
              />
              <span>
                <span className="font-medium text-[var(--text-primary)]">Deze loonsperiode</span> (nu actief) — past
                je huidige restant en meter aan.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--text-secondary)]">
              <input
                type="radio"
                name="budgetApplyTarget"
                className="mt-1 h-3.5 w-3.5 shrink-0 border-[var(--card-border)] text-[rgb(var(--mode-rgb))] focus:ring-[rgb(var(--mode-rgb))]/40"
                checked={budgetApplyTarget === "next"}
                onChange={() => setBudgetApplyTarget("next")}
              />
              <span>
                <span className="font-medium text-[var(--text-primary)]">Volgende loonsperiode</span>
                {nextPeriodStartLabel ? (
                  <> (start {nextPeriodStartLabel}) — deze periode blijft ongewijzigd.</>
                ) : (
                  <> — deze periode blijft ongewijzigd.</>
                )}
              </span>
            </label>
          </div>
        ) : null}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Budget period</label>
            <select
              value={periodInput}
              onChange={(e) => setPeriodInput(e.target.value as "monthly" | "weekly")}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Budget</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Savings</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={savingsInput}
              onChange={(e) => setSavingsInput(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>

          {flexPayload ? (
            <div className="mt-8 border-t border-[var(--card-border)] pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Flex-laag</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Aparte pot voor niet-essentieel; beloningen en straffen passen het saldo aan (los van je vaste budget).
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-[var(--card-border)] bg-[var(--bg-primary)] text-[rgb(var(--mode-rgb))] focus:ring-[rgb(var(--mode-rgb))]/40"
                  checked={flexEnabledInput}
                  onChange={(e) => setFlexEnabledInput(e.target.checked)}
                />
                <span>Flex-laag inschakelen (beloningen en straffen)</span>
              </label>
              <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Chunk en maandlimiet
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs text-[var(--text-secondary)]">
                  <span className="mb-1 block font-medium text-[var(--text-primary)]">Chunk (stap)</span>
                  <span className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 tabular-nums">
                    <span className="text-[var(--text-muted)]">{getCurrencySymbol(effectiveCurrency)}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                      value={flexChunkInput}
                      onChange={(ev) => setFlexChunkInput(ev.target.value)}
                      aria-label="Flex chunk in hoofdeenheid"
                    />
                  </span>
                </label>
                <label className="block text-xs text-[var(--text-secondary)]">
                  <span className="mb-1 block font-medium text-[var(--text-primary)]">Max. per maand (plafond)</span>
                  <span className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 tabular-nums">
                    <span className="text-[var(--text-muted)]">{getCurrencySymbol(effectiveCurrency)}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                      value={flexCapInput}
                      onChange={(ev) => setFlexCapInput(ev.target.value)}
                      aria-label="Flex maandcap in hoofdeenheid"
                    />
                  </span>
                </label>
                <label className="block text-xs text-[var(--text-secondary)]">
                  <span className="mb-1 block font-medium text-[var(--text-primary)]">Max. chunks per dag</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm tabular-nums text-[var(--text-primary)] outline-none"
                    value={flexMaxChunksInput}
                    onChange={(ev) => setFlexMaxChunksInput(ev.target.value)}
                    aria-label="Maximum flex chunks per dag"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {flexSettingsError && <p className="text-sm text-red-400">{flexSettingsError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={pending}
              className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEdit(false);
                setError(null);
                setFlexSettingsError(null);
              }}
              className="rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

