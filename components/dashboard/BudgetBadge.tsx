"use client";

import { getCurrencySymbol } from "@/lib/utils/currency";
import { HudLinkButton } from "@/components/hud-test/HudLinkButton";

type Props = {
  /** Remaining budget in cents (can be negative). */
  budgetRemainingCents: number;
  currency: string;
};

/** Compact badge for header: "€X rest" with link to /budget. */
export function BudgetBadge({ budgetRemainingCents, currency }: Props) {
  const symbol = getCurrencySymbol(currency);
  const amount = Math.abs(budgetRemainingCents) / 100;
  const isNegative = budgetRemainingCents < 0;

  return (
    <HudLinkButton
      href="/budget"
      className="dashboard-hud-chip shrink-0 whitespace-nowrap rounded-[10px] px-2 text-[9px] font-semibold normal-case tracking-[0.03em]"
      style={{ height: "26px", minHeight: "26px", paddingTop: 0, paddingBottom: 0, paddingLeft: "6px", paddingRight: "6px" }}
      aria-label={`Budget: ${isNegative ? "−" : ""}${symbol}${amount.toFixed(0)} ${isNegative ? "over" : "rest"}`}
    >
      <span className="tabular-nums">
        {isNegative && "−"}
        {symbol}
        {amount.toFixed(0)}
      </span>
      <span className="text-[var(--text-muted)]">
        {isNegative ? "over" : "rest"}
      </span>
    </HudLinkButton>
  );
}
