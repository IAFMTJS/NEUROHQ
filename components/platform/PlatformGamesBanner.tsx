"use client";

import { useCallback, useEffect, useState } from "react";
import type { Json } from "@/types/database.types";

const STORAGE_KEY = "neurohq-platform-games-dismissed";

type Game = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  config: Json;
};

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

function ConfigDetails({ config }: { config: Json }) {
  if (config == null || typeof config !== "object" || Array.isArray(config)) return null;
  const entries = Object.entries(config as Record<string, Json | undefined>).filter(
    ([, v]) => v !== undefined
  );
  if (entries.length === 0) return null;

  const scalar = (v: unknown) =>
    typeof v === "string" || typeof v === "number" || typeof v === "boolean";

  if (entries.every(([, v]) => scalar(v))) {
    return (
      <dl className="mt-2 grid gap-1 border-t border-violet-400/20 pt-2 text-xs text-white/75 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-violet-200/90">{k}</dt>
            <dd className="text-white/70">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <details className="mt-2 border-t border-violet-400/20 pt-2">
      <summary className="cursor-pointer text-xs font-medium text-violet-200/90">Parameters</summary>
      <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/30 p-2 font-mono text-[10px] text-white/70">
        {JSON.stringify(config, null, 2)}
      </pre>
    </details>
  );
}

export function PlatformGamesBanner() {
  const [games, setGames] = useState<Game[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/platform-games", { credentials: "same-origin" });
      if (!res.ok) return;
      const json = (await res.json()) as { games?: Game[] };
      setGames(Array.isArray(json.games) ? json.games : []);
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

  const visible = games.filter((g) => !dismissed.has(g.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 px-0" role="region" aria-label="Platformgames">
      {visible.map((g) => (
        <div
          key={g.id}
          className="relative rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-950/55 to-slate-900/60 px-3 py-2.5 pr-10 shadow-[0_0_24px_rgba(167,139,250,0.12)]"
        >
          <button
            type="button"
            onClick={() => dismiss(g.id)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-lg leading-none text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Game-banner sluiten"
          >
            ×
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">{g.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{g.body}</p>
          <ConfigDetails config={g.config} />
        </div>
      ))}
    </div>
  );
}
