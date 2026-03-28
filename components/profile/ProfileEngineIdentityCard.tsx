"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import { WEEK_THEME_LABELS_NL } from "@/lib/behavior-ui-nl";
import type { EmotionKey, GreetingLocale, PushPersonalityMode, ThemeId } from "@/types/preferences.types";
import { UserCallsignCard } from "@/components/settings/UserCallsignCard";
import { profileEngineHref } from "@/lib/profile-routes";
import { updateUserPreferences, getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useSettings } from "@/lib/settings-context";
import { neuroToast } from "@/lib/ui/neuro-toast";

const EMOTION_LABEL_NL: Record<EmotionKey, string> = {
  drained: "Mentale leegte",
  sleepy: "Slaperig",
  questioning: "Vragend",
  motivated: "Gemotiveerd",
  excited: "Enthousiast",
  angry: "Gefrustreerd / scherp",
  neon: "Neon-focus",
  hyped: "Hyped",
  evil: "Evil mode",
};

const PUSH_PERSONALITY_NL: Record<NonNullable<PushPersonalityMode>, string> = {
  auto: "Automatisch (context)",
  stoic: "Stoïcijns — kort",
  friendly: "Vriendelijk",
  coach: "Coach",
  drill: "Drill sergeant",
  chaos: "Chaos",
};

/** Volgorde gelijk aan ThemeProvider (emotie-assets / accent). */
const EMOTION_ORDER: EmotionKey[] = [
  "drained",
  "sleepy",
  "questioning",
  "motivated",
  "excited",
  "angry",
  "neon",
  "hyped",
  "evil",
];

const PUSH_MODE_ORDER: NonNullable<PushPersonalityMode>[] = [
  "auto",
  "friendly",
  "coach",
  "stoic",
  "drill",
  "chaos",
];

const PUSH_PILL_LABEL_NL: Record<NonNullable<PushPersonalityMode>, string> = {
  auto: "Auto",
  friendly: "Vriendelijk",
  coach: "Coach",
  stoic: "Stoïcijns",
  drill: "Drill",
  chaos: "Chaos",
};

const DISCIPLINE_NL: Record<BehaviorProfile["disciplineLevel"], string> = {
  low: "Lage discipline-instelling",
  medium: "Gemiddeld",
  high: "Hoge discipline",
};

type Props = {
  userEmail: string;
  behaviorProfile: BehaviorProfile;
  displayCallsign: string | null;
  hqHeadline: string | null;
  greetingLocale: GreetingLocale | null;
  selectedEmotion: EmotionKey | null;
  pushPersonalityMode: PushPersonalityMode | null;
  themeId: ThemeId;
};

function readinessChecks(p: Props): { id: string; done: boolean; hint: string }[] {
  const callsign = (p.displayCallsign ?? "").trim();
  const headline = (p.hqHeadline ?? "").trim();
  const hasBehaviorAnchor =
    p.behaviorProfile.identityTargets.length > 0 || p.behaviorProfile.weekTheme != null;

  return [
    {
      id: "callsign",
      done: callsign.length > 0,
      hint: "Eigen roepnaam op HQ",
    },
    {
      id: "headline",
      done: headline.length > 0,
      hint: "Eigen HQ-kopregel",
    },
    {
      id: "emotion",
      done: p.selectedEmotion != null,
      hint: "Emotie-accent gekozen",
    },
    {
      id: "push_voice",
      done: (p.pushPersonalityMode ?? "auto") !== "auto",
      hint: "Vaste push-stem (niet alleen auto)",
    },
    {
      id: "behavior",
      done: hasBehaviorAnchor,
      hint: "Weekthema of identiteitsdoelen in Gedrag",
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

export function ProfileEngineIdentityCard({
  userEmail,
  behaviorProfile,
  displayCallsign,
  hqHeadline,
  greetingLocale,
  selectedEmotion,
  pushPersonalityMode,
  themeId,
}: Props) {
  const { hydrate } = useTheme();
  const { invalidate: invalidateSettings } = useSettings();
  const [prefsPending, startPrefsTransition] = useTransition();
  const [emotionUi, setEmotionUi] = useState<EmotionKey | null>(selectedEmotion);
  const [pushUi, setPushUi] = useState<NonNullable<PushPersonalityMode>>(pushPersonalityMode ?? "auto");

  useEffect(() => {
    setEmotionUi(selectedEmotion);
  }, [selectedEmotion]);
  useEffect(() => {
    setPushUi(pushPersonalityMode ?? "auto");
  }, [pushPersonalityMode]);

  const checks = readinessChecks({
    userEmail,
    behaviorProfile,
    displayCallsign,
    hqHeadline,
    greetingLocale,
    selectedEmotion: emotionUi,
    pushPersonalityMode: pushUi,
    themeId,
  });
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  const firstTargets = behaviorProfile.identityTargets.slice(0, 3);

  function persistEmotion(next: EmotionKey | null) {
    startPrefsTransition(async () => {
      try {
        await updateUserPreferences({ selected_emotion: next });
        setEmotionUi(next);
        const prefs = await getUserPreferencesOrDefaults();
        hydrate(prefs);
        await invalidateSettings();
        neuroToast.success(next == null ? "Emotie gewist." : "Emotie opgeslagen.");
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  function persistPushMode(next: NonNullable<PushPersonalityMode>) {
    startPrefsTransition(async () => {
      try {
        await updateUserPreferences({ push_personality_mode: next });
        setPushUi(next);
        const prefs = await getUserPreferencesOrDefaults();
        hydrate(prefs);
        await invalidateSettings();
        neuroToast.success("Push-stem opgeslagen.");
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--card-border)]/85 border-t-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.12)] to-[var(--bg-surface)]/25 shadow-[0_0_36px_rgba(var(--mode-rgb),0.07)]"
      aria-labelledby="engine-identity-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative z-[1] space-y-5 p-4 sm:p-5">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">Engine</p>
          <h2 id="engine-identity-heading" className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            Identiteit &amp; HQ‑persoon
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Dit voedt begroeting, copy en ritme op het dashboard. Pas hieronder emotie en push-stem aan; koppel gedrag via{" "}
            <Link href={profileEngineHref("behavior")} className="font-semibold text-[var(--accent-focus)] hover:underline">
              Gedrag
            </Link>
            . Overige voorkeuren:{" "}
            <Link href="/settings" className="font-semibold text-[var(--accent-focus)] hover:underline">
              Instellingen
            </Link>
            .
          </p>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Account: <span className="break-all font-mono text-[var(--text-secondary)]">{userEmail}</span>
          </p>
        </header>

        <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.1)] px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Profiel‑volwassenheid</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {doneCount}/{checks.length} stappen · sterker anker voor de engine
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--semantic-accent)]/35 bg-[var(--bg-primary)]/50 text-sm font-bold tabular-nums text-[var(--semantic-accent)]">
              {pct}%
            </div>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Checklist identiteit">
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

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Visuele stem</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <MetaChip>Commander v2</MetaChip>
              {themeId !== "normal" ? (
                <span className="text-[10px] text-[var(--text-muted)]" title="Opgeslagen op account; interface gebruikt Commander v2.">
                  ({themeId})
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Emotie stuurt mascot/accenten. Kies er een of wis voor neutraal.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={prefsPending}
                onClick={() => persistEmotion(null)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                  emotionUi == null
                    ? "border-[var(--accent-focus)]/70 bg-[var(--accent-focus)]/10 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-muted)]"
                }`}
              >
                Geen
              </button>
              {EMOTION_ORDER.map((key) => {
                const active = emotionUi === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={prefsPending}
                    title={EMOTION_LABEL_NL[key]}
                    onClick={() => persistEmotion(key)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                      active
                        ? "border-[var(--accent-focus)]/70 bg-[var(--accent-focus)]/10 text-[var(--text-primary)]"
                        : "border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {EMOTION_LABEL_NL[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Notificatie‑persoonlijkheid</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Toon van pushberichten (quote, herinneringen, tips). Auto = contextafhankelijk; anders vaste stijl.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PUSH_MODE_ORDER.map((mode) => {
                const active = pushUi === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={prefsPending}
                    title={PUSH_PERSONALITY_NL[mode]}
                    onClick={() => persistPushMode(mode)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      active
                        ? "border-[var(--accent-focus)]/70 bg-[var(--accent-focus)]/10 text-[var(--text-primary)]"
                        : "border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {PUSH_PILL_LABEL_NL[mode]}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-[var(--text-primary)]">{PUSH_PERSONALITY_NL[pushUi]}</p>
            <Link
              href="/settings#tijd-notificaties"
              className="mt-2 inline-flex text-[11px] font-semibold text-[var(--accent-focus)] hover:underline"
            >
              Tijden, stilte &amp; push koppelen →
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-primary)]/35 p-4 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gedragsankers</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
              {behaviorProfile.weekTheme ? WEEK_THEME_LABELS_NL[behaviorProfile.weekTheme] : "Geen weekthema gekozen"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{DISCIPLINE_NL[behaviorProfile.disciplineLevel]}</p>
            {firstTargets.length > 0 ? (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-[var(--text-secondary)]">
                {firstTargets.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-muted)]">Nog geen identiteitsdoelen — voeg streepjes toe in Gedrag.</p>
            )}
            <p className="mt-2 text-[11px] leading-snug text-[var(--text-muted)]">
              Neuro-profieltags in Gedrag beïnvloeden o.a. budget- en strategie-copy — vul ze in voor strakkere hints.
            </p>
            <Link
              href={profileEngineHref("behavior")}
              className="mt-2 inline-flex text-xs font-semibold text-[var(--accent-focus)] hover:underline"
            >
              Tab Gedrag openen →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-elevated)]/15 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">HQ begroeting</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Kopregel, roepnaam en taal voor &quot;Goedemorgen, …&quot; — opgeslagen op je account.
          </p>
          <div className="mt-4">
            <UserCallsignCard
              embedded
              initialDisplayCallsign={displayCallsign}
              initialHqHeadline={hqHeadline}
              initialGreetingLocale={greetingLocale ?? "en"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
