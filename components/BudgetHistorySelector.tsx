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
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[var(--text-muted)]">View</span>
      <select
        value={currentMonth ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
        aria-label="Select budget period to view"
      >
        {options.map((o) => (
          <option key={o.value || "current"} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
