"use client";

import { useRouter } from "next/navigation";
import { formatMonthYearShort } from "@/lib/utils/date-locale";

const MONTHS_BACK = 12;

export function BudgetHistorySelector({ currentMonth }: { currentMonth?: string }) {
  const router = useRouter();
  const now = new Date();
  const options = [{ value: "", label: "Current" }];
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({
      value,
      label: formatMonthYearShort(d.getFullYear(), d.getMonth() + 1),
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v) router.push(`/budget?month=${v}`);
    else router.push("/budget");
  }

  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
      <span>Periode</span>
      <select
        value={currentMonth ?? ""}
        onChange={handleChange}
        className="rounded-[var(--hq-btn-radius,14px)] border border-[rgba(var(--mode-rgb),0.22)] bg-[var(--bg-elevated)]/50 px-3 py-2 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[rgba(var(--mode-rgb),0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--mode-rgb),0.22)]"
        aria-label="Select budget period to view"
      >
        {options.map((o) => (
          <option key={o.value || "current"} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
