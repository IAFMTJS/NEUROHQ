"use client";

import { useState } from "react";
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
import { Modal } from "@/components/Modal";
import { ProfileEngineCategoryTile } from "@/components/profile/ProfileEngineCategoryTile";

type Props = {
  behaviorProfile: BehaviorProfile;
  initialAutoMasterMissions: boolean;
  initialStudyPlan: StudyPlan;
  initialAccountability: AccountabilitySettings;
  initialDaysOff: number[] | null;
  initialDayOffMode: "soft" | "hard";
};

type PanelId = "checklist" | "core" | "motor" | "calendar";

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

export function ProfileEngineBehaviorTab({
  behaviorProfile,
  initialAutoMasterMissions,
  initialStudyPlan,
  initialAccountability,
  initialDaysOff,
  initialDayOffMode,
}: Props) {
  const [open, setOpen] = useState<PanelId | null>(null);
  const daysOffArr = initialDaysOff ?? [];
  const checks = behaviorReadinessChecks(behaviorProfile, initialStudyPlan, daysOffArr);
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  const weekLabel = behaviorProfile.weekTheme
    ? WEEK_THEME_LABELS_NL[behaviorProfile.weekTheme]
    : "Geen weekthema";
  const motorTrait = `${initialStudyPlan.preferredTime ? `voorkeur ${initialStudyPlan.preferredTime}` : "geen voorkeurstijd"} · reminders ${initialStudyPlan.reminderEnabled ? "aan" : "uit"} · accountability ${initialAccountability.enabled ? "aan" : "uit"}`;
  const calTrait = `${daysOffArr.length} vrije dag(en) · ${initialDayOffMode === "hard" ? "harde" : "zachte"} modus`;

  return (
    <div className="space-y-5">
      <section
        className="card-simple relative overflow-hidden p-0"
        aria-labelledby="engine-behavior-hero-heading"
      >
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
              Kies een onderwerp om te bewerken. HQ‑persoon en emotie staan onder{" "}
              <Link
                href={profileEngineHref("identity")}
                className="font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline"
              >
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

          <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(var(--mode-rgb-deep),0.1)] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gedrag‑anker</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {doneCount}/{checks.length} richtlijnen · {pct}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--semantic-accent)]/35 bg-[var(--bg-primary)]/50 text-sm font-bold tabular-nums text-[var(--semantic-accent)]">
                  {pct}%
                </div>
                <button
                  type="button"
                  onClick={() => setOpen("checklist")}
                  className="rounded-lg border border-[rgba(var(--mode-rgb),0.22)] bg-[var(--bg-primary)]/40 px-3 py-2 text-[11px] font-semibold text-[var(--semantic-accent)] transition hover:bg-[rgba(var(--mode-rgb-deep),0.15)] outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
                >
                  Stappen
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-1">
            <ProfileEngineCategoryTile
              icon="🧠"
              title="Gedrag kern"
              trait={`${weekLabel} · ${ENERGY_PATTERN_LABELS_NL[behaviorProfile.energyPattern]} · neuro, vermijding, huisdier, hobby`}
              onOpen={() => setOpen("core")}
            />
            <ProfileEngineCategoryTile
              icon="⚙️"
              title="Motor & verantwoording"
              trait={motorTrait}
              onOpen={() => setOpen("motor")}
            />
            <ProfileEngineCategoryTile
              icon="📅"
              title="Kalender & vrije dagen"
              trait={calTrait}
              onOpen={() => setOpen("calendar")}
            />
          </div>
        </div>
      </section>

      <Modal
        open={open === "checklist"}
        onClose={() => setOpen(null)}
        title="Gedrag‑checklist"
        subtitle="Aanbevolen invulling voor scherpere engine-input."
        size="lg"
      >
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Checklist gedrag">
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
      </Modal>

      <Modal
        open={open === "core"}
        onClose={() => setOpen(null)}
        title="Gedrag kern"
        subtitle="Weekthema, identiteit, neuroprofiel, energie, vermijding, huisdier en hobby — één profiel."
        size="xl"
      >
        <BehaviorProfileSettings
          initial={behaviorProfile}
          initialAutoMasterMissions={initialAutoMasterMissions}
          engineLayout
        />
      </Modal>

      <Modal
        open={open === "motor"}
        onClose={() => setOpen(null)}
        title="Motor & verantwoording"
        subtitle="Leerdoelen, reminders en accountability."
        size="xl"
      >
        <SettingsEngineProfile
          initialStudyPlan={initialStudyPlan}
          initialAccountability={initialAccountability}
          engineLayout
        />
      </Modal>

      <Modal
        open={open === "calendar"}
        onClose={() => setOpen(null)}
        title="Kalender & vrije dagen"
        subtitle="Bias voor herstel- en huishoudmissies. Opslaan bij elke wijziging."
        size="lg"
      >
        <SettingsDaysOff initialDaysOff={initialDaysOff} initialMode={initialDayOffMode} engineLayout />
      </Modal>
    </div>
  );
}
