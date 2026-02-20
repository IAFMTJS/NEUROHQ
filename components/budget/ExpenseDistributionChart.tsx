"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { getCurrencySymbol } from "@/lib/utils/currency";

const COLORS = [
  "var(--accent-focus)",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

type Props = {
  categoryTotals: Record<string, number>;
  currency?: string;
};

export function ExpenseDistributionChart({ categoryTotals, currency = "EUR" }: Props) {
  const symbol = getCurrencySymbol(currency);
  const data = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, label: `${name}: ${symbol}${(value / 100).toFixed(2)}` }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-6 text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">Uitgaven per categorie</h3>
        <p className="text-sm text-[var(--text-muted)]">Nog geen uitgaven met categorie deze maand.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-4">Uitgaven per categorie</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number | undefined) => [`${symbol}${((value ?? 0) / 100).toFixed(2)}`, "Uitgegeven"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
