"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { tierLabelNl } from "@/lib/growth/tier-labels";

const STORAGE_KEY = "neurohq-growth-strip-dismiss";

function stripSignature(snap: GrowthEngineSnapshot): string {
  const ap = snap.activeProtocol;
  return `${ap?.slug ?? "none"}|${ap?.weekIndex ?? 0}|${snap.engineTier}`;
}

type Props = {
  snap: GrowthEngineSnapshot;
};

export function GrowthDashboardStripClient({ snap }: Props) {
  const sig = useMemo(() => stripSignature(snap), [snap]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setDismissed(raw === sig);
    } catch {
      setDismissed(false);
    }
  }, [sig]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, sig);
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  const { activeProtocol, engineTier, tierAligned, brainLogged } = snap;

  return (
    <div className="relative z-10 mb-1 w-full pt-2">
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--card-border)]/90 bg-[var(--bg-elevated)]/45 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          aria-label="Growth snapshot sluiten"
        >
          ✕
        </button>
        <div className="min-w-0 pr-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]">Growth snapshot</p>
          <p className="mt-0.5 truncate text-sm text-[var(--text-primary)]">
            {activeProtocol ? (
              <>
                <span className="font-semibold">{activeProtocol.title}</span>
                <span className="text-[var(--text-muted)]">
                  {" "}
                  · wk {activeProtocol.weekIndex} · {tierLabelNl(activeProtocol.protocolTier)}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)]">Geen protocol-focus — zet op Growth</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              tierAligned || !activeProtocol
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border border-amber-500/40 bg-amber-500/10 text-amber-100"
            }`}
          >
            Engine {tierLabelNl(engineTier)}
            {!brainLogged && <span className="ml-1 font-normal opacity-80">(schatting)</span>}
          </span>
          <Link
            href="/learning#growth-command"
            className="text-xs font-semibold text-[var(--semantic-accent)] underline-offset-2 hover:underline"
          >
            Growth
          </Link>
          <Link
            href="/strategy"
            className="text-xs font-semibold text-[var(--text-muted)] underline-offset-2 hover:text-[var(--semantic-accent)] hover:underline"
          >
            Strategy
          </Link>
        </div>
      </div>
    </div>
  );
}
