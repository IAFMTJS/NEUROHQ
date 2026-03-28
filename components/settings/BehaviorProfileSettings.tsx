"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import type { BehaviorProfile, WeekTheme } from "@/types/behavior-profile.types";
import { updateBehaviorProfile } from "@/app/actions/behavior-profile";
import { updateUserPreferences } from "@/app/actions/preferences";
import {
  NEURO_PROFILE_TAG_IDS,
  NEURO_PROFILE_TAG_LABELS_NL,
  NEURO_PROFILE_SETTINGS_INTRO_NL,
} from "@/lib/neuro-profile";
import type { NeuroProfileTagId } from "@/lib/neuro-profile";
import { useSettings } from "@/lib/settings-context";
import { neuroToast } from "@/lib/ui/neuro-toast";
import {
  WEEK_THEME_LABELS_NL,
  IDENTITY_TARGET_LABELS_NL,
  ENERGY_PATTERN_LABELS_NL,
  DISCIPLINE_LEVEL_LABELS_NL,
  CONFRONTATION_MODE_LABELS_NL,
  CONFRONTATION_MODE_HINTS_NL,
  PET_TYPE_LABELS_NL,
  PET_ATTACHMENT_LABELS_NL,
  AVOIDANCE_ZONE_LABELS_NL,
  AVOIDANCE_EMOTION_LABELS_NL,
  HOBBY_LABELS_NL,
} from "@/lib/behavior-ui-nl";

type Props = {
  initial: BehaviorProfile;
  initialAutoMasterMissions: boolean;
  /** Gebruikt door Engine → Gedrag: compacte subsecties zonder dubbele pagina-titel. */
  engineLayout?: boolean;
};

const IDENTITY_VALUES = ["fit_person", "disciplined", "good_dog_owner", "financial_control"] as const;

const WEEK_THEME_VALUES: WeekTheme[] = [
  "environment_reset",
  "self_discipline",
  "health_body",
  "courage",
];

const AVOIDANCE_TAG_KEYS = ["household", "administration", "social"] as const;

const ENERGY_VALUES = ["morning_low", "stable", "evening_crash"] as const satisfies readonly BehaviorProfile["energyPattern"][];

const DISCIPLINE_VALUES = ["low", "medium", "high"] as const satisfies readonly BehaviorProfile["disciplineLevel"][];

const CONFRONTATION_VALUES = ["mild", "standard", "strong"] as const satisfies readonly BehaviorProfile["confrontationMode"][];

const PET_TYPES = ["none", "dog", "cat", "other"] as const satisfies readonly BehaviorProfile["petType"][];

const AVOIDANCE_EMOTIONS = ["", "overwhelm", "anxiety", "avoidance"] as const;

function subBlock(
  title: string,
  description: string | null,
  body: ReactNode,
  engineLayout: boolean,
) {
  const wrap = engineLayout
    ? "rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/35 p-4 space-y-3"
    : "space-y-3";
  return (
    <div className={wrap}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</p>
        {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {body}
    </div>
  );
}

const pillOff =
  "border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/30";
const pillOn = "border-[var(--accent-focus)]/70 bg-[var(--accent-focus)]/10 text-[var(--text-primary)]";

export function BehaviorProfileSettings({
  initial,
  initialAutoMasterMissions,
  engineLayout = false,
}: Props) {
  const [profile, setProfileState] = useState<BehaviorProfile>(initial);
  const [pending, startTransition] = useTransition();
  const [prefPending, startPrefTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [autoMasterMissions, setAutoMasterMissions] = useState(initialAutoMasterMissions);
  const { invalidate: invalidateSettings } = useSettings();

  useEffect(() => {
    setProfileState(initial);
  }, [initial]);

  function setProfile(patch: Partial<BehaviorProfile>) {
    setProfileState((prev) => ({ ...prev, ...patch }));
  }

  function toggleIdentityTarget(value: string) {
    const set = new Set(profile.identityTargets);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setProfile({ identityTargets: Array.from(set) });
  }

  function toggleNeuroTag(value: NeuroProfileTagId) {
    const set = new Set(profile.neuroProfileTags);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setProfile({ neuroProfileTags: Array.from(set) as BehaviorProfile["neuroProfileTags"] });
  }

  function setAvoidance(tag: string, emotion: string) {
    const next = [...profile.avoidancePatterns.filter((p) => p.tag !== tag)];
    if (emotion) next.push({ tag, emotion });
    setProfile({ avoidancePatterns: next });
  }

  function setHobbyCommitment(key: string, value: number) {
    const hc = { ...profile.hobbyCommitment };
    hc[key] = value;
    setProfile({ hobbyCommitment: hc });
  }

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateBehaviorProfile(profile);
        await invalidateSettings();
        neuroToast.success("Gedragsprofiel opgeslagen.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Kon gedrag-profiel niet opslaan.";
        setError(msg);
        neuroToast.error(msg);
      }
    });
  };

  const rootClass = engineLayout ? "space-y-5" : "space-y-4";

  return (
    <div className={rootClass}>
      {subBlock(
        "Weekthema & identiteit",
        "Eén thema prioriteert de missiepool; identiteitsdoelen sturen welke rollen vaker terugkomen.",
        <>
          <div className="flex flex-wrap gap-2">
            {WEEK_THEME_VALUES.map((value) => {
              const active = profile.weekTheme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setProfile({
                      weekTheme: active ? null : value,
                    })
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                >
                  {WEEK_THEME_LABELS_NL[value]}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Tik opnieuw op een actief thema om het te wissen.</p>
          <div className="flex flex-wrap gap-2">
            {IDENTITY_VALUES.map((value) => {
              const active = profile.identityTargets.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleIdentityTarget(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                >
                  {IDENTITY_TARGET_LABELS_NL[value] ?? value}
                </button>
              );
            })}
          </div>
        </>,
        engineLayout,
      )}

      {subBlock(
        "Neuroprofiel",
        NEURO_PROFILE_SETTINGS_INTRO_NL,
        <>
          <div className="flex flex-wrap gap-2">
            {NEURO_PROFILE_TAG_IDS.map((id) => {
              const active = profile.neuroProfileTags.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleNeuroTag(id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-[var(--semantic-accent)]/60 bg-[var(--semantic-accent)]/15 text-[var(--semantic-accent)]"
                      : pillOff
                  }`}
                >
                  {NEURO_PROFILE_TAG_LABELS_NL[id]}
                </button>
              );
            })}
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={profile.neuroSelfReportOptIn}
              onChange={(e) => setProfile({ neuroSelfReportOptIn: e.target.checked })}
              className="mt-0.5 rounded border-[var(--card-border)]"
            />
            <span>
              Snelle mini-vragen in de missie-flow (bijv. waarom gestopt) — kort, geen formulier. Helpt patronen te
              herkennen.
            </span>
          </label>
        </>,
        engineLayout,
      )}

      {subBlock(
        "Vermijding & confrontatie",
        "Waar je vastloopt en hoe snel zwaardere confrontatiemissies mogen komen (huishouden, administratie, sociaal).",
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AVOIDANCE_TAG_KEYS.map((tag) => {
              const current = profile.avoidancePatterns.find((p) => p.tag === tag)?.emotion ?? "";
              return (
                <div key={tag} className="space-y-1">
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">{AVOIDANCE_ZONE_LABELS_NL[tag]}</p>
                  <select
                    value={current}
                    onChange={(e) => setAvoidance(tag, e.target.value)}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-xs text-[var(--text-primary)]"
                  >
                    {AVOIDANCE_EMOTIONS.map((em) => (
                      <option key={em || "none"} value={em}>
                        {em === "" ? "Geen patroon" : AVOIDANCE_EMOTION_LABELS_NL[em] ?? em}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Confrontatie-intensiteit</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONFRONTATION_VALUES.map((value) => {
                const active = profile.confrontationMode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProfile({ confrontationMode: value })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                  >
                    {CONFRONTATION_MODE_LABELS_NL[value]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">{CONFRONTATION_MODE_HINTS_NL[profile.confrontationMode]}</p>
          </div>
        </>,
        engineLayout,
      )}

      {subBlock(
        "Energie & discipline",
        "Vertelt de engine wanneer je zwaarder of lichter mag duwen.",
        <>
          <div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Energiepatroon</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ENERGY_VALUES.map((value) => {
                const active = profile.energyPattern === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProfile({ energyPattern: value })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                  >
                    {ENERGY_PATTERN_LABELS_NL[value]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Discipline-instelling</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DISCIPLINE_VALUES.map((value) => {
                const active = profile.disciplineLevel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProfile({ disciplineLevel: value })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                  >
                    {DISCIPLINE_LEVEL_LABELS_NL[value]}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        engineLayout,
      )}

      {subBlock(
        "Huisdier & hobby-gewicht",
        "Optioneel: gewicht voor hobby-missies (0–1). Huisdier beïnvloedt o.a. identity-missies.",
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-[var(--text-muted)]">Huisdier</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PET_TYPES.map((value) => {
                  const active = profile.petType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProfile({ petType: value })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                    >
                      {PET_TYPE_LABELS_NL[value]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] font-medium text-[var(--text-muted)]">Hechting</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([0, 1, 2] as const).map((level) => {
                  const active = profile.petAttachmentLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setProfile({ petAttachmentLevel: level })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? pillOn : pillOff}`}
                    >
                      {PET_ATTACHMENT_LABELS_NL[level]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--text-muted)]">Hobby-commitment (0–1)</p>
              <div className="mt-2 space-y-2">
                {(["fitness", "music", "language", "creative"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[11px] text-[var(--text-secondary)]">{HOBBY_LABELS_NL[key] ?? key}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={profile.hobbyCommitment[key] ?? 0}
                      onChange={(e) => setHobbyCommitment(key, Number(e.target.value))}
                      className="min-w-0 flex-1"
                    />
                    <span className="w-8 shrink-0 text-right text-[11px] text-[var(--text-secondary)] tabular-nums">
                      {(profile.hobbyCommitment[key] ?? 0).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>,
        engineLayout,
      )}

      {subBlock(
        "Minimal integrity",
        "Na hoeveel dagen zonder voltooide missie een Minimal Integrity-hint in je dag mag verschijnen (2–5 dagen).",
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={2}
            max={5}
            step={1}
            value={profile.minimalIntegrityThresholdDays}
            onChange={(e) =>
              setProfile({
                minimalIntegrityThresholdDays: Number(e.target.value) as BehaviorProfile["minimalIntegrityThresholdDays"],
              })
            }
            className="min-w-0 flex-1"
          />
          <span className="w-36 shrink-0 text-right text-xs text-[var(--text-secondary)] tabular-nums">
            {profile.minimalIntegrityThresholdDays} dagen inactiviteit
          </span>
        </div>,
        engineLayout,
      )}

      {subBlock(
        "Auto-missies (Master Pool)",
        "Automatisch extra structuur- en identity-missies uit de Master Pool toevoegen aan je dag.",
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)] pr-2">
            Staat los van het grote opslaan-knopje hieronder: wijzigingen gaan direct naar je voorkeuren.
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={autoMasterMissions}
            disabled={prefPending}
            onClick={() => {
              const next = !autoMasterMissions;
              setAutoMasterMissions(next);
              startPrefTransition(async () => {
                try {
                  await updateUserPreferences({ auto_master_missions: next });
                  await invalidateSettings();
                  neuroToast.success(next ? "Auto-missies uit Master Pool aan." : "Auto-missies uit Master Pool uit.");
                } catch (e) {
                  setAutoMasterMissions(!next);
                  neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
                }
              });
            }}
            className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60"
            data-state={autoMasterMissions ? "on" : "off"}
          >
            <span
              className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: autoMasterMissions ? "translateX(20px)" : "translateX(2px)" }}
            />
          </button>
        </div>,
        engineLayout,
      )}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center rounded-xl bg-[var(--accent-focus)] px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          {pending ? "Opslaan…" : "Gedragsprofiel opslaan"}
        </button>
        <p className="text-[11px] text-[var(--text-muted)]">Master Pool-toggle hierboven slaat direct op; de rest met deze knop.</p>
      </div>
    </div>
  );
}
