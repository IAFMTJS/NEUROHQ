"use client";

import { useMemo, useState } from "react";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { LineGraph } from "@/components/hud-test/LineGraph";
import { HudButton } from "@/components/hud-test/HudButton";
import { GlassButton } from "@/components/hud-test/GlassButton";
import { OutlineButton } from "@/components/hud-test/OutlineButton";
import { AlertButton } from "@/components/hud-test/AlertButton";
import { Divider1px } from "@/components/hud-test/Divider1px";
import { StatusDot } from "@/components/hud-test/StatusDot";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { BottomNav } from "@/components/hud-test/BottomNav";
import { AdaptiveStatusRing, AlertRing, DoubleRing, HighAlertRing, LockedRing, SegmentedTacticalRing } from "@/components/hud-test/StatRings";
import { DataCard } from "@/components/hud-test/DataCard";
import { MissionCard } from "@/components/hud-test/MissionCard";
import { StatsCard } from "@/components/hud-test/StatsCard";
import styles from "@/components/hud-test/hud.module.css";

export default function TestPage() {
  const [navIndex, setNavIndex] = useState("ops");
  const graphData = useMemo(() => [24, 30, 34, 31, 45, 42, 51, 48, 58, 54, 62, 66], []);
  const navItems = useMemo(
    () => [
      { id: "hq", label: "HQ" },
      { id: "ops", label: "Ops" },
      { id: "budget", label: "Budget" },
      { id: "graph", label: "Graph" },
      { id: "comms", label: "Comms" },
    ],
    []
  );

  return (
    <main className={`relative min-h-screen overflow-hidden ${styles.cinematicBackdrop}`}>
      <div className={styles.backgroundAtmosphere} aria-hidden />
      <div className={styles.colorBlend} aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1024px] items-center justify-center p-6">
        <SciFiPanel className="w-full max-w-[840px]" variant="command">
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9BEFFF]">
              Sector 07 / Command Interface
            </p>
            <h1 className="text-2xl font-semibold text-[#EAF6FF]">Cinematic HUD Validation</h1>
            <p className={styles.metaLabel}>Active Cycle • 7 Days Remaining</p>
            <Divider1px />

            <div className="grid gap-6 md:grid-cols-[minmax(320px,340px)_1fr]">
              <div
                className={`relative z-30 flex justify-center overflow-visible p-2 md:justify-start md:pr-6 ${styles.focusPrimary}`}
                data-testid="ring-region"
              >
                <EnergyRing progress={72} value="€2,430" label="BUDGET" />
              </div>
              <div className={`relative z-0 space-y-3 ${styles.focusSecondary}`} data-testid="graph-region">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8EDFFF]">
                    Resource Flux
                  </p>
                  <StatusDot size={4} color="cyan" />
                </div>
                <LineGraph data={graphData} />
              </div>
            </div>

            <Divider1px />
            <div className={`grid gap-4 md:grid-cols-3 ${styles.focusLow}`}>
              <DataCard title="Data Card" value="€4,980" progress={68} meta="Cycle • 14 Days" />
              <StatsCard title="Stats Card" value="91%" delta="+7% vs last week" ringValue={64} />
              <MissionCard title="Mission Card" xp={120} tags={["Ops", "Priority"]} />
            </div>

            <Divider1px />
            <div className={`grid gap-4 md:grid-cols-2 ${styles.focusSecondary}`}>
              <div className="rounded-[18px] border border-[rgba(0,200,255,0.2)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#9befff]">Double Ring</p>
                <DoubleRing outerValue={78} innerValue={43} />
              </div>
              <div className="rounded-[18px] border border-[rgba(0,200,255,0.2)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#9befff]">Segmented Ring</p>
                <SegmentedTacticalRing value={57} />
              </div>
            </div>
            <div className={`grid gap-4 md:grid-cols-2 ${styles.focusSecondary}`}>
              <div className="rounded-[18px] border border-[rgba(255,154,60,0.25)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#ffbf8e]">Alert Ring</p>
                <AlertRing value={68} />
              </div>
              <div className="rounded-[18px] border border-[rgba(234,246,255,0.12)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#b9c8d4]">Locked Ring</p>
                <LockedRing value={34} />
              </div>
            </div>
            <div className={`rounded-[18px] border border-[rgba(255,80,80,0.32)] p-4 ${styles.focusPrimary}`}>
              <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#ff9fa1]">
                High Alert Ring (&lt;20%)
              </p>
              <HighAlertRing value={18} />
            </div>
            <div className={`grid gap-4 md:grid-cols-2 ${styles.focusSecondary}`}>
              <div className="rounded-[18px] border border-[rgba(0,232,118,0.25)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#9fffcf]">
                  Green Ring (60–80%)
                </p>
                <AdaptiveStatusRing value={72} label="Healthy" />
              </div>
              <div className="rounded-[18px] border border-[rgba(0,255,136,0.3)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#b8ffdd]">
                  Peak Green Ring (80–100%)
                </p>
                <AdaptiveStatusRing value={92} label="Optimal" />
              </div>
            </div>

            <Divider1px />
            <div className={`flex flex-wrap gap-3 ${styles.focusSecondary}`}>
              <HudButton data-testid="primary-button-region">Engage</HudButton>
              <GlassButton>Shield</GlassButton>
              <OutlineButton>Passive</OutlineButton>
              <AlertButton>Alert</AlertButton>
            </div>
            <div className={`flex flex-wrap gap-3 ${styles.focusLow}`}>
              <HudButton state="loading">Charging</HudButton>
              <GlassButton disabled>Locked</GlassButton>
              <OutlineButton state="disabled">Disabled</OutlineButton>
              <AlertButton state="loading">Overheat</AlertButton>
              <GlassButton variant="alert" loading>
                Breach
              </GlassButton>
            </div>

            <Divider1px />
            <div className="grid gap-3 md:grid-cols-3">
              <SciFiPanel variant="glass" bodyClassName="p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#9befff]">Glass Panel</p>
                <p className={styles.metaLabel}>Secondary container</p>
              </SciFiPanel>
              <SciFiPanel variant="tactical" bodyClassName="p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#ffbf8e]">Tactical Panel</p>
                <p className={styles.metaLabel}>Alert context</p>
              </SciFiPanel>
              <SciFiPanel variant="minimal" bodyClassName="p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#9befff]">Minimal Panel</p>
                <p className={styles.metaLabel}>Nested content</p>
              </SciFiPanel>
            </div>
          </div>
        </SciFiPanel>
      </div>

      <BottomNav items={navItems} activeId={navIndex} onChange={setNavIndex} />
    </main>
  );
}

