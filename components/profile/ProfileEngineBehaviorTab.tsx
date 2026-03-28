"use client";

import Link from "next/link";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { StudyPlan, AccountabilitySettings } from "@/app/actions/behavior";
import { BehaviorProfileSettings } from "@/components/settings/BehaviorProfileSettings";
import { SettingsEngineProfile } from "@/components/settings/SettingsEngineProfile";
import { SettingsDaysOff } from "@/components/settings/SettingsDaysOff";
import { profileEngineHref } from "@/lib/profile-routes";
import {
  WEEK_THEME_LABELS_NL,
  DISCIPLINE_LEVEL_LABELS_NL,
  ENERGY_PATTERN_LABELS_NL,
} from "@/lib/behavior-ui-nl";

type Props = {
  behaviorProfile: BehaviorProfile;
  initialAutoMasterMissions: boolean;
  initialStudyPlan: StudyPlan;
  initialAccountability: AccountabilitySettings;
  initialDaysOff: number[] | null;
  initialDayOffMode: "soft" | "hard";
};

function behaviorReadinessChecks(
  profile: BehaviorProfile,
  studyPlan: StudyPlan,
  daysOff: number[],
): { id: string; done: boolean; hint: string }[] {
  return [
    {
      id: "anchors",
      done: profile.identityTargets.length > 0 || profile.weekTheme != null,
      hint: "Weekthema of identiteitsdoelen gekozen",
    },
    {
      id: "neuro",
      done: profile.neuroProfileTags.length > 0,
      hint: "Neuroprofiel-tags (helpt copy en tempo)",
    },
    {
      id: "avoid",
      done: profile.avoidancePatterns.some((p) => String(p.emotion ?? "").length > 0),
      hint: "Minstens één vermijdingspatroon per domein",
    },
    {
      id: "days",
      done: daysOff.length > 0,
      hint: "Typische vrije dagen ingevuld",
    },
    {
      id: "motor",
      done: Boolean(studyPlan.preferredTime?.trim()) || studyPlan.reminderEnabled === true,
      hint: "Leer-ritme: voorkeurstijd of herinnering aan",
    },
  ];
}

function MetaChip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] ${className}`}
    >
      {children}
    </span>
  );
}

function EnginePanel({
  headingId,
  title,
  subtitle,
  children,
}: {
  headingId: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-[var(--card-border)]/85 border-t-[rgba(var(--mode-rgb),0.22)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.1)] to-[var(--bg-surface)]/20 shadow-[0_0_28px_rgba(var(--mode-rgb),0.06)]"
      aria-labelledby={headingId}
    >
      <header className="border-b border-[var(--card-border)]/50 px-4 py-3 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]">Engine</p>
        <h2 id={headingId} className="mt-1 text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function ProfileEngineBehaviorTab({
  behaviorProfile,
  initialAutoMasterMissions,
  initialStudyPlan,
  initialAccountability,
  initialDaysOff,
  initialDayOffMode,
}: Props) {
  const daysOffArr = initialDaysOff ?? [];
  const checks = behaviorReadinessChecks(behaviorProfile, initialStudyPlan, daysOffArr);
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  return (
    <div className="space-y-5">
      <section
        className="relative overflow-hidden rounded-2xl border border-[var(--card-border)]/85 border-t-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.12)] to-[var(--bg-surface)]/25 shadow-[0_0_36px_rgba(var(--mode-rgb),0.07)]"
        aria-labelledby="engine-behavior-hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-[1] space-y-4 p-4 sm:p-5">
          <header>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">Engine</p>
            <h2
              id="engine-behavior-hero-heading"
              className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl"
            >
              Gedrag &amp; motor
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Dit stuurt missies, confrontaties en tempo op het dashboard. HQ‑persoon en emotie stel je in op{" "}
              <Link href={profileEngineHref("identity")} className="font-semibold text-[var(--accent-focus)] hover:underline">
                Identiteit
              </Link>
              .
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            {behaviorProfile.weekTheme ? (
              <MetaChip>{WEEK_THEME_LABELS_NL[behaviorProfile.weekTheme]}</MetaChip>
            ) : (
              <MetaChip className="text-amber-200/85">Geen weekthema</MetaChip>
            )}
            <MetaChip>{ENERGY_PATTERN_LABELS_NL[behaviorProfile.energyPattern]}</MetaChip>
            <MetaChip>{DISCIPLINE_LEVEL_LABELS_NL[behaviorProfile.disciplineLevel]}</MetaChip>
            {behaviorProfile.identityTargets.length > 0 ? (
              <MetaChip>{behaviorProfile.identityTargets.length} identiteit(s)doel(en)</MetaChip>
            ) : (
              <MetaChip className="text-amber-200/85">Geen identiteitsdoelen</MetaChip>
            )}
          </div>

          <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.1)] px-4 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gedrag‑anker</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {doneCount}/{checks.length} richtlijnen · scherpere engine‑input
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--semantic-accent)]/35 bg-[var(--bg-primary)]/50 text-sm font-bold tabular-nums text-[var(--semantic-accent)]">
                {pct}%
              </div>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Checklist gedrag">
              {checks.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                    c.done
                      ? "border-emerald-500/30 bg-emerald-500/[0.07] text-[var(--text-primary)]"
                      : "border-[var(--card-border)]/60 bg-[var(--bg-primary)]/30 text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="mt-0.5 shrink-0" aria-hidden>
                    {c.done ? "✓" : "○"}
                  </span>
                  <span>{c.hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <EnginePanel
        headingId="engine-behavior-core"
        title="Gedrag kern"
        subtitle="Weekthema, identiteit, neuroprofiel, energie, vermijding, huisdier en hobby-gewicht — opgeslagen als één profiel."
      >
        <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={initialAutoMasterMissions} engineLayout />
      </EnginePanel>

      <EnginePanel
        headingId="engine-behavior-motor"
        title="Motor & verantwoording"
        subtitle="Leerdoelen per dag, reminders en accountability (XP, streak-freeze)."
      >
        <SettingsEngineProfile
          initialStudyPlan={initialStudyPlan}
          initialAccountability={initialAccountability}
          engineLayout
        />
      </EnginePanel>

      <EnginePanel
        headingId="engine-behavior-calendar"
        title="Kalender & vrije dagen"
        subtitle="Bias voor herstel- en huishoudmissies op vaste vrije dagen. Direct opgeslagen bij elke tik."
      >
        <SettingsDaysOff initialDaysOff={initialDaysOff} initialMode={initialDayOffMode} engineLayout />
      </EnginePanel>
    </div>
  );
}
