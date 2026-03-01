"use client";

import Link from "next/link";
import { useTodayEngine } from "@/hooks/useTodayEngine";

function tagLabel(tag: "household" | "administration" | "social"): string {
  if (tag === "household") return "huishouden";
  if (tag === "administration") return "administratie";
  return "sociaal";
}

function levelLabel(level: 1 | 2 | 3): string {
  if (level === 1) return "Zachte spiegel";
  if (level === 2) return "Patroon benoemen";
  return "Identiteit-confrontatie";
}

export function ConfrontationBanner() {
  const { result, isLoading, error } = useTodayEngine();

  if (isLoading || error || !result?.forcedConfrontation) return null;

  const c = result.forcedConfrontation;

  return (
    <section className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
            Confrontatie-missie · {levelLabel(c.level)} · {tagLabel(c.tag)}
          </p>
          <p className="mt-1 text-sm font-medium text-amber-50">
            {c.title}
          </p>
          <p className="mt-1 text-xs text-amber-100/90">
            Je hebt {tagLabel(c.tag)} {c.skipped} keer weggeduwd. Geen oordeel over jou als persoon — wel een duidelijke volgende stap voor je gedrag.
          </p>
          <p className="mt-1 text-xs text-amber-100/80">
            {c.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/tasks"
            className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-amber-300"
          >
            Naar Missions
          </Link>
          <p className="text-[10px] text-amber-100/70">
            Geen shame. Wel eerlijk: één actie vandaag.
          </p>
        </div>
      </div>
    </section>
  );
}

