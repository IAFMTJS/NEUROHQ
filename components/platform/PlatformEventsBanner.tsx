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
          className="relative overflow-hidden rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/65 via-slate-950/45 to-slate-900/50 px-3 py-3 pr-11 shadow-[0_12px_40px_rgba(8,145,178,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <div
            className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-cyan-400/12 blur-2xl"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => dismiss(e.id)}
            className="absolute right-2 top-2 z-[1] flex h-8 w-8 items-center justify-center rounded-xl text-lg leading-none text-white/45 transition hover:bg-white/10 hover:text-white"
            aria-label="Bericht sluiten"
          >
            ×
          </button>
          <div className="relative flex gap-2.5 pr-2">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-sm ring-1 ring-cyan-400/25"
              aria-hidden
            >
              📣
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300/85">Platformbericht</p>
              <p className="text-sm font-semibold text-white/95">{e.title}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/78">{e.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
