"use client";

import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

type Props = {
  thesis: string;
  thesisWhy: string | null;
  deadline: string;
  targetMetric: string | null;
  pressure: number;
  zone: "comfort" | "healthy" | "risk";
  daysRemaining: number;
};

export function StrategyThesisHero({
  thesis,
  thesisWhy,
  deadline,
  targetMetric,
  pressure,
  zone,
  daysRemaining,
}: Props) {
  const deadlineDate = new Date(deadline + "T23:59:59");
  const countdown = daysRemaining > 0
    ? formatDistanceToNow(deadlineDate, { addSuffix: false, locale: nl })
    : "Afgelopen";
  const zoneLabel = zone === "comfort" ? "Comfortabel" : zone === "healthy" ? "Gezond" : "Risk zone";
  const meterColor =
    zone === "comfort"
      ? "var(--accent-focus)"
      : zone === "healthy"
        ? "var(--accent-amber)"
        : "var(--accent-warning, #ef4444)";

  return (
    <section className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Strategic Thesis
          </h2>
          <p className="mt-2 text-lg font-medium leading-snug text-[var(--text-primary)]">
            {thesis}
          </p>
          {thesisWhy && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {thesisWhy}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2.5 py-1 text-[var(--text-primary)]">
              Deadline: {countdown}
            </span>
            {targetMetric && (
              <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2.5 py-1 text-[var(--text-primary)]">
                Target: {targetMetric}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Strategic Pressure
          </span>
          <div
            className="relative h-24 w-10 overflow-hidden rounded-full border border-[var(--card-border)] bg-[var(--bg-card)]"
            style={{ boxShadow: "inset 0 0 12px rgba(0,0,0,0.3)" }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-300"
              style={{
                height: `${Math.min(100, Math.max(0, pressure * 50))}%`,
                backgroundColor: meterColor,
              }}
              aria-hidden
            />
          </div>
          <span className="text-xs font-semibold" style={{ color: meterColor }}>
            {zoneLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
