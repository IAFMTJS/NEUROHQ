"use client";

import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { HQPageHeader } from "@/components/hq/HQPageHeader";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";

function dcicModeLabel(mode: string | undefined): string {
  if (mode === "war") return "War mode";
  if (mode === "recovery") return "Recovery mode";
  return "Focus mode";
}

type Props = {
  dateStr: string;
  /** Shorter copy when Simplified content is on in settings. */
  simplified?: boolean;
  /**
   * Zelfde frosted gradient-taal als TasksTabsShell command deck (geen SciFiPanel-hoeken).
   */
  matchCommandDeck?: boolean;
};

/** Missions page header: DCIC mode tint; subtitle toont huidige DCIC-modus. */
export function TasksHeaderChrome({ dateStr, simplified = false, matchCommandDeck = false }: Props) {
  const { gameState } = useDCICGameState();
  const dcicMode = gameState?.mode?.current ?? "focus";

  const headerInner = (
    <div className="[&>*+*]:mt-0">
      <HQPageHeader
        title="Missions"
        subtitle={
          simplified ? (
            <span className="mt-1 block text-[var(--text-muted)]">
              Today · {dateStr} · {dcicModeLabel(dcicMode)}
            </span>
          ) : (
            <>
              <span className="block text-[var(--accent-focus)]">{dcicModeLabel(dcicMode)}</span>
              <span className="mt-1 block text-[var(--text-muted)]">
                XP-missies · {dateStr} · Performance engine · One focus at a time
              </span>
            </>
          )
        }
        backHref="/dashboard"
      />
    </div>
  );

  if (matchCommandDeck) {
    return (
      <div className="relative mb-3 overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.22)] bg-gradient-to-br from-[rgba(8,26,42,0.94)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.12)] shadow-[0_0_32px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.12),transparent_58%)]"
          aria-hidden
        />
        <div className="relative z-[1] p-4 md:p-5">{headerInner}</div>
      </div>
    );
  }

  return (
    <SciFiPanel variant="flat-glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      {headerInner}
    </SciFiPanel>
  );
}
