import Link from "next/link";
import type { XPFullContext } from "@/app/actions/xp-context";
import { xpProgressInLevel, xpRangeForNextLevel } from "@/lib/xp";
import { reportInsightsHref } from "@/lib/profile-routes";

type Props = {
  identity: XPFullContext["identity"];
  insightState: XPFullContext["insightState"];
};

function bandHint(band: "low" | "medium" | "high"): string {
  if (band === "high") return "Je zit in een sterke flow.";
  if (band === "medium") return "Stabiel ritme — hou de lijn strak.";
  return "Kleine actie vandaag verzet veel.";
}

export function ProfileHomeCompact({ identity, insightState }: Props) {
  const barPct = Math.round(xpProgressInLevel(identity.total_xp) * 100);
  const { current: curXp, needed: spanXp } = xpRangeForNextLevel(identity.total_xp);
  const coach = insightState?.coachRecommendations[0]?.body;
  const trend = insightState?.trend.microcopy;
  const insightOneLiner = (coach ?? trend ?? (insightState ? bandHint(insightState.momentum.band) : null)) ?? "Log een missie om je curve te vullen.";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-[var(--card-border)]/85 bg-[var(--bg-surface)]/30 px-4 py-3 sm:col-span-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Level &amp; rang</p>
          <Link href="/xp" className="shrink-0 text-[10px] font-semibold text-[var(--accent-focus)] hover:underline">
            XP
          </Link>
        </div>
        <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--text-primary)]">
          {identity.level}
          <span className="text-sm font-normal text-[var(--text-secondary)]"> · {identity.rank}</span>
        </p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] tabular-nums text-[var(--text-muted)]">
            <span>Naar level {identity.level >= 100 ? identity.level : identity.level + 1}</span>
            <span>
              {curXp} / {spanXp} XP
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)] ring-1 ring-[var(--card-border)]/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-focus)] to-[var(--semantic-accent)]"
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--card-border)]/85 bg-[var(--bg-surface)]/30 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Streak</p>
        <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--text-primary)]">{identity.streak.current} dagen</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Beste: {identity.streak.longest}</p>
      </div>

      <div className="rounded-xl border border-[var(--card-border)]/85 bg-[var(--bg-surface)]/30 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Volgende unlock</p>
        <p className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">{identity.next_unlock.rank}</p>
        <p className="mt-1 text-xs tabular-nums text-[var(--text-muted)]">Nog {identity.next_unlock.xpNeeded} XP</p>
      </div>

      <div className="rounded-xl border border-[var(--card-border)]/85 bg-[var(--semantic-accent)]/8 px-4 py-3 sm:col-span-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Insight</p>
        <p className="mt-2 line-clamp-4 text-sm leading-snug text-[var(--text-primary)]">{insightOneLiner}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={reportInsightsHref("overview")}
            className="text-[11px] font-semibold text-[var(--accent-focus)] hover:underline"
          >
            Volledige insights
          </Link>
          <span className="text-[var(--text-muted)]" aria-hidden>
            ·
          </span>
          <Link href="/xp" className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent-focus)] hover:underline">
            Voorspelling
          </Link>
        </div>
      </div>
    </div>
  );
}
