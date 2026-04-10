"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { XPFullContext } from "@/app/actions/xp-context";
import type { ProfileDailyChallengeContext } from "@/app/actions/profile-daily-challenges";
import { DailyChallengesPanel } from "@/components/profile/DailyChallengesPanel";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";
import { reportInsightsHref } from "@/lib/profile-routes";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";
import { MoodManualPanel } from "@/components/mood/MoodManualPanel";
import { MOOD_LABEL_META, type MoodLabel } from "@/lib/mood-intervention-config";
import { XPForecastWidget } from "@/components/dashboard/XPForecastWidget";
import type { XPCachePayload } from "@/lib/xp-cache";
import { getXPCache, setXPCache } from "@/lib/xp-cache";

const PROFILE_XP_SYNC_SESSION_KEY = "neurohq-profile-xp-sync-v1";

type Props = {
  identity: XPFullContext["identity"];
  insightState: XPFullContext["insightState"];
  forecast: XPFullContext["forecast"];
  /** Dag-mood uit daily_state (server). */
  initialMoodLabel?: string | null;
  todayStr: string;
  dailyChallengeContext: ProfileDailyChallengeContext;
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

export function ProfileHomeCompact({
  identity,
  insightState,
  forecast,
  initialMoodLabel,
  todayStr,
  dailyChallengeContext,
}: Props) {
  const [moodOpen, setMoodOpen] = useState(false);
  const [moodLabel, setMoodLabel] = useState<MoodLabel | null>(
    (initialMoodLabel as MoodLabel | null) ?? null
  );
  const [identityBoost, setIdentityBoost] = useState<XPFullContext["identity"] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyIdentityIfHigher = (incoming: XPFullContext["identity"]) => {
      setIdentityBoost((prev) => {
        const baseline = Math.max(identity.total_xp, prev?.total_xp ?? 0);
        if (incoming.total_xp > baseline) return incoming;
        return prev;
      });
    };

    const run = async () => {
      try {
        if (typeof sessionStorage !== "undefined") {
          try {
            if (sessionStorage.getItem(PROFILE_XP_SYNC_SESSION_KEY) === todayStr) {
              const cached = await getXPCache(todayStr);
              if (cached?.identity) {
                if (!cancelled) applyIdentityIfHigher(cached.identity);
                return;
              }
              /* session marked but IDB empty (e.g. storage purge) — fetch once more */
            }
          } catch {
            /* ignore */
          }
        }

        const res = await fetch(
          `/api/xp/context?date=${encodeURIComponent(todayStr)}&ts=${Date.now()}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as XPCachePayload;
        if (!data?.identity) return;
        applyIdentityIfHigher(data.identity);
        void setXPCache(todayStr, data);
        try {
          sessionStorage.setItem(PROFILE_XP_SYNC_SESSION_KEY, todayStr);
        } catch {
          /* private mode */
        }
      } catch {
        /* ignore */
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [todayStr, identity.total_xp]);

  const displayIdentity =
    identityBoost && identityBoost.total_xp > identity.total_xp ? identityBoost : identity;

  const barPct = Math.round(xpProgressInLevel(displayIdentity.total_xp) * 100);
  const { current: curXp, needed: spanXp } = xpRangeForNextLevel(displayIdentity.total_xp);
  const coach = insightState?.coachRecommendations[0]?.body;
  const trend = insightState?.trend.microcopy;
  const insightOneLiner =
    (coach ?? trend ?? (insightState ? bandHint(insightState.momentum.band) : null)) ??
    "Log een missie om je curve te vullen.";

  const band = insightState?.momentum.band;
  const ringMode = ringModeFromProfile(displayIdentity.level, band);
  const momentumLabel = insightState
    ? `${insightState.momentum.score} · ${insightState.momentum.band === "high" ? "Sterk" : insightState.momentum.band === "medium" ? "Stabiel" : "Opbouw"}`
    : "—";
  const nextTarget =
    displayIdentity.level >= 100 ? `Cap ${displayIdentity.level}` : `Level ${displayIdentity.level + 1}`;
  /** Visual-lab Profiel command deck: compact ring column + 200px orbit. */
  const ringSize = 200;

  return (
    <div className="space-y-6" data-tutorial="profile-home-orbit">
      <section
        className="glass-card !rounded-xl !p-3 !shadow-none sm:!p-5"
        aria-label="Level orbit"
      >
        <div className="relative z-[1] mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-[1fr_minmax(0,220px)_1fr] md:items-center md:gap-3">
        <div className="order-2 hidden flex-col justify-center gap-3 md:order-1 md:flex">
          <OrbitTile title="Rang">
            <span className="line-clamp-2 text-[13px] leading-snug" title={displayIdentity.rank}>
              {displayIdentity.rank}
            </span>
          </OrbitTile>
          <OrbitTile title="Streak actief">{displayIdentity.streak.current} dagen</OrbitTile>
          <OrbitTile title="Langste reeks">{displayIdentity.streak.longest} dagen</OrbitTile>
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
                label={`Level ${displayIdentity.level}`}
                value={`${barPct}%`}
                mode={ringMode}
              />
            </div>
          </div>
          <p className="mt-3 max-w-[260px] text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
            <span className="tabular-nums text-[var(--text-secondary)]">
              {curXp.toLocaleString()} / {spanXp.toLocaleString()} XP
            </span>{" "}
            naar {nextTarget} · {displayIdentity.total_xp.toLocaleString()} totaal
          </p>
          <p className="mt-1.5 text-center">
            <Link
              href={reportInsightsHref("overview")}
              className="text-[11px] font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
            >
              Rapport (insights)
            </Link>
          </p>
        </div>

        <div className="order-3 hidden flex-col justify-center gap-3 md:flex">
          <OrbitTile title="Volgende rang">{displayIdentity.next_unlock.rank}</OrbitTile>
          <OrbitTile title="XP tot unlock" href={reportInsightsHref("overview")}>
            Nog {displayIdentity.next_unlock.xpNeeded.toLocaleString()} XP
          </OrbitTile>
          <OrbitTile title="Totaal XP" href={reportInsightsHref("overview")}>
            {displayIdentity.total_xp.toLocaleString()}
          </OrbitTile>
        </div>

        <div className="order-4 flex flex-wrap justify-center gap-2 md:col-span-3 md:hidden">
          <OrbitTile title="Rang">
            <span className="max-w-[100px] truncate text-xs" title={displayIdentity.rank}>
              {displayIdentity.rank}
            </span>
          </OrbitTile>
          <OrbitTile title="Streak">{displayIdentity.streak.current}d</OrbitTile>
          <OrbitTile title="Unlock" href={reportInsightsHref("overview")}>
            {displayIdentity.next_unlock.xpNeeded} XP
          </OrbitTile>
          <OrbitTile title="XP %">{barPct}%</OrbitTile>
        </div>
      </div>
      </section>

      <section
        className="glass-card !rounded-xl !p-4 !shadow-none sm:!p-5"
        aria-label="XP forecast"
        data-tutorial="xp-content"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">XP</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Voorspelling voor vandaag (scenario’s) — details staan op Rapport.
            </p>
          </div>
          <Link
            href={reportInsightsHref("overview")}
            className="text-[11px] font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
          >
            Open rapport
          </Link>
        </div>
        <div className="mt-3">
          <XPForecastWidget forecasts={forecast} currentLevel={displayIdentity.level} />
        </div>
      </section>

      <section
        className="glass-card !rounded-xl !space-y-4 !p-4 sm:!p-5 !shadow-none"
        aria-labelledby="daily-challenges-heading"
      >
        <DailyChallengesPanel
          variant="profile"
          className="space-y-4 border-0 bg-transparent p-0 shadow-none"
          identity={displayIdentity}
          todayStr={todayStr}
          missionTemplates={dailyChallengeContext.missionTemplates}
          behaviorProfile={dailyChallengeContext.behaviorProfile}
          brainModeToday={dailyChallengeContext.brainModeToday}
        />
      </section>

      <div className="glass-card !rounded-xl !p-4 !shadow-none sm:!p-5">
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

      <div className="glass-card !rounded-xl !p-4 !shadow-none sm:!p-5">
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
            href={reportInsightsHref("overview")}
            className="rounded-sm text-[var(--text-muted)] underline-offset-2 hover:text-[var(--accent-focus)] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
          >
            XP context
          </Link>
        </div>
      </div>
    </div>
  );
}
