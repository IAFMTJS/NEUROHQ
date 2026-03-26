"use client";

import { useState, useEffect } from "react";
import type { CopyVariant } from "@/app/actions/adaptive";
import { greetingForHour } from "@/lib/hq-greeting";
import {
  PERSONA_STORAGE,
  PERSONA_UPDATED_EVENT,
  parseGreetingLocale,
  type PersonaGreetingLocale,
} from "@/lib/user-persona-storage";

const DEFAULT_HEADLINE = "Commander HQ";

function readPersonaFromStorage(): { headline: string; callsign: string; locale: PersonaGreetingLocale } {
  try {
    const headlineRaw = window.localStorage.getItem(PERSONA_STORAGE.hqHeadline);
    const callsignRaw = window.localStorage.getItem(PERSONA_STORAGE.callsign);
    const localeRaw = window.localStorage.getItem(PERSONA_STORAGE.greetingLocale);
    return {
      headline: headlineRaw?.trim() ? headlineRaw.trim().slice(0, 40) : DEFAULT_HEADLINE,
      callsign: callsignRaw?.trim() ? callsignRaw.trim() : "Commander",
      locale: parseGreetingLocale(localeRaw),
    };
  } catch {
    return { headline: DEFAULT_HEADLINE, callsign: "Commander", locale: "en" };
  }
}

const COPY_SUBTITLE: Record<CopyVariant, string | null> = {
  default: null,
  low_energy: "Take it slow today.",
  driven: "Lock in.",
  stabilize: "Steady pace.",
  high_sensory: "Minimal mode.",
};
type Props = {
  energyPct?: number;
  focusPct?: number;
  loadPct?: number;
  /** Adaptive copy variant (from getAdaptiveSuggestions). */
  copyVariant?: CopyVariant;
};

export function HQHeader({ energyPct: _energyPct = 0, focusPct: _focusPct = 0, loadPct: _loadPct = 0, copyVariant = "default" }: Props) {
  const [greeting, setGreeting] = useState(() => greetingForHour(new Date().getHours(), "en"));
  const [hqHeadline, setHqHeadline] = useState(DEFAULT_HEADLINE);
  const [callsign, setCallsign] = useState("Commander");

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      const { locale } = readPersonaFromStorage();
      setGreeting(greetingForHour(h, locale));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const readPersona = () => {
      const p = readPersonaFromStorage();
      setHqHeadline(p.headline);
      setCallsign(p.callsign);
      setGreeting(greetingForHour(new Date().getHours(), p.locale));
    };
    readPersona();
    const onPersona = () => readPersona();
    window.addEventListener(PERSONA_UPDATED_EVENT, onPersona as EventListener);
    window.addEventListener("neurohq-callsign-updated", onPersona as EventListener);
    return () => {
      window.removeEventListener(PERSONA_UPDATED_EVENT, onPersona as EventListener);
      window.removeEventListener("neurohq-callsign-updated", onPersona as EventListener);
    };
  }, []);

  const copyLine = COPY_SUBTITLE[copyVariant];

  return (
    <header className="flex flex-col items-center gap-1 pt-0 pb-1 mt-0">
      <h1 className="hq-h1 text-center leading-tight">{hqHeadline}</h1>
      <p className="hq-date text-center opacity-70">
        {greeting}, {callsign}
      </p>
      {copyLine && <p className="hq-date text-center text-xs opacity-70">{copyLine}</p>}
    </header>
  );
}
