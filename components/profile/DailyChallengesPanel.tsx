"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTask } from "@/app/actions/tasks";
import type { MissionTemplateItem } from "@/components/xp/XPPageContent";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { BrainMode } from "@/lib/brain-mode";
import { recommendedMissionTemplates } from "@/lib/recommended-mission-templates";
import { profileInsightsHref } from "@/lib/profile-routes";

type IdentitySlice = {
  xp_to_next_level: number;
};

type Props = {
  identity: IdentitySlice;
  todayStr: string;
  missionTemplates: MissionTemplateItem[];
  behaviorProfile: BehaviorProfile;
  brainModeToday: BrainMode;
  activeMissionCountToday: number;
  /** Profile home uses mode-tinted surfaces; XP page uses command/glass cards. */
  variant: "profile" | "xp";
  className?: string;
};

export function DailyChallengesPanel({
  identity,
  todayStr,
  missionTemplates,
  behaviorProfile,
  brainModeToday,
  activeMissionCountToday,
  variant,
  className = "",
}: Props) {
  const router = useRouter();
  const [challengeDate, setChallengeDate] = useState(todayStr);
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setChallengeDate(todayStr);
  }, [todayStr]);

  const maxSlotsToday = brainModeToday.maxSlots;
  const addBlockedToday = brainModeToday.addBlocked;

  const recommendedTemplates = useMemo(
    () => recommendedMissionTemplates(missionTemplates, behaviorProfile),
    [missionTemplates, behaviorProfile]
  );

  const dailyChallengeReward = Math.max(10, Math.round(identity.xp_to_next_level * 0.1));
  const daySeed = new Date(`${todayStr}T12:00:00Z`).getUTCDate();
  const challengePool = recommendedTemplates.length > 0 ? recommendedTemplates : missionTemplates;

  const dailyChallenges = useMemo(() => {
    return Array.from({ length: Math.min(3, challengePool.length) }).map((_, idx) => {
      const item = challengePool[(daySeed + idx) % challengePool.length];
      return {
        id: `${item.id}-${idx}`,
        title: item.title,
        template: item,
        rewardXp: dailyChallengeReward,
        tone: idx === 0 ? "Opstart" : idx === 1 ? "Momentum" : "Uitdaging",
      };
    });
  }, [challengePool, dailyChallengeReward, daySeed]);

  function addMission(template: MissionTemplateItem, dueDate?: string) {
    const date = dueDate ?? challengeDate ?? todayStr;
    const slotsFilledToday = activeMissionCountToday >= maxSlotsToday;
    const limitMessage =
      addBlockedToday && date === todayStr
        ? "Mentale belasting te hoog. Vandaag geen nieuwe missies toevoegen; afronden of uit je agenda halen."
        : slotsFilledToday && date === todayStr
          ? "Je hebt je focus slots gevuld. Kies één missie om eerst af te maken of te verplaatsen; dan mag er weer één bij."
          : null;
    if (limitMessage) {
      alert(limitMessage);
      return;
    }
    setPendingAddId(template.id);
    startTransition(async () => {
      try {
        await createTask({
          title: template.title,
          due_date: date,
          domain: template.domain,
          energy_required: template.energy,
          category: template.category ?? null,
          base_xp: template.baseXP ?? undefined,
        });
        router.refresh();
      } finally {
        setPendingAddId(null);
      }
    });
  }

  const itemClass =
    variant === "xp"
      ? "rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/35 p-3"
      : "rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb-deep),0.06)] p-3";

  const btnClass =
    variant === "xp"
      ? "mt-2 rounded-lg border border-[var(--card-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-50"
      : "mt-2 rounded-lg border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[rgba(var(--mode-rgb-deep),0.14)] disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0";

  /** Native date input defaults to light chrome; color-scheme + gradient match HQ dark UI. */
  const dateInputClass =
    variant === "xp"
      ? "min-w-[10.5rem] rounded-lg border border-[var(--card-border)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.42)] to-[rgba(6,18,30,0.94)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] [color-scheme:dark] outline-none focus-visible:border-[rgba(var(--mode-rgb),0.4)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.32)] focus-visible:ring-offset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80"
      : "min-w-[10.5rem] rounded-lg border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.48)] to-[rgba(6,18,30,0.96)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_14px_rgba(var(--mode-rgb),0.07)] [color-scheme:dark] outline-none focus-visible:border-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.38)] focus-visible:ring-offset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80";

  const headingClass =
    variant === "xp"
      ? "text-sm font-semibold text-[var(--text-primary)]"
      : "text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90";

  const subClass = variant === "xp" ? "mt-1 text-xs text-[var(--text-muted)]" : "mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]";

  const toneClass =
    variant === "xp"
      ? "text-[10px] uppercase tracking-wide text-[var(--text-muted)]"
      : "text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]";

  return (
    <div
      role="region"
      className={className}
      aria-labelledby="daily-challenges-heading"
      data-tutorial={variant === "profile" ? "profile-daily-challenges" : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="daily-challenges-heading" className={headingClass}>
            Dagelijkse challenges
          </h3>
          <p className={subClass}>
            3 lichte challenges, elk ongeveer {dailyChallengeReward} XP (
            {Math.round((dailyChallengeReward / Math.max(1, identity.xp_to_next_level)) * 100)}% richting volgend
            level).
          </p>
        </div>
        <input
          type="date"
          value={challengeDate}
          onChange={(e) => setChallengeDate(e.target.value || todayStr)}
          className={dateInputClass}
          aria-label="Datum voor geplande challenge"
        />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {dailyChallenges.map((challenge) => (
          <div key={challenge.id} className={itemClass}>
            <p className={toneClass}>{challenge.tone}</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{challenge.title}</p>
            <p className="mt-1 text-xs text-[var(--accent-focus)]">+{challenge.rewardXp} XP potentieel</p>
            <button
              type="button"
              onClick={() => addMission(challenge.template)}
              disabled={isPending && pendingAddId === challenge.template.id}
              className={btnClass}
            >
              {pendingAddId === challenge.template.id ? "Toevoegen..." : "Plan uitdaging"}
            </button>
          </div>
        ))}
      </div>
      {variant === "profile" && (
        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Meer context en analytics:{" "}
          <Link
            href={profileInsightsHref("overview")}
            className="font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
          >
            Rapport
          </Link>
          .
        </p>
      )}
    </div>
  );
}
