"use client";

import { useState } from "react";
import Link from "next/link";
import type { XPFullContext } from "@/app/actions/xp-context";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";
import { reportInsightsHref } from "@/lib/profile-routes";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";
import { MoodManualPanel } from "@/components/mood/MoodManualPanel";
import { MOOD_LABEL_META, type MoodLabel } from "@/lib/mood-intervention-config";

type Props = {
  identity: XPFullContext["identity"];
  insightState: XPFullContext["insightState"];
  /** Dag-mood uit daily_state (server). */
  initialMoodLabel?: string | null;
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

const tileShell =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.07)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-3 py-2.5 transition-colors";

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
      className={`${tileShell} hover:border-[rgba(var(--mode-rgb),0.16)] hover:bg-[rgba(var(--mode-rgb-deep),0.12)] ${href ? "cursor-pointer" : ""} ${className}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{title}</p>
      <div className="mt-1.5 text-sm font-semibold leading-snug text-[var(--text-primary)]">{children}</div>
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
      >
        {body}
      </Link>
    );
  }
  return body;
}

export function ProfileHomeCompact({ identity, insightState, initialMoodLabel }: Props) {
  const [moodOpen, setMoodOpen] = useState(false);
  const [moodLabel, setMoodLabel] = useState<MoodLabel | null>(
    (initialMoodLabel as MoodLabel | null) ?? null
  );
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
  const nextTarget = identity.level >= 100 ? `Cap ${identity.level}` : `Level ${identity.level + 1}`;
  const ringSize = 236;

  return (
    <section
      className="relative overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.09)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.22)] via-[var(--bg-elevated)]/12 to-[var(--bg-primary)]/28 px-4 py-5 shadow-[0_12px_48px_rgba(0,0,0,0.4),0_0_28px_rgba(var(--mode-rgb),0.05)] backdrop-blur-xl sm:px-6"
      data-tutorial="profile-home-orbit"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.14),transparent_58%)]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-[1fr_minmax(0,280px)_1fr] md:items-center md:gap-4">
        <div className="order-2 hidden flex-col justify-center gap-3 md:order-1 md:flex">
          <OrbitTile title="Rang">
            <span className="line-clamp-2 text-[13px] leading-snug" title={identity.rank}>
              {identity.rank}
            </span>
          </OrbitTile>
          <OrbitTile title="Streak actief">{identity.streak.current} dagen</OrbitTile>
          <OrbitTile title="Langste reeks">{identity.streak.longest} dagen</OrbitTile>
          <OrbitTile title="Momentum" className="bg-[rgba(var(--mode-rgb-deep),0.1)]">
            {momentumLabel}
          </OrbitTile>
        </div>

        <div className="order-1 flex flex-col items-center justify-center md:order-2">
          <div className="relative">
            <div
              className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.16)_0%,transparent_62%)] blur-md sm:h-[120%] sm:w-[120%]"
              aria-hidden
            />
            <div className="relative drop-shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
              <EnergyRing
                profileOrbit
                size={ringSize}
                progress={barPct}
                label={`Level ${identity.level}`}
                value={`${barPct}%`}
                mode={ringMode}
              />
            </div>
          </div>
          <p className="mt-3 max-w-[260px] text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
            <span className="tabular-nums text-[var(--text-secondary)]">
              {curXp.toLocaleString()} / {spanXp.toLocaleString()} XP
            </span>{" "}
            naar {nextTarget} · {identity.total_xp.toLocaleString()} totaal
          </p>
          <p className="mt-1.5 text-center">
            <Link
              href="/xp"
              className="text-[11px] font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
            >
              XP-bridge
            </Link>
          </p>
        </div>

        <div className="order-3 hidden flex-col justify-center gap-3 md:flex">
          <OrbitTile title="Volgende rang">{identity.next_unlock.rank}</OrbitTile>
          <OrbitTile title="XP tot unlock" href="/xp">
            Nog {identity.next_unlock.xpNeeded.toLocaleString()} XP
          </OrbitTile>
          <OrbitTile title="Totaal XP" href="/xp">
            {identity.total_xp.toLocaleString()}
          </OrbitTile>
        </div>

        <div className="order-4 flex flex-wrap justify-center gap-2 md:col-span-3 md:hidden">
          <OrbitTile title="Rang">
            <span className="max-w-[100px] truncate text-xs" title={identity.rank}>
              {identity.rank}
            </span>
          </OrbitTile>
          <OrbitTile title="Streak">{identity.streak.current}d</OrbitTile>
          <OrbitTile title="Unlock" href="/xp">
            {identity.next_unlock.xpNeeded} XP
          </OrbitTile>
          <OrbitTile title="XP %">{barPct}%</OrbitTile>
        </div>
      </div>

      <div
        className={`relative z-[1] mt-5 ${tileShell} border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb-deep),0.07)] px-4 py-3.5 sm:px-5`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300/90">Mood</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {moodLabel && MOOD_LABEL_META[moodLabel] ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-violet-950/35 px-2.5 py-1 text-[11px] font-semibold text-violet-100/95">
              <span aria-hidden>{MOOD_LABEL_META[moodLabel].emoji}</span>
              {MOOD_LABEL_META[moodLabel].label}
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">Nog geen mood vandaag</span>
          )}
          <button
            type="button"
            onClick={() => setMoodOpen(true)}
            className="rounded-lg border border-violet-500/40 bg-violet-950/30 px-3 py-1.5 text-[11px] font-semibold text-violet-100/95 hover:border-violet-400/50"
          >
            Update mood
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          Zelfde flow als Brain Status op het dashboard — energie/focus daar, mood hier.
        </p>
      </div>

      <MoodManualPanel
        open={moodOpen}
        onClose={() => setMoodOpen(false)}
        onMoodSaved={(label) => setMoodLabel(label)}
      />

      <div
        className={`relative z-[1] mt-5 ${tileShell} border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb-deep),0.07)] px-4 py-3.5 sm:px-5`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">Insight</p>
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--text-primary)]">{insightOneLiner}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
          <Link
            href={reportInsightsHref("overview")}
            className="rounded-sm text-[var(--accent-focus)] underline-offset-2 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
          >
            Volledige insights
          </Link>
          <span className="text-[var(--text-muted)]" aria-hidden>
            ·
          </span>
          <Link
            href="/xp"
            className="rounded-sm text-[var(--text-muted)] underline-offset-2 hover:text-[var(--accent-focus)] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
          >
            Voorspelling
          </Link>
        </div>
      </div>
    </section>
  );
}
