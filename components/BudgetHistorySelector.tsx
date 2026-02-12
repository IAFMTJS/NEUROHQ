"use client";

import { useRouter } from "next/navigation";

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
      label: d.toLocaleString("default", { month: "short", year: "numeric" }),
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v) router.push(`/budget?month=${v}`);
    else router.push("/budget");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neuro-muted">View</span>
      <select
        value={currentMonth ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-neuro-border bg-neuro-dark px-2 py-1.5 text-neuro-silver focus:border-neuro-blue focus:outline-none"
        aria-label="Select budget period to view"
      >
        {options.map((o) => (
          <option key={o.value || "current"} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
