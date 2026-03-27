"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { GrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { tierLabelNl } from "@/lib/growth/tier-labels";

const STORAGE_KEY = "neurohq-growth-strip-dismiss";

function stripSignature(snap: GrowthEngineSnapshot): string {
  const ap = snap.activeProtocol;
  return `${ap?.slug ?? "none"}|${ap?.weekIndex ?? 0}|${snap.engineTier}`;
}

type Props = {
  snap: GrowthEngineSnapshot;
  /** Eenvoudige modus: geen growth shortcut-toast (nav heeft Growth/Strategy). */
  simplifiedContent?: boolean;
};

/** Snapshot as a single toast so the command bridge can own the fold without an inline strip. */
export function GrowthDashboardStripClient({ snap, simplifiedContent = false }: Props) {
  const sig = useMemo(() => stripSignature(snap), [snap]);
  const toastShownForSig = useRef<string | null>(null);

  useEffect(() => {
    if (simplifiedContent) return;
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === sig) return;
    } catch {
      /* continue */
    }
    if (toastShownForSig.current === sig) return;
    toastShownForSig.current = sig;

    const { activeProtocol, engineTier, tierAligned, brainLogged } = snap;

    const summary = activeProtocol ? (
      <>
        <span className="font-semibold text-[var(--text-primary)]">{activeProtocol.title}</span>
        <span className="text-[var(--text-muted)]">
          {" "}
          · wk {activeProtocol.weekIndex} · {tierLabelNl(activeProtocol.protocolTier)}
        </span>
      </>
    ) : (
      <span className="text-[var(--text-secondary)]">Geen protocol-focus — zet op Growth</span>
    );

    const tierNote =
      !tierAligned && activeProtocol ? (
        <p className="mt-1 text-[11px] text-amber-200/90">Protocol-tier en engine-tier lopen uiteen.</p>
      ) : null;

    toast.custom(
      (id) => (
        <div
          className="relative w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--card-border)]/90 bg-[var(--bg-elevated)]/95 px-4 py-3 pr-9 text-left shadow-xl backdrop-blur-md"
          role="status"
        >
          <button
            type="button"
            className="absolute right-2 top-2 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
            aria-label="Growth snapshot sluiten en niet meer tonen voor deze snapshot"
            onClick={() => {
              try {
                localStorage.setItem(STORAGE_KEY, sig);
              } catch {
                /* ignore */
              }
              toast.dismiss(id);
            }}
          >
            ✕
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]">Growth snapshot</p>
          <p className="mt-1 text-sm">{summary}</p>
          {tierNote}
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Engine {tierLabelNl(engineTier)}
            {!brainLogged && <span className="opacity-80"> (schatting)</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--card-border)] bg-[var(--semantic-accent)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--semantic-accent)]/25"
              onClick={() => {
                toast.dismiss(id);
                window.location.assign("/learning#growth-command");
              }}
            >
              Growth
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              onClick={() => {
                toast.dismiss(id);
                window.location.assign("/strategy");
              }}
            >
              Strategy
            </button>
            <button
              type="button"
              className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_KEY, sig);
                } catch {
                  /* ignore */
                }
                toast.dismiss(id);
              }}
            >
              Niet meer tonen
            </button>
          </div>
        </div>
      ),
      { duration: 26_000 }
    );
  }, [sig, snap, simplifiedContent]);

  return null;
}
