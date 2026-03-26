"use client";

import { useState, useEffect } from "react";
import type { CopyVariant } from "@/app/actions/adaptive";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const COPY_SUBTITLE: Record<CopyVariant, string | null> = {
  default: null,
  low_energy: "Take it slow today.",
  driven: "Lock in.",
  stabilize: "Steady pace.",
  high_sensory: "Minimal mode.",
};
const CALLSIGN_STORAGE_KEY = "neurohq-callsign";

type Props = {
  energyPct?: number;
  focusPct?: number;
  loadPct?: number;
  /** Adaptive copy variant (from getAdaptiveSuggestions). */
  copyVariant?: CopyVariant;
};

export function HQHeader({ energyPct: _energyPct = 0, focusPct: _focusPct = 0, loadPct: _loadPct = 0, copyVariant = "default" }: Props) {
  const [greeting, setGreeting] = useState(getGreeting);
  const [dateStr, setDateStr] = useState(formatDate);
  const [callsign, setCallsign] = useState("Commander");

  useEffect(() => {
    const tick = () => {
      setGreeting(getGreeting());
      setDateStr(formatDate());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const readCallsign = () => {
      try {
        const stored = window.localStorage.getItem(CALLSIGN_STORAGE_KEY);
        setCallsign(stored && stored.trim() ? stored.trim() : "Commander");
      } catch {
        setCallsign("Commander");
      }
    };
    readCallsign();
    window.addEventListener("neurohq-callsign-updated", readCallsign as EventListener);
    return () => window.removeEventListener("neurohq-callsign-updated", readCallsign as EventListener);
  }, []);

  const copyLine = COPY_SUBTITLE[copyVariant];

  return (
    <header className="flex flex-col items-center gap-1 pt-0 pb-1 mt-0">
      <h1 className="hq-h1 text-center leading-tight">Commander HQ</h1>
      <p className="hq-date text-center opacity-70">{greeting}, {callsign}</p>
      {copyLine && <p className="hq-date text-center text-xs opacity-70">{copyLine}</p>}
    </header>
  );
}
