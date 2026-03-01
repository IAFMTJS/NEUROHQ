import { HQShortcutGrid } from "@/components/hq/HQShortcutGrid";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";

/** Shortcuts-only card for quick navigation. */
export function DashboardUpdatesCard() {
  return (
    <SciFiPanel className="overflow-hidden" bodyClassName="p-0" variant="minimal">
      <div className="border-b border-[var(--card-border)] px-3 py-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Snelkoppelingen
        </h2>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          Snelle links
        </p>
      </div>
      <div className="p-2.5">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Snelkoppelingen
          </p>
          <HQShortcutGrid />
        </div>
      </div>
    </SciFiPanel>
  );
}
