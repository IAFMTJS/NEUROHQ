"use client";

import { toast } from "sonner";
import type { Alternative } from "@/app/actions/alternatives";
import type { FinanceState } from "@/lib/dcic/types";
import type { Insight } from "@/lib/dcic/finance-engine";
import { BudgetSummaryCard } from "@/components/BudgetSummaryCard";
import { DisciplineIndexCard } from "@/components/budget/DisciplineIndexCard";
import { FinancialStatusCard } from "@/components/dcic/FinancialStatusCard";
import { WeeklyPerformanceCard } from "@/components/budget/WeeklyPerformanceCard";
import { BudgetRiskInsightCard } from "@/components/budget/BudgetRiskInsightCard";
import { BudgetPerformanceSummaryCard } from "@/components/budget/BudgetPerformanceSummaryCard";
import { BudgetCognitiveLoadTrendCard } from "@/components/budget/BudgetCognitiveLoadTrendCard";
import { BudgetPatternDetectionCard } from "@/components/budget/BudgetPatternDetectionCard";
import { BudgetStabilityRiskCard } from "@/components/budget/BudgetStabilityRiskCard";
import { BudgetForecastAndReviewCard } from "@/components/budget/BudgetForecastAndReviewCard";
import { BudgetInsightsAndSpendingCard } from "@/components/budget/BudgetInsightsAndSpendingCard";
import { FinancialInsightsCard } from "@/components/dcic/FinancialInsightsCard";
import { ExpenseDistributionChart } from "@/components/budget/ExpenseDistributionChart";
import { SavingsTipsCard } from "@/components/budget/SavingsTipsCard";
import { AlternativesList } from "@/components/AlternativesList";
import { LastMonthExpensesTrigger } from "@/components/budget/LastMonthExpensesTrigger";
import { NextMonthExpensesTrigger } from "@/components/budget/NextMonthExpensesTrigger";
import { ArchetypeRiskLensCard } from "@/components/budget/ArchetypeRiskLensCard";
import { ImpulseTriggerMapCard } from "@/components/budget/ImpulseTriggerMapCard";
import { ReflectionEngineCard } from "@/components/budget/ReflectionEngineCard";

type EntryRow = {
  id: string;
  amount_cents: number;
  date: string;
  category: string | null;
  note: string | null;
  is_planned: boolean;
  freeze_until: string | null;
  freeze_reminder_sent: boolean;
};

type GoalRow = { id: string; name: string; target_cents: number; current_cents: number; status?: string };

export type BudgetInsightHubProps = {
  historyMode: boolean;
  uxExperiments: boolean;
  behaviorReimagining: boolean;
  currency: string;
  periodLabel: string;
  budgetPeriod: "monthly" | "weekly";
  categoryTotals: Record<string, number>;
  goals: GoalRow[];
  alternatives: Alternative[];
  commandStatus: { title: string; tone: string; border: string };
  remainingToSpendCents: number | null;
  disciplineScore: number | null;
  disciplineInputsReady: boolean;
  monthlyBudgetCents: number | null;
  monthlySavingsCents: number | null;
  expensesCents: number;
  incomeCents: number;
  forecastProjectedBalanceCents: number | null;
  forecastOverspendCents: number | null;
  financeState: FinanceState | null;
  daysUntilNextIncome: number;
  safeDailySpendOverrideCents: number | null;
  daysUnderBudgetThisWeek: number | null;
  disciplineXpThisWeek: number | null;
  insights: Insight[];
  unplannedCount: number;
  unplannedTotalCents: number;
  emergencyActive: boolean;
  emergencyReasons: string[];
  loadTrend: { label: string; value: number }[];
  impulseWindow: string | null;
  weeklyReviewCompleted: boolean;
  canonicalInsightsSorted: Insight[];
  canonicalTopInsight: Insight | null;
  archetype: string;
  archetypeReason: string;
  archetypeAction: string;
  topCategories: string[];
  prevMonthEntries: EntryRow[];
  nextMonthEntries: EntryRow[];
  isPaydayCycle: boolean;
};

const TOAST_MS = 120_000;

const toastShell =
  "relative w-[min(100vw-2rem,420px)] max-h-[min(85vh,580px)] overflow-y-auto overflow-x-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] px-3 py-3 pr-10 text-left shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md";
const toastShellWide =
  "relative w-[min(100vw-2rem,480px)] max-h-[min(88vh,640px)] overflow-y-auto overflow-x-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] px-3 py-3 pr-10 text-left shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md";

/** Zelfde deck-chrome als Sparen & boeken (`card-simple`) en tegels als Optimalisatie-hub. */
const insightHubSectionClass = "card-simple scroll-mt-24 overflow-hidden p-0";

const insightTileClass =
  "relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/50 px-2 py-3 text-center transition-colors hover:border-[rgba(var(--mode-rgb),0.35)] hover:bg-[var(--bg-elevated)]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:min-h-[6rem]";

function ToastChrome({
  toastId,
  title,
  hint,
  children,
  ariaLabel,
  wide,
}: {
  toastId: string | number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  ariaLabel: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? toastShellWide : toastShell} role="dialog" aria-label={ariaLabel}>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        aria-label="Sluiten"
        onClick={() => toast.dismiss(toastId)}
      >
        ✕
      </button>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">{title}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{hint}</p> : null}
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

function InsightTile({
  emoji,
  label,
  hint,
  onClick,
  badge,
}: {
  emoji: string;
  label: string;
  hint?: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button type="button" onClick={onClick} className={insightTileClass}>
      {badge != null && badge > 0 ? (
        <span className="absolute right-1.5 top-1.5 min-w-[1.25rem] rounded-full border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.45)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--semantic-accent)]">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <span className="text-2xl leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
      {hint ? <span className="line-clamp-2 text-[10px] text-[var(--text-muted)]">{hint}</span> : null}
    </button>
  );
}

export function BudgetInsightHub(props: BudgetInsightHubProps) {
  const {
    historyMode,
    uxExperiments,
    behaviorReimagining,
    currency,
    periodLabel,
    budgetPeriod,
    categoryTotals,
    goals,
    alternatives,
    commandStatus,
    remainingToSpendCents,
    disciplineScore,
    disciplineInputsReady,
    monthlyBudgetCents,
    monthlySavingsCents,
    expensesCents,
    incomeCents,
    forecastProjectedBalanceCents,
    forecastOverspendCents,
    financeState,
    daysUntilNextIncome,
    safeDailySpendOverrideCents,
    daysUnderBudgetThisWeek,
    disciplineXpThisWeek,
    insights,
    unplannedCount,
    unplannedTotalCents,
    emergencyActive,
    emergencyReasons,
    loadTrend,
    impulseWindow,
    weeklyReviewCompleted,
    canonicalInsightsSorted,
    canonicalTopInsight,
    archetype,
    archetypeReason,
    archetypeAction,
    topCategories,
    prevMonthEntries,
    nextMonthEntries,
    isPaydayCycle,
  } = props;

  const summaryHint =
    remainingToSpendCents != null
      ? `Resterend: ${(remainingToSpendCents / 100).toFixed(0)} ${currency} · ${commandStatus.title}`
      : `${commandStatus.title} · ${periodLabel}`;

  function openSummaryToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Budget & discipline" hint="Samenvatting en index." ariaLabel="Budgetsamenvatting">
          <BudgetSummaryCard
            monthlyBudgetCents={monthlyBudgetCents}
            monthlySavingsCents={monthlySavingsCents}
            expensesCents={expensesCents}
            incomeCents={incomeCents}
            currency={currency}
            periodLabel={periodLabel}
            budgetPeriod={budgetPeriod}
            historyMode={historyMode}
            forecastProjectedBalanceCents={forecastProjectedBalanceCents}
            forecastOverspendCents={forecastOverspendCents}
          />
          <DisciplineIndexCard value={disciplineScore} inputsReady={disciplineInputsReady} />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  /** Eén paneel: DCIC-status + week (uit oude Status) en tempo/patronen/load (uit oude Pace). */
  function openStandWeekAndPaceToast() {
    toast.custom(
      (id) => (
        <ToastChrome
          toastId={id}
          title="Stand, week & tempo"
          hint="Huidige positie, weekdiscipline, ritme t.o.v. budget en patronen (categorieën, load, risico)."
          ariaLabel="Stand week en tempo"
          wide
        >
          <FinancialStatusCard
            financeState={financeState}
            remainingToSpendCents={remainingToSpendCents}
            daysUntilIncomeOverride={daysUntilNextIncome}
            safeDailySpendOverrideCents={safeDailySpendOverrideCents}
          />
          {uxExperiments ? (
            <>
              <BudgetStabilityRiskCard
                daysUnderBudget={daysUnderBudgetThisWeek}
                disciplineXp={disciplineXpThisWeek}
                insights={canonicalInsightsSorted}
                topInsightOverride={canonicalTopInsight}
              />
              <BudgetForecastAndReviewCard
                financeState={financeState}
                remainingToSpendCents={remainingToSpendCents}
                periodLabel={periodLabel}
                completedThisWeek={weeklyReviewCompleted}
                daysUntilNextIncome={daysUntilNextIncome}
                safeDailySpendCents={safeDailySpendOverrideCents}
              />
              <BudgetInsightsAndSpendingCard
                categoryTotals={categoryTotals}
                impulseWindow={impulseWindow}
                insights={canonicalInsightsSorted}
                points={loadTrend}
                currency={currency}
              />
            </>
          ) : (
            <>
              <WeeklyPerformanceCard daysUnderBudget={daysUnderBudgetThisWeek} disciplineXp={disciplineXpThisWeek} />
              <BudgetPerformanceSummaryCard
                financeState={financeState}
                remainingToSpendCents={remainingToSpendCents}
                periodLabel={periodLabel}
              />
              <BudgetCognitiveLoadTrendCard points={loadTrend} />
              <BudgetPatternDetectionCard categoryTotals={categoryTotals} impulseWindow={impulseWindow} />
              <BudgetRiskInsightCard insights={insights} />
            </>
          )}
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openInsightsListToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Signalenlijst" hint="Alle engine-inzichten." ariaLabel="Inzichten">
          <FinancialInsightsCard insights={insights} />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openChartToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Verdeling uitgaven" hint="Per categorie (periode)." ariaLabel="Verdeling" wide>
          <ExpenseDistributionChart categoryTotals={categoryTotals} currency={currency} />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openTipsToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Tips" hint="Statisch + uit suggesties in je signalen." ariaLabel="Spaartips">
          <SavingsTipsCard insights={insights} />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openAlternativesToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Suggesties" hint="Alternatieven op basis van je keuzes." ariaLabel="Suggesties" wide>
          <AlternativesList alternatives={alternatives} goals={goals} currency={currency} />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openArchiveToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Archief & planning" hint="Vorige periode en toekomstboekingen." ariaLabel="Archief">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {isPaydayCycle ? "Uitgaven vorige periode" : "Uitgaven vorige maand"}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {isPaydayCycle
                  ? "Boekingen van de vorige budgetperiode (loon tot loon)."
                  : "Boekingen van de vorige maand."}
              </p>
              <div className="mt-2">
                <LastMonthExpensesTrigger prevMonthEntries={prevMonthEntries} currency={currency} goals={goals} />
              </div>
            </div>
            <div className="border-t border-[var(--card-border)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Uitgaven volgende maand</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Toekomstige datums — niet in huidig budget.</p>
              <div className="mt-2">
                <NextMonthExpensesTrigger nextMonthEntries={nextMonthEntries} currency={currency} goals={goals} />
              </div>
            </div>
          </div>
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openBehaviorToast() {
    toast.custom(
      (id) => (
        <ToastChrome toastId={id} title="Gedrag & reflectie" hint="Archetype, triggers, reflectie." ariaLabel="Gedrag">
          <ArchetypeRiskLensCard archetype={archetype} reason={archetypeReason} action={archetypeAction} />
          <ImpulseTriggerMapCard impulseWindow={impulseWindow} topCategories={topCategories} />
          <ReflectionEngineCard />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  if (historyMode) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/50 px-4 py-3 text-sm text-[var(--text-muted)]">
          Historische maand: voorspelling en live-gedrag zijn uitgeschakeld. Verdeling en tips blijven beschikbaar.
        </div>
        <section className={insightHubSectionClass} aria-label="Inzicht — archief" id="budget-insight-hub">
          <div className="border-b border-[var(--card-border)] px-4 py-3 md:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Inzicht</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Open grafiek, tips of suggesties via de tegels.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:px-5">
            <InsightTile emoji="📊" label="Verdeling" hint="Categorieën" onClick={openChartToast} />
            <InsightTile emoji="💡" label="Tips" hint="Sparen" onClick={openTipsToast} />
            {alternatives.length > 0 ? (
              <InsightTile
                emoji="✨"
                label="Suggesties"
                hint="Alternatieven"
                onClick={openAlternativesToast}
                badge={alternatives.length}
              />
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unplannedCount > 0 && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-muted)]">
          Ongeplande uitgaven deze week: {unplannedCount} ({(unplannedTotalCents / 100).toFixed(2)} {currency})
        </div>
      )}
      {emergencyActive && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <strong>Let op:</strong> {emergencyReasons.join(" ")}
        </div>
      )}

      <section className={insightHubSectionClass} aria-label="Inzicht — overzicht" id="budget-insight-hub">
        <div className="border-b border-[var(--card-border)] px-4 py-3 md:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Inzicht</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Cijfers, patronen en signalen hier; scroll naar beneden voor weekreview en routines.
          </p>
          <button
            type="button"
            onClick={openSummaryToast}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/35 px-3 py-2.5 text-left transition-colors hover:border-[rgba(var(--mode-rgb),0.3)] hover:bg-[var(--bg-primary)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)]"
          >
            <span className="text-2xl" aria-hidden>
              📋
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">Budget & discipline</span>
              <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{summaryHint}</span>
            </span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${commandStatus.border} ${commandStatus.tone}`}>
              {commandStatus.title}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:px-5">
          <InsightTile
            emoji="🛡️"
            label="Stand, week & tempo"
            hint="DCIC, ritme, patronen"
            onClick={openStandWeekAndPaceToast}
          />
          <InsightTile
            emoji="📣"
            label="Signalenlijst"
            hint="Engine"
            onClick={openInsightsListToast}
            badge={insights.length}
          />
          <InsightTile emoji="📊" label="Verdeling" hint="Pie chart" onClick={openChartToast} />
          <InsightTile emoji="💡" label="Tips" hint="Sparen" onClick={openTipsToast} />
          {alternatives.length > 0 ? (
            <InsightTile
              emoji="✨"
              label="Suggesties"
              hint="Alternatieven"
              onClick={openAlternativesToast}
              badge={alternatives.length}
            />
          ) : null}
          <InsightTile emoji="🗂️" label="Archief" hint="Vorig / volgend" onClick={openArchiveToast} />
          {behaviorReimagining ? (
            <InsightTile emoji="🧭" label="Gedrag" hint="Archetype" onClick={openBehaviorToast} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
