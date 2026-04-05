"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ProfileSpecialGameRow } from "@/app/actions/profile-special-events";
import { PlatformGameProgressPanel } from "@/components/profile/PlatformGameProgressPanel";
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

function statusSummary(game: ProfileSpecialGameRow): { label: string; tone: "done" | "progress" | "neutral" } {
  if (game.completedAt) return { label: "Voltooid", tone: "done" };
  const { interaction: i } = game;
  if (i.mode === "auto" && i.auto?.rules?.length) {
    const ok = i.auto.rules.filter((r) => r.satisfied).length;
    const n = i.auto.rules.length;
    return {
      label: `${ok}/${n} voorwaarden`,
      tone: i.auto.satisfied ? "done" : "progress",
    };
  }
  if (i.mode === "checklist" && i.checklist.length > 0) {
    const done = i.checklist.filter((x) => game.checklistState[x.id] === true).length;
    return {
      label: `${done}/${i.checklist.length} stappen`,
      tone: done >= i.checklist.length ? "done" : "progress",
    };
  }
  if (i.mode === "answer") return { label: "Antwoord invullen", tone: "progress" };
  return { label: "Actieve challenge", tone: "neutral" };
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
        const summary = statusSummary(g);
        const hasInteraction = g.interaction.mode !== "none";
        const badgeClass =
          summary.tone === "done"
            ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/35"
            : summary.tone === "progress"
              ? "bg-amber-500/15 text-amber-100 ring-amber-400/30"
              : "bg-white/10 text-white/85 ring-white/15";

        return (
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
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">{g.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badgeClass}`}>
                {summary.label}
              </span>
            </div>
            <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-white/85">{g.body}</p>

            {hasInteraction ? (
              <div className="platform-game-banner-panel mt-2 rounded-lg border border-violet-400/25 bg-black/25 p-1">
                <PlatformGameProgressPanel game={g} domIdPrefix="pg-banner" onAfterServerMutation={load} />
              </div>
            ) : (
              <ConfigDetails config={g.config} />
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-violet-400/15 pt-2">
              <Link
                href={`/profile#platform-game-${g.id}`}
                className="text-xs font-semibold text-violet-200 underline-offset-2 hover:text-white hover:underline"
              >
                Open op profiel
              </Link>
              <span className="text-[10px] text-white/40">· metingen verversen bij laden dashboard</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
