"use client";

import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { FinanceState, IncomeSource } from "@/lib/dcic/types";
import { weeklyRequired } from "@/lib/utils/savings";
import { BudgetDeckToastChrome, BUDGET_DECK_TOAST_DURATION_MS } from "@/components/budget/budget-deck-toast-chrome";
import { openBudgetLedgerToast } from "@/components/budget/open-budget-ledger-toast";
import { FrozenPurchaseCard } from "@/components/FrozenPurchaseCard";
import { RecurringBudgetCard } from "@/components/RecurringBudgetCard";
import { SavingsGoalCard } from "@/components/SavingsGoalCard";
import { AddSavingsGoalForm } from "@/components/AddSavingsGoalForm";
import { BudgetAchievementsCard } from "@/components/budget/BudgetAchievementsCard";
import { PaydayCard } from "@/components/budget/PaydayCard";
import { LastMonthExpensesTrigger } from "@/components/budget/LastMonthExpensesTrigger";
import {
  budgetDeckFooterDividerClass,
  budgetDeckHeaderDividerClass,
  budgetDeckPrimarySavingsRowClass,
  budgetDeckRowButtonClass,
  budgetDeckSectionKickerClass,
  budgetDeckShellClass,
  budgetDeckTileClass,
} from "@/lib/budget/budget-deck-chrome";
import {
  StrategyQuarterSavingsLogForm,
  type StrategyQuarterSavingsPayload,
} from "@/components/budget/StrategyQuarterSavingsLogForm";

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

type GoalRow = {
  id: string;
  name: string;
  target_cents: number;
  current_cents: number;
  deadline: string | null;
  status?: string;
};

type TemplateRow = {
  id: string;
  amount_cents: number;
  category: string | null;
  note: string | null;
  recurrence_rule?: string;
  frequency?: string;
  next_generate_date: string;
};

export type BudgetExecuteHubProps = {
  today: string;
  currency: string;
  financeState: FinanceState | null;
  daysUntilNextIncome: number;
  nextPaydayLabel: string;
  incomeSources: IncomeSource[];
  paydayDayOfMonth: number | null;
  cycleStartDate: string | null;
  nextPaydayDate: string | null;
  serverRowUpdatedAt: string | null;
  entries: EntryRow[];
  goals: GoalRow[];
  contributedByGoal: Record<string, number>;
  activeFrozen: EntryRow[];
  readyForAction: EntryRow[];
  recurringTemplates: TemplateRow[];
  isPaydayCycle: boolean;
  prevPeriodRange: { prevStart: string; prevEnd: string };
  prevMonthEntries: EntryRow[];
  executeEntriesHref: string;
  /** Effectief Strategy-kwartaaldoel + voortgang (alle spaar-stortingen tellen mee). */
  strategyQuarterSavings?: StrategyQuarterSavingsPayload | null;
};

type Props = BudgetExecuteHubProps;

function ExecuteTile({
  emoji,
  label,
  hint,
  onClick,
  disabled,
  badge,
}: {
  emoji: string;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={budgetDeckTileClass(disabled)}
    >
      {badge != null && badge > 0 ? (
        <span className="absolute right-1.5 top-1.5 min-w-[1.25rem] rounded-full bg-[rgba(var(--mode-rgb),0.25)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-primary)]">
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

export function BudgetExecuteHub({
  today,
  currency,
  financeState,
  daysUntilNextIncome,
  nextPaydayLabel,
  incomeSources,
  paydayDayOfMonth,
  cycleStartDate,
  nextPaydayDate,
  serverRowUpdatedAt,
  entries,
  goals,
  contributedByGoal,
  activeFrozen,
  readyForAction,
  recurringTemplates,
  isPaydayCycle,
  prevPeriodRange,
  prevMonthEntries,
  executeEntriesHref,
  strategyQuarterSavings = null,
}: Props) {
  const frozenTotal = activeFrozen.length + readyForAction.length;
  const expenseEntryCount = entries.filter((e) => (e.amount_cents ?? 0) < 0).length;
  const cycleHint =
    typeof daysUntilNextIncome === "number"
      ? daysUntilNextIncome <= 0
        ? "Loon vandaag of binnen 24u"
        : daysUntilNextIncome === 1
          ? "Nog 1 dag tot loon"
          : `Nog ${daysUntilNextIncome} dagen tot loon`
      : nextPaydayLabel.slice(0, 48);

  const prevPeriodLabel =
    isPaydayCycle && prevPeriodRange.prevStart && prevPeriodRange.prevEnd
      ? `${format(new Date(prevPeriodRange.prevStart + "T12:00:00Z"), "d MMM", { locale: nl })} – ${format(new Date(prevPeriodRange.prevEnd + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}`
      : null;

  function openPaydayToast() {
    toast.custom(
      (id) => (
        <BudgetDeckToastChrome toastId={id} title="Cyclus & loon" hint="Loondag, bronnen en 'Vandaag loon gehad'." ariaLabel="Cyclus en loon">
          <PaydayCard
            daysUntilNextIncome={daysUntilNextIncome}
            nextPaydayLabel={nextPaydayLabel}
            incomeSources={incomeSources}
            paydayDayOfMonth={paydayDayOfMonth}
            currency={currency}
            cycleStartDate={cycleStartDate}
            nextPaydayDate={nextPaydayDate}
            serverRowUpdatedAt={serverRowUpdatedAt}
          />
        </BudgetDeckToastChrome>
      ),
      { duration: BUDGET_DECK_TOAST_DURATION_MS }
    );
  }

  function openQuickLogToast() {
    openLedgerToast();
  }

  function openLedgerToast() {
    openBudgetLedgerToast({
      date: today,
      currency,
      entries,
      goals,
      executeEntriesHref,
    });
  }

  function openFrozenToast() {
    toast.custom(
      (id) => (
        <BudgetDeckToastChrome toastId={id} title="Bevriezen" hint="Wachtlijst en bevestigen." ariaLabel="Bevroren aankopen">
          {frozenTotal > 0 ? (
            <FrozenPurchaseCard activeFrozen={activeFrozen} readyForAction={readyForAction} currency={currency} goals={goals} />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Geen actieve of wachtende bevriezingen.</p>
          )}
        </BudgetDeckToastChrome>
      ),
      { duration: BUDGET_DECK_TOAST_DURATION_MS }
    );
  }

  function openGoalsToast() {
    toast.custom(
      (id) => (
        <BudgetDeckToastChrome
          toastId={id}
          title="Sparen & spaardoelen"
          hint="Pay yourself first — voortgang, bijdragen en nieuwe doelen."
          ariaLabel="Sparen en spaardoelen"
        >
          <div className="space-y-4">
            <StrategyQuarterSavingsLogForm
              goals={goals.map((g) => ({ id: g.id, name: g.name }))}
              currency={currency}
              quarter={strategyQuarterSavings ?? null}
            />
            <BudgetAchievementsCard financeState={financeState} compact />
            <AddSavingsGoalForm readOnly={false} />
            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--card-border)] px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                  Nog geen spaardoelen. Voeg er een toe hierboven.
                </p>
              ) : (
                goals.map((g) => (
                  <SavingsGoalCard
                    key={g.id}
                    goal={g}
                    weeklyReq={weeklyRequired(g.target_cents, g.current_cents, g.deadline)}
                    currency={currency}
                    contributedThisMonthCents={contributedByGoal[g.id] ?? 0}
                  />
                ))
              )}
            </div>
          </div>
        </BudgetDeckToastChrome>
      ),
      { duration: BUDGET_DECK_TOAST_DURATION_MS }
    );
  }

  function openRecurringToast() {
    toast.custom(
      (id) => (
        <BudgetDeckToastChrome toastId={id} title="Terugkerende posten" hint="Templates die automatisch meeboeken." ariaLabel="Terugkerende posten">
          <RecurringBudgetCard templates={recurringTemplates} currency={currency} />
        </BudgetDeckToastChrome>
      ),
      { duration: BUDGET_DECK_TOAST_DURATION_MS }
    );
  }

  return (
    <section
      id="entries-frozen"
      className={`${budgetDeckShellClass} scroll-mt-24 p-0`}
      aria-label="Sparen en boeken — acties"
      data-tutorial="budget-goals"
    >
      <div className={`${budgetDeckHeaderDividerClass} px-4 py-3 md:px-5`}>
        <p className={budgetDeckSectionKickerClass}>Sparen & boeken</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Sparen eerst (pay yourself first), daarna uitgaven bijwerken. Tik op een rij of tegel voor het volledige paneel.
        </p>
        <button
          type="button"
          onClick={openGoalsToast}
          className={budgetDeckPrimarySavingsRowClass}
        >
          {goals.length > 0 ? (
            <span className="absolute right-3 top-2 rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-50">
              {goals.length > 99 ? "99+" : goals.length}
            </span>
          ) : null}
          <span className="text-2xl" aria-hidden>
            🎯
          </span>
          <span className="min-w-0 flex-1 pr-10">
            <span className="block text-sm font-bold text-emerald-100">Sparen & spaardoelen</span>
            <span className="mt-0.5 block text-xs text-emerald-200/80">
              Open het paneel: bovenaan stort je op een gekozen spaardoel (zichtbaar altijd; Strategy-voortgang als je een
              kwartaaldoel hebt).
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-emerald-300">Open →</span>
        </button>
        <button type="button" onClick={openPaydayToast} className={`${budgetDeckRowButtonClass} mt-2`}>
          <span className="text-2xl" aria-hidden>
            📅
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--text-primary)]">Cyclus & loon</span>
            <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{cycleHint}</span>
          </span>
          <span className="shrink-0 text-xs font-medium text-[var(--accent-focus)]">Open →</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-2 md:px-5">
        <ExecuteTile emoji="⚡" label="Quick log" hint="Snel uitgave boeken" onClick={openQuickLogToast} />
        <ExecuteTile
          emoji="📒"
          label="Boekingen"
          hint="Lijst + nieuw"
          onClick={openLedgerToast}
          badge={expenseEntryCount}
        />
        <ExecuteTile emoji="🧊" label="Bevriezen" hint="Wachtrij" onClick={openFrozenToast} badge={frozenTotal} />
        <ExecuteTile
          emoji="🔁"
          label="Terugkerend"
          hint="Templates"
          onClick={openRecurringToast}
          badge={recurringTemplates.length}
        />
      </div>
      {isPaydayCycle && prevPeriodLabel ? (
        <div className={`${budgetDeckFooterDividerClass} px-4 py-3 md:px-5`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Archief</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Periode vóór huidige cyclus: {prevPeriodLabel}</p>
          <div className="mt-2">
            <LastMonthExpensesTrigger prevMonthEntries={prevMonthEntries} currency={currency} goals={goals} />
          </div>
        </div>
      ) : null}
      <div className={`${budgetDeckFooterDividerClass} px-4 py-3 text-center md:px-5`}>
        <Link href={executeEntriesHref} className="text-xs font-medium text-[var(--accent-focus)] hover:underline">
          Spring naar #entries-frozen
        </Link>
      </div>
    </section>
  );
}
