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
};

/** Missions page header: DCIC mode tint comes from SciFiPanel; subtitle shows current DCIC mode. */
export function TasksHeaderChrome({ dateStr }: Props) {
  const { gameState } = useDCICGameState();
  const dcicMode = gameState?.mode?.current ?? "focus";

  return (
    <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      <div className="[&>*+*]:mt-0">
        <HQPageHeader
          title="Missions"
          subtitle={
            <>
              <span className="block text-[var(--accent-focus)]">{dcicModeLabel(dcicMode)}</span>
              <span className="mt-1 block text-[var(--text-muted)]">
                XP-missies · {dateStr} · Performance engine · One focus at a time
              </span>
            </>
          }
          backHref="/dashboard"
        />
      </div>
    </SciFiPanel>
  );
}
