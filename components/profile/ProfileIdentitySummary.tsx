import Link from "next/link";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { XPFullContext } from "@/app/actions/xp-context";
import { profileInsightsHref } from "@/lib/profile-routes";

const WEEK_THEME_NL: Record<NonNullable<BehaviorProfile["weekTheme"]>, string> = {
  environment_reset: "Weekthema: omgeving reset",
  self_discipline: "Weekthema: zelfdiscipline",
  health_body: "Weekthema: lichaam & gezondheid",
  courage: "Weekthema: moed",
};

function streakRiskNl(level: "low" | "medium" | "high"): string {
  if (level === "high") return "Streak-risico hoog";
  if (level === "medium") return "Streak-risico gemiddeld";
  return "Streak-risico laag";
}

function completionPctLine(rate: number | null): string | null {
  if (rate == null) return null;
  return `Completion laatste 7 dagen: ${Math.round(rate * 100)}%`;
}

function momentumNl(band: "low" | "medium" | "high"): string {
  if (band === "high") return "hoog";
  if (band === "medium") return "gemiddeld";
  return "laag";
}

type Props = {
  identity: XPFullContext["identity"];
  insightState: XPFullContext["insightState"];
  behaviorProfile: BehaviorProfile;
};

/** Bovenaan profiel: identiteit + korte inzichten (uitgebreider beeld onder Profiel → Insights). */
export function ProfileIdentitySummary({ identity, insightState, behaviorProfile }: Props) {
  const weekLine = behaviorProfile.weekTheme ? WEEK_THEME_NL[behaviorProfile.weekTheme] : null;
  const completionLine = insightState ? completionPctLine(insightState.completionRateLast7) : null;
  const levelDays = insightState?.levelProjectionDays;
  const xp7 = insightState?.xpLast7 ?? 0;
  const xpPrev7 = insightState?.xpPrevious7 ?? 0;
  const momentumLine = insightState ? `Momentum: ${momentumNl(insightState.momentum.band)}` : null;

  return (
    <section className="card-simple space-y-4 border-[var(--card-border)] bg-[var(--bg-surface)]/25 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Jouw command center</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Identiteit, momentum en planning op één plek — details staan op Rapport en XP.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--card-border)]/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Level &amp; rang</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            {identity.level}
            <span className="text-sm font-normal text-[var(--text-secondary)]"> · {identity.rank}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">{identity.total_xp.toLocaleString("nl-NL")} XP totaal</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)]/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Volgende unlock</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{identity.next_unlock.rank}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">
            Nog {identity.next_unlock.xpNeeded} XP (level {identity.next_unlock.level})
          </p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)]/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Streak</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{identity.streak.current} dagen</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Langste: {identity.streak.longest}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)]/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Naar volgend level</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            {identity.xp_to_next_level} <span className="text-sm font-normal text-[var(--text-secondary)]">XP</span>
          </p>
          {levelDays != null && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Geschat: ~{levelDays} dag{levelDays === 1 ? "" : "en"} bij dit tempo
            </p>
          )}
        </div>
      </div>

      {insightState && (
        <div className="rounded-xl border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/30 px-3 py-2.5 text-sm text-[var(--text-secondary)]">
          <p className="text-[var(--text-primary)]">
            <span className="tabular-nums font-semibold">{xp7}</span> XP laatste 7 dagen
            <span className="text-[var(--text-muted)]">
              {" "}
              · week ervoor: <span className="tabular-nums">{xpPrev7}</span>
            </span>
            {momentumLine && <span className="text-[var(--text-muted)]"> · {momentumLine}</span>}
          </p>
          <p className="mt-2">{insightState.trend.microcopy}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Streak: {streakRiskNl(insightState.streakRisk.level)}
            {completionLine ? ` · ${completionLine}` : ""}
          </p>
          {insightState.coachRecommendations[0] && (
            <p className="mt-2 border-t border-[var(--card-border)]/40 pt-2 text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">Tip: </span>
              {insightState.coachRecommendations[0].body}
            </p>
          )}
        </div>
      )}

      {weekLine && <p className="text-xs font-medium text-[var(--text-secondary)]">{weekLine}</p>}

      <div className="flex flex-wrap gap-2">
        <Link href={profileInsightsHref("overview")} className="btn-secondary inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium">
          Volledig rapport
        </Link>
        <Link
          href="/profile"
          className="inline-flex items-center rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]/40 hover:text-[var(--text-primary)]"
        >
          Profiel
        </Link>
      </div>
    </section>
  );
}
