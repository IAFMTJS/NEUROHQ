"use client";

import Link from "next/link";
import type { Insight } from "@/lib/dcic/finance-engine";

type Props = {
  remainingToSpendCents: number | null;
  readyForActionCount: number;
  daysUntilNextIncome: number;
  insights: Insight[] | null | undefined;
};

function getActionText(remainingToSpendCents: number | null, readyForActionCount: number, daysUntilNextIncome: number, hasRisk: boolean) {
  if (readyForActionCount > 0) {
    return {
      title: "Review frozen purchases",
      body: `${readyForActionCount} aankoop/aankopen staan klaar om te bevestigen of annuleren.`,
      href: "/budget?tab=tactical",
      cta: "Open Tactical Control",
    };
  }
  if (remainingToSpendCents != null && remainingToSpendCents < 0) {
    return {
      title: "Je zit over budget",
      body: "Plan low-spend dagen en controleer je belangrijkste risicosignalen.",
      href: "/budget?tab=analysis",
      cta: "Open Analysis",
    };
  }
  if (remainingToSpendCents != null && remainingToSpendCents < 5000) {
    return {
      title: "Bijna aan je limiet",
      body: "Log zorgvuldig en prioriteer alleen noodzakelijke uitgaven voor de rest van deze periode.",
      href: "/budget?tab=overview#budget-quick-log",
      cta: "Log snel",
    };
  }
  if (daysUntilNextIncome > 7 && hasRisk) {
    return {
      title: "Blijf deze week voor",
      body: "Je hebt nog ruimte, maar er is een risicosignaal dat nu aandacht vraagt.",
      href: "/budget?tab=analysis",
      cta: "Bekijk risicosignaal",
    };
  }
  return {
    title: "Houd momentum",
    body: "Quick-log nieuwe uitgaven om je voorspelling accuraat en stabiel te houden.",
    href: "/budget?tab=overview#budget-quick-log",
    cta: "Open quick log",
  };
}

export function BudgetNextActionCard({ remainingToSpendCents, readyForActionCount, daysUntilNextIncome, insights }: Props) {
  const hasRisk = (insights ?? []).some((i) => i.type === "warning" || i.type === "critical");
  const action = getActionText(remainingToSpendCents, readyForActionCount, daysUntilNextIncome, hasRisk);
  const statusLabel =
    remainingToSpendCents == null ? "History mode" : remainingToSpendCents < 0 ? "High urgency" : "Actionable now";

  return (
    <section className="card-simple-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Volgende beste actie</h2>
          <span className="rounded-full border border-[var(--semantic-ring)]/30 bg-[var(--semantic-accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mode-text-soft)]">
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-lg font-semibold text-[var(--text-primary)]">{action.title}</p>
        <p className="text-sm text-[var(--text-muted)]">{action.body}</p>
        <Link
          href={action.href}
          className="btn-primary inline-flex h-auto w-auto items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]"
        >
          {action.cta}
        </Link>
      </div>
    </section>
  );
}
