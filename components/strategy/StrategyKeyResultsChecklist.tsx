"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStrategyKrCheck } from "@/app/actions/strategy";

type Props = {
  keyResultsText: string | null;
  krChecked: boolean[];
};

export function StrategyKeyResultsChecklist({ keyResultsText, krChecked }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lines = (keyResultsText ?? "").trim().split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  function toggle(index: number, checked: boolean) {
    startTransition(async () => {
      await updateStrategyKrCheck(index, checked);
      router.refresh();
    });
  }

  const checkedArr = Array.isArray(krChecked) ? krChecked : [];
  const doneCount = lines.filter((_, i) => checkedArr[i]).length;

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Voortgang key results</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Vink af wat je al hebt bereikt. {doneCount} / {lines.length} afgevinkt.
        </p>
      </div>
      <ul className="divide-y divide-[var(--card-border)] p-2">
        {lines.map((line, index) => {
          const checked = !!checkedArr[index];
          return (
            <li key={index} className="flex items-center gap-3 px-2 py-2.5">
              <button
                type="button"
                onClick={() => toggle(index, !checked)}
                disabled={pending}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors disabled:opacity-50"
                style={{
                  borderColor: checked ? "var(--accent-focus)" : "var(--card-border)",
                  backgroundColor: checked ? "rgba(0, 229, 255, 0.15)" : "transparent",
                }}
                aria-label={checked ? "Afvinken ongedaan maken" : "Afvinken"}
              >
                {checked && <span className="text-sm font-bold text-[var(--accent-focus)]">✓</span>}
              </button>
              <span className={`text-sm ${checked ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                {line}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
