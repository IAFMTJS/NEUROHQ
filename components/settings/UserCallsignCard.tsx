"use client";

import { useEffect, useState, useTransition } from "react";
import { greetingForHour } from "@/lib/hq-greeting";
import {
  PERSONA_UPDATED_EVENT,
  parseGreetingLocale,
  applyServerPersonaToLocalStorage,
  type PersonaGreetingLocale,
} from "@/lib/user-persona-storage";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useSettings } from "@/lib/settings-context";
import type { GreetingLocale } from "@/types/preferences.types";

const DEFAULT_CALLSIGN = "Commander";
const DEFAULT_HEADLINE = "Commander HQ";

type Props = {
  embedded?: boolean;
  initialDisplayCallsign?: string | null;
  initialHqHeadline?: string | null;
  initialGreetingLocale?: GreetingLocale | null;
};

export function UserCallsignCard({
  embedded = false,
  initialDisplayCallsign = null,
  initialHqHeadline = null,
  initialGreetingLocale = "en",
}: Props) {
  const { invalidate } = useSettings();
  const [callsign, setCallsign] = useState(() => initialDisplayCallsign?.trim() ?? "");
  const [hqHeadline, setHqHeadline] = useState(() => initialHqHeadline?.trim() ?? "");
  const [greetingLocale, setGreetingLocale] = useState<PersonaGreetingLocale>(() =>
    parseGreetingLocale(initialGreetingLocale ?? null),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCallsign(initialDisplayCallsign?.trim() ?? "");
    setHqHeadline(initialHqHeadline?.trim() ?? "");
    setGreetingLocale(parseGreetingLocale(initialGreetingLocale ?? null));
  }, [initialDisplayCallsign, initialHqHeadline, initialGreetingLocale]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const previewHour = new Date().getHours();
  const previewGreet = greetingForHour(previewHour, greetingLocale);
  const headlinePreview = (hqHeadline.trim() || DEFAULT_HEADLINE).slice(0, 40);
  const callsignPreview = (callsign.trim() || DEFAULT_CALLSIGN).slice(0, 24);
  void tick;

  const inner = (
    <>
      {!embedded && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Personalisatie</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Hoe het dashboard je begroet — bv. Captain, Princess, of je eigen titel.
          </p>
        </div>
      )}
      <p className="text-[11px] text-[var(--text-muted)]">
        Wijzigingen worden opgeslagen op je account (Supabase, per user_id) en gesynchroniseerd naar dit apparaat.
      </p>
      <label className="block text-xs text-[var(--text-muted)]">
        HQ-koptekst (boven de begroeting)
        <input
          value={hqHeadline}
          onChange={(e) => {
            setHqHeadline(e.target.value);
            setSaved(false);
            setError(null);
          }}
          maxLength={40}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          placeholder={DEFAULT_HEADLINE}
        />
      </label>
      <label className="block text-xs text-[var(--text-muted)]">
        Aanspreektitel
        <input
          value={callsign}
          onChange={(e) => {
            setCallsign(e.target.value);
            setSaved(false);
            setError(null);
          }}
          maxLength={24}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          placeholder={DEFAULT_CALLSIGN}
        />
      </label>
      <fieldset className="space-y-1">
        <legend className="text-xs text-[var(--text-muted)]">Begroeting (tijd van de dag)</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="radio"
            name="neurohq-greeting-locale"
            checked={greetingLocale === "en"}
            onChange={() => {
              setGreetingLocale("en");
              setSaved(false);
              setError(null);
            }}
            className="accent-[var(--accent-focus)]"
          />
          Engels (Good morning / afternoon / evening)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="radio"
            name="neurohq-greeting-locale"
            checked={greetingLocale === "nl"}
            onChange={() => {
              setGreetingLocale("nl");
              setSaved(false);
              setError(null);
            }}
            className="accent-[var(--accent-focus)]"
          />
          Nederlands (Goedemorgen / middag / avond)
        </label>
      </fieldset>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Zo op het dashboard</p>
        <p className="hq-h1 mt-1 text-center text-base leading-tight">{headlinePreview}</p>
        <p className="hq-date mt-0.5 text-center text-sm opacity-80">
          {previewGreet}, {callsignPreview}
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await updateUserPreferences({
                display_callsign: callsign.trim() || null,
                hq_headline: hqHeadline.trim() || null,
                greeting_locale: greetingLocale,
              });
              applyServerPersonaToLocalStorage({
                display_callsign: callsign.trim() || null,
                hq_headline: hqHeadline.trim() || null,
                greeting_locale: greetingLocale,
              });
              await invalidate();
              setSaved(true);
            } catch (e) {
              setSaved(false);
              setError(e instanceof Error ? e.message : "Opslaan mislukt.");
            }
          });
        }}
      >
        {pending ? "Bezig…" : "Opslaan"}
      </button>
      {saved && !error && <p className="text-xs text-[var(--text-muted)]">Opgeslagen op je account.</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{inner}</div>;
  }

  return <section className="card-simple space-y-3">{inner}</section>;
}
