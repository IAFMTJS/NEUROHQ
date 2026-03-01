"use client";

import { useState, useTransition, useEffect } from "react";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import { updateBehaviorProfile } from "@/app/actions/behavior-profile";
import { updateUserPreferences } from "@/app/actions/preferences";

type Props = {
  initial: BehaviorProfile;
  initialAutoMasterMissions: boolean;
};

const IDENTITY_OPTIONS = [
  { value: "fit_person", label: "Fit person" },
  { value: "disciplined", label: "Disciplined" },
  { value: "good_dog_owner", label: "Good dog owner" },
  { value: "financial_control", label: "Financial control" },
];

const AVOIDANCE_TAGS = [
  { value: "household", label: "Household" },
  { value: "administration", label: "Administration" },
  { value: "social", label: "Social" },
];

const CONFRONTATION_MODE_OPTIONS: { value: BehaviorProfile["confrontationMode"]; label: string; hint: string }[] = [
  {
    value: "mild",
    label: "Mild",
    hint: "Later escaleren, vooral micro‑confrontaties.",
  },
  {
    value: "standard",
    label: "Standard",
    hint: "Huidige standaard-gedrag voor confrontaties.",
  },
  {
    value: "strong",
    label: "Strong",
    hint: "Sneller escaleren, hogere levels.",
  },
];

const WEEK_THEME_OPTIONS = [
  { value: "environment_reset", label: "Environment Reset" },
  { value: "self_discipline", label: "Self‑Discipline" },
  { value: "health_body", label: "Health & Body" },
  { value: "courage", label: "Courage" },
];

export function BehaviorProfileSettings({ initial, initialAutoMasterMissions }: Props) {
  const [profile, setProfileState] = useState<BehaviorProfile>(initial);
  const [pending, startTransition] = useTransition();
  const [prefPending, startPrefTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [autoMasterMissions, setAutoMasterMissions] = useState(initialAutoMasterMissions);

  // Sync local state when server data changes (e.g. after save + refresh or other tab).
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Kon gedrag-profiel niet opslaan.";
        setError(msg);
      }
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Brain & gedrag (beta)
      </h2>
      <div className="card-simple space-y-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">Identity targets</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Bepaalt welke identity-missies en confrontaties je op een doorsnee dag vaker ziet.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {IDENTITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleIdentityTarget(opt.value)}
                className={`rounded-full px-3 py-1 text-xs ${
                  profile.identityTargets.includes(opt.value)
                    ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)] border border-[var(--accent-focus)]/60"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--card-border)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">Avoidance patterns</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Waar je structureel op vastloopt; bepaalt welke confronterende missies NEUROHQ naar voren schuift.
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {AVOIDANCE_TAGS.map((tag) => {
              const current = profile.avoidancePatterns.find((p) => p.tag === tag.value)?.emotion ?? "";
              return (
                <div key={tag.value} className="space-y-1">
                  <p className="text-[11px] text-[var(--text-muted)]">{tag.label}</p>
                  <select
                    value={current}
                    onChange={(e) => setAvoidance(tag.value, e.target.value)}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Geen</option>
                    <option value="overwhelm">Overwhelm</option>
                    <option value="anxiety">Anxiety</option>
                    <option value="avoidance">Avoidance</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Energy pattern</p>
            <select
              value={profile.energyPattern}
              onChange={(e) =>
                setProfile({ energyPattern: e.target.value as BehaviorProfile["energyPattern"] })
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="morning_low">Morning low</option>
              <option value="stable">Stable</option>
              <option value="evening_crash">Evening crash</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Discipline level</p>
            <select
              value={profile.disciplineLevel}
              onChange={(e) =>
                setProfile({ disciplineLevel: e.target.value as BehaviorProfile["disciplineLevel"] })
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">Confrontatie-intensiteit</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Hoe snel NEUROHQ in je dag naar zwaardere confronterende missies opschaalt bij huishouden, administratie en sociaal.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONFRONTATION_MODE_OPTIONS.map((opt) => {
              const active = profile.confrontationMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProfile({ confrontationMode: opt.value })}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    active
                      ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)] border-[var(--accent-focus)]/60"
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--card-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {profile.confrontationMode === "mild"
              ? "Mild: later escaleren, meer micro‑confrontaties en zachtere druk."
              : profile.confrontationMode === "strong"
                ? "Strong: sneller escaleren, vaker hogere levels als je blijft uitstellen."
                : "Standard: huidige balans tussen comfort en confrontatie."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Pet</p>
            <select
              value={profile.petType}
              onChange={(e) =>
                setProfile({ petType: e.target.value as BehaviorProfile["petType"] })
              }
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="none">None</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
            <select
              value={profile.petAttachmentLevel}
              onChange={(e) =>
                setProfile({ petAttachmentLevel: Number(e.target.value) as 0 | 1 | 2 })
              }
              className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value={0}>Attachment: Low</option>
              <option value={1}>Attachment: Medium</option>
              <option value={2}>Attachment: High</option>
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Hobby commitment</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              0–1 schaal. We starten met fitness en muziek; later uitbreidbaar.
            </p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-16 text-[11px] text-[var(--text-muted)]">Fitness</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={profile.hobbyCommitment.fitness ?? 0}
                  onChange={(e) => setHobbyCommitment("fitness", Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-right text-[11px] text-[var(--text-secondary)]">
                  {(profile.hobbyCommitment.fitness ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-[11px] text-[var(--text-muted)]">Music</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={profile.hobbyCommitment.music ?? 0}
                  onChange={(e) => setHobbyCommitment("music", Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-right text-[11px] text-[var(--text-secondary)]">
                  {(profile.hobbyCommitment.music ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">Minimal Integrity drempel</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Na hoeveel dagen zonder voltooide missie NEUROHQ een Minimal Integrity‑hint in je dag laat verschijnen.
          </p>
          <div className="mt-2 flex items-center gap-3">
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
              className="flex-1"
            />
            <span className="w-32 text-right text-[11px] text-[var(--text-secondary)]">
              {profile.minimalIntegrityThresholdDays} dagen inactiviteit
            </span>
          </div>
        </div>

        <div className="mt-2 border-t border-[var(--card-border)] pt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Auto-missies uit Master Pool</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                Bepaalt of NEUROHQ automatisch extra structuur- en identity-missies uit de Master Pool toevoegt aan je dag.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoMasterMissions}
              disabled={prefPending}
              onClick={() => {
                const next = !autoMasterMissions;
                setAutoMasterMissions(next);
                startPrefTransition(async () => {
                  await updateUserPreferences({ auto_master_missions: next });
                });
              }}
              className="relative mt-1 h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
              data-state={autoMasterMissions ? "on" : "off"}
            >
              <span
                className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform data-[state=on]:translate-x-5"
                data-state={autoMasterMissions ? "on" : "off"}
                style={{ transform: autoMasterMissions ? "translateX(20px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">Week theme</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Eén overkoepelend thema dat de Mission Pool prioriteert (Environment Reset, Self‑Discipline, Health & Body, Courage).
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEK_THEME_OPTIONS.map((opt) => {
              const active = profile.weekTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setProfile({
                      weekTheme: active ? null : (opt.value as BehaviorProfile["weekTheme"]),
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs border ${
                    active
                      ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)] border-[var(--accent-focus)]/60"
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--card-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="mt-2 inline-flex items-center rounded-lg bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
        >
          {pending ? "Opslaan…" : "Gedrag-profiel opslaan"}
        </button>
      </div>
    </section>
  );
}

