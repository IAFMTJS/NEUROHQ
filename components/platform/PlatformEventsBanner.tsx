"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "neurohq-platform-events-dismissed";

type Ev = { id: string; title: string; body: string; starts_at: string; ends_at: string | null };

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeDismissed(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function PlatformEventsBanner() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/platform-events", { credentials: "same-origin" });
      if (!res.ok) return;
      const json = (await res.json()) as { events?: Ev[] };
      setEvents(Array.isArray(json.events) ? json.events : []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeDismissed(next);
      return next;
    });
  };

  const visible = events.filter((e) => !dismissed.has(e.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 px-0" role="region" aria-label="Platformberichten">
      {visible.map((e) => (
        <div
          key={e.id}
          className="relative rounded-xl border border-cyan-500/35 bg-gradient-to-r from-cyan-950/50 to-slate-900/60 px-3 py-2.5 pr-10 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
        >
          <button
            type="button"
            onClick={() => dismiss(e.id)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-lg leading-none text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Bericht sluiten"
          >
            ×
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/90">{e.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{e.body}</p>
        </div>
      ))}
    </div>
  );
}
