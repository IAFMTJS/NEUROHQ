"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ProfileSpecialGameRow } from "@/app/actions/profile-special-events";
import { PlatformGameProgressPanel } from "@/components/profile/PlatformGameProgressPanel";
import { getPlatformGameStatusSummary, platformGameStatusBadgeClass } from "@/lib/platform-game-status";
import type { Json } from "@/types/database.types";

const STORAGE_KEY = "neurohq-platform-games-dismissed";

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
  const pathname = usePathname();
  const [games, setGames] = useState<ProfileSpecialGameRow[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const load = useCallback(async () => {
    if (pathname === "/profile" || pathname.startsWith("/profile/")) return;
    try {
      const res = await fetch("/api/platform-games", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as { games?: ProfileSpecialGameRow[] };
      setGames(Array.isArray(json.games) ? json.games : []);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
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
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return null;
  if (visible.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 px-0" role="region" aria-label="Platformgames">
      {visible.map((g) => {
        const summary = getPlatformGameStatusSummary(g);
        const hasInteraction = g.interaction.mode !== "none";
        const badgeClass = platformGameStatusBadgeClass(summary.tone);

        return (
          <div
            key={g.id}
            className="relative overflow-hidden rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/70 via-slate-950/50 to-indigo-950/40 px-3 py-3 pr-10 shadow-[0_12px_40px_rgba(88,28,135,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-2xl"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => dismiss(g.id)}
              className="absolute right-2 top-2 z-[1] flex h-8 w-8 items-center justify-center rounded-xl text-lg leading-none text-white/45 transition hover:bg-white/10 hover:text-white"
              aria-label="Game-banner sluiten"
            >
              ×
            </button>
            <div className="relative flex flex-wrap items-center gap-2 pr-7">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-base ring-1 ring-violet-400/30" aria-hidden>
                🎮
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/80">Platform-game</p>
                <p className="truncate text-sm font-semibold text-white/95">{g.title}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badgeClass}`}>
                {summary.label}
              </span>
            </div>
            <p className="relative mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{g.body}</p>

            {hasInteraction ? (
              <div className="platform-game-banner-panel relative mt-3 rounded-xl border border-violet-400/20 bg-black/30 p-2 backdrop-blur-sm">
                <PlatformGameProgressPanel game={g} domIdPrefix="pg-banner" onAfterServerMutation={load} />
              </div>
            ) : (
              <ConfigDetails config={g.config} />
            )}

            <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-violet-400/15 pt-2.5">
              <Link
                href={`/profile#platform-game-${g.id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-100 ring-1 ring-violet-400/25 transition hover:bg-violet-500/25 hover:ring-violet-300/40"
              >
                Open op profiel
              </Link>
              <span className="text-[10px] text-white/35">Metingen verversen bij laden dashboard</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
