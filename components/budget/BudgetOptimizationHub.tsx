"use client";

import { toast } from "sonner";
import { BudgetPaydaySurveyCard } from "@/components/budget/BudgetPaydaySurveyCard";
import { openBudgetWeeklyReviewToast } from "@/components/budget/budget-weekly-review-toast";
import { BudgetOptimizationCard } from "@/components/budget/BudgetOptimizationCard";
import { budgetDeckSectionKickerClass, budgetDeckShellClass, budgetDeckTileClass } from "@/lib/budget/budget-deck-chrome";

export type OptimizationChallenge = { key: string; label: string; xp: number; description: string };

export type BudgetOptimizationHubProps = {
  historyMode: boolean;
  needsPaydaySurvey: boolean;
  weeklyReviewCompleted: boolean;
  lockPanelHref: string;
  summary: string;
  suggestions: string[];
  challenges: OptimizationChallenge[];
};

const TOAST_MS = 120_000;

const toastShell =
  "relative w-[min(100vw-2rem,420px)] max-h-[min(85vh,580px)] overflow-y-auto overflow-x-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] px-3 py-3 pr-10 text-left shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md";
const toastShellWide =
  "relative w-[min(100vw-2rem,500px)] max-h-[min(88vh,680px)] overflow-y-auto overflow-x-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.12)] bg-[linear-gradient(165deg,rgba(var(--mode-rgb-deep),0.42),rgba(15,23,42,0.96))] px-3 py-3 pr-10 text-left shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-md";

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

function OptTile({
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
    <button type="button" onClick={onClick} className={budgetDeckTileClass()}>
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

export function BudgetOptimizationHub({
  historyMode,
  needsPaydaySurvey,
  weeklyReviewCompleted,
  lockPanelHref,
  summary,
  suggestions,
  challenges,
}: BudgetOptimizationHubProps) {
  const optCount = suggestions.length + challenges.length;

  function openPaydayToast() {
    if (historyMode) {
      toast.message("Pre-payday survey is niet beschikbaar in een historische maand.");
      return;
    }
    toast.custom(
      (id) => (
        <ToastChrome
          toastId={id}
          title="Pre-payday reflectie"
          hint={needsPaydaySurvey ? "Verplicht om de cyclus af te ronden." : "Optioneel — helpt het model."}
          ariaLabel="Pre-payday survey"
        >
          <BudgetPaydaySurveyCard required={needsPaydaySurvey} />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  function openWeeklyToast() {
    if (historyMode) {
      toast.message("Weekreview is niet beschikbaar in een historische maand.");
      return;
    }
    openBudgetWeeklyReviewToast(weeklyReviewCompleted);
  }

  function openOptimizationToast() {
    toast.custom(
      (id) => (
        <ToastChrome
          toastId={id}
          title="Suggesties & interventies"
          hint="Samenvatting, suggesties, focus-locks en challenges."
          ariaLabel="Budget optimalisatie"
          wide
        >
          <BudgetOptimizationCard
            lockPanelHref={lockPanelHref}
            summary={summary}
            suggestions={suggestions}
            challenges={challenges}
          />
        </ToastChrome>
      ),
      { duration: TOAST_MS }
    );
  }

  return (
    <section className={`${budgetDeckShellClass} scroll-mt-24`} aria-label="Routines en verbeteren" id="budget-optimization-hub">
      <div className="px-4 py-4 md:px-5 md:py-5">
        <p className={budgetDeckSectionKickerClass}>Routines & verbeteren</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Hoort bij <strong className="font-semibold text-[var(--text-secondary)]">Inzicht</strong>: weekreview, pre-payday en
          suggesties. Tik op een tegel voor het volledige paneel.
        </p>
        <div
          className={`mt-4 grid gap-3 ${historyMode ? "mx-auto max-w-md grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}
        >
          {!historyMode ? (
            <OptTile
              emoji="📝"
              label="Pre-payday"
              hint="T-4 reflectie"
              onClick={openPaydayToast}
              badge={needsPaydaySurvey ? 1 : undefined}
            />
          ) : null}
          {!historyMode ? (
            <OptTile
              emoji="✅"
              label="Weekreview"
              hint="Weekcheck"
              onClick={openWeeklyToast}
              badge={!weeklyReviewCompleted ? 1 : undefined}
            />
          ) : null}
          <OptTile
            emoji="🎯"
            label="Suggesties"
            hint="Locks & XP"
            onClick={openOptimizationToast}
            badge={optCount > 0 ? optCount : undefined}
          />
        </div>
        {historyMode ? (
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Historische maand: alleen suggesties en challenges zijn hier beschikbaar.
          </p>
        ) : null}
      </div>
    </section>
  );
}
