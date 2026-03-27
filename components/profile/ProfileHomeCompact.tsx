"use client";

import Link from "next/link";
import type { XPFullContext } from "@/app/actions/xp-context";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";
import { reportInsightsHref } from "@/lib/profile-routes";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";

type Props = {
  identity: XPFullContext["identity"];
  insightState: XPFullContext["insightState"];
};

function bandHint(band: "low" | "medium" | "high"): string {
  if (band === "high") return "Je zit in een sterke flow.";
  if (band === "medium") return "Stabiel ritme — hou de lijn strak.";
  return "Kleine actie vandaag verzet veel.";
}

function ringModeFromProfile(
  level: number,
  band: "low" | "medium" | "high" | undefined
): EnergyRingMode {
  if (band === "high") return "green-peak";
  if (band === "medium") return "green";
  if (band === "low") return "alert";
  if (level >= 30) return "green-peak";
  if (level >= 12) return "green";
  return "default";
}

function OrbitTile({
  title,
  children,
  href,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const body = (
    <div
      className={`rounded-xl border border-[var(--card-border)]/65 bg-[var(--bg-primary)]/45 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-colors hover:border-[rgba(var(--mode-rgb),0.35)] ${href ? "cursor-pointer hover:bg-[var(--bg-elevated)]/25" : ""} ${className}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{title}</p>
      <div className="mt-1.5 text-sm font-semibold leading-snug text-[var(--text-primary)]">{children}</div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block min-w-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]">
        {body}
      </Link>
    );
  }
  return body;
}

export function ProfileHomeCompact({ identity, insightState }: Props) {
  const barPct = Math.round(xpProgressInLevel(identity.total_xp) * 100);
  const { current: curXp, needed: spanXp } = xpRangeForNextLevel(identity.total_xp);
  const coach = insightState?.coachRecommendations[0]?.body;
  const trend = insightState?.trend.microcopy;
  const insightOneLiner =
    (coach ?? trend ?? (insightState ? bandHint(insightState.momentum.band) : null)) ??
    "Log een missie om je curve te vullen.";

  const band = insightState?.momentum.band;
  const ringMode = ringModeFromProfile(identity.level, band);
  const momentumLabel = insightState
    ? `${insightState.momentum.score} · ${insightState.momentum.band === "high" ? "Sterk" : insightState.momentum.band === "medium" ? "Stabiel" : "Opbouw"}`
    : "—";
  const nextTarget =
    identity.level >= 100 ? `Cap ${identity.level}` : `Level ${identity.level + 1}`;
  const ringSize = 236;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--card-border)]/80 border-t-[rgba(var(--mode-rgb),0.26)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.16)] via-[var(--bg-surface)]/20 to-[var(--bg-primary)]/35 px-4 py-6 shadow-[0_0_40px_rgba(var(--mode-rgb),0.08)] backdrop-blur-xl sm:px-6"
      data-tutorial="profile-home-orbit"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--mode-rgb),0.18),transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-[1] mb-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--semantic-accent)]">Command status</p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">{identity.rank}</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {identity.total_xp.toLocaleString()} totaal XP · {nextTarget}: {curXp} / {spanXp} in deze level
        </p>
      </header>

      <div className="relative z-[1] mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-[1fr_minmax(0,280px)_1fr] md:items-center md:gap-4">
        <div className="order-2 hidden flex-col justify-center gap-3 md:order-1 md:flex">
          <OrbitTile title="Streak actief">{identity.streak.current} dagen</OrbitTile>
          <OrbitTile title="Langste reeks">{identity.streak.longest} dagen</OrbitTile>
          <OrbitTile title="Momentum" className="border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.12)]">
            {momentumLabel}
          </OrbitTile>
        </div>

        <div className="order-1 flex flex-col items-center justify-center md:order-2">
          <div className="relative">
            <div
              className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.2)_0%,transparent_62%)] blur-md sm:h-[120%] sm:w-[120%]"
              aria-hidden
            />
            <div className="relative drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <EnergyRing
                size={ringSize}
                progress={barPct}
                label="LEVEL"
                value={String(identity.level)}
                mode={ringMode}
              />
            </div>
          </div>
          <p className="mt-3 max-w-[240px] text-center text-[11px] leading-relaxed text-[var(--text-secondary)]">
            Ring toont voortgang naar {nextTarget}.{" "}
            <Link href="/xp" className="font-semibold text-[var(--accent-focus)] hover:underline">
              XP-bridge
            </Link>
          </p>
        </div>

        <div className="order-3 hidden flex-col justify-center gap-3 md:flex">
          <OrbitTile title="Volgende rang">{identity.next_unlock.rank}</OrbitTile>
          <OrbitTile title="XP tot unlock" href="/xp">
            Nog {identity.next_unlock.xpNeeded.toLocaleString()} XP
          </OrbitTile>
          <OrbitTile title="In deze level" href="/xp">
            {curXp} / {spanXp} XP · {barPct}%
          </OrbitTile>
        </div>

        <div className="order-4 flex flex-wrap justify-center gap-2 md:col-span-3 md:hidden">
          <OrbitTile title="Streak">{identity.streak.current}d</OrbitTile>
          <OrbitTile title="Unlock" href="/xp">
            {identity.next_unlock.xpNeeded} XP
          </OrbitTile>
          <OrbitTile title="Mom">{insightState ? insightState.momentum.score : "—"}</OrbitTile>
        </div>
      </div>

      <div className="relative z-[1] mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.14)] px-4 py-3.5 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Insight</p>
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--text-primary)]">{insightOneLiner}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
          <Link href={reportInsightsHref("overview")} className="text-[var(--accent-focus)] hover:underline">
            Volledige insights
          </Link>
          <span className="text-[var(--text-muted)]" aria-hidden>
            ·
          </span>
          <Link href="/xp" className="text-[var(--text-muted)] hover:text-[var(--accent-focus)] hover:underline">
            Voorspelling
          </Link>
        </div>
      </div>
    </section>
  );
}
