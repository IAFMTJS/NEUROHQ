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
    <label className="flex flex-wrap items-center gap-1 text-[10px] leading-none text-[var(--text-muted)]">
      <span className="shrink-0">Periode</span>
      <select
        value={currentMonth ?? ""}
        onChange={handleChange}
        className="max-w-[9.5rem] rounded border border-blue-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-slate-100 shadow-[inset_0_1px_0_rgba(59,130,246,0.12)] [color-scheme:dark] focus:border-blue-400/45 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
        aria-label="Select budget period to view"
      >
        {options.map((o) => (
          <option key={o.value || "current"} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
