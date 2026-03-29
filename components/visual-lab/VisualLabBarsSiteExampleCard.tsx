"use client";

import { SegmentedBar, ZoneBandBar } from "@/components/visual-lab/VisualLabBars";

/**
 * Static copy mirrors Growth Command Center (`GrowthCommandCenter`) and
 * Strategische stack · Budget (`StrategyIntegratedOverview`) — bars show alternative visuals for the same kind of data.
 */
export function VisualLabBarsSiteExampleCard() {
  return (
    <article className="overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.22)] bg-gradient-to-br from-[rgba(var(--mode-rgb-deep),0.38)] via-[rgba(var(--mode-rgb),0.12)] to-[var(--bg-primary)]/95 shadow-[0_0_0_1px_rgba(var(--mode-rgb),0.08),0_0_40px_rgba(var(--mode-rgb),0.1),0_24px_56px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <header className="border-b border-[rgba(var(--mode-rgb),0.14)] px-4 py-4 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Growth command center</p>
        <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight text-[var(--text-primary)] [text-shadow:0_0_20px_rgba(var(--mode-rgb),0.2)] sm:text-2xl">
          {"Slapen & ritme — 8 weken"}
        </h3>
        <p className="mt-2 text-xs leading-snug text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">Stabiliteit</span>
          <span className="text-[var(--text-muted)]"> · focus-protocol</span>
          <span className="ml-2 inline-block rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">
            Jouw focus
          </span>
        </p>
      </header>

      <div className="space-y-6 px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Week-indicator</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
              Week 3 <span className="text-[var(--text-muted)]">/</span> 8
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-[var(--accent-focus)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.35)]">
            57%
          </p>
        </div>

        <p className="text-xs leading-snug text-[var(--text-secondary)]">
          Voortgang deze week: <span className="font-medium text-[var(--text-primary)]">4</span> van{" "}
          <span className="font-medium text-[var(--text-primary)]">7</span> taken,{" "}
          <span className="tabular-nums">57</span>% — zelfde regel als op{" "}
          <span className="text-[var(--text-muted)]">/learning</span> (hieronder als segmentbalk per week).
        </p>

        <SegmentedBar
          label="Protocolweken · voltooid per week"
          caption="W1–W2 afgerond · W3 bezig (57%) · W4–W8 nog open"
          fills={[1, 1, 0.57, 0, 0, 0, 0, 0]}
          segmentLabels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]}
        />

        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
          Week 3 — Ritme vasthouden: vaste bedtijd, schermen omlaag vóór slaap.
        </p>

        <div className="border-t border-[rgba(var(--mode-rgb),0.12)] pt-5">
          <div className="relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-gradient-to-br from-emerald-500/10 via-[var(--bg-elevated)]/90 to-[var(--bg-primary)] p-4 shadow-[0_0_28px_rgba(16,185,129,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">Budget</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">€186,42 resterend (periode)</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Veilige dag: <span className="font-medium text-[var(--text-primary)]">€42,10</span>
              <span className="text-[var(--text-muted)]"> · </span>
              <span>9 dagen tot inkomen</span>
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Deze week uitgegeven: €58,30</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Budget-discipline-index: 68</p>

            <ZoneBandBar
              className="mt-4"
              label="Budget-discipline-index (zone)"
              caption="68 — in de targetzone (voorbeeld)"
              pct={68}
              bandFootLabels={["Strak", "Doel", "Ruim"]}
            />
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
          Statisch voorbeeld: teksten en bedragen zijn niet live; ze volgen de formuleringen van Strategische stack en Growth command center.
        </p>
      </div>
    </article>
  );
}
