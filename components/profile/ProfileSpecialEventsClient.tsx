"use client";

import { useState } from "react";
import type { ProfileSpecialEventsBundle } from "@/app/actions/profile-special-events";
import { QuestCampaignModal } from "@/components/quests/QuestCampaignModal";
import type { Json } from "@/types/database.types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function ConfigBlock({ config }: { config: Json }) {
  if (config == null || typeof config !== "object" || Array.isArray(config)) return null;
  const entries = Object.entries(config as Record<string, Json | undefined>).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return null;
  const scalar = (v: unknown) => typeof v === "string" || typeof v === "number" || typeof v === "boolean";
  if (entries.every(([, v]) => scalar(v))) {
    return (
      <dl className="mt-2 grid gap-1 text-xs text-[var(--text-muted)] sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-[var(--text-secondary)]">{k}</dt>
            <dd>{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/25 p-2 font-mono text-[10px] text-[var(--text-muted)]">
      {JSON.stringify(config, null, 2)}
    </pre>
  );
}

function bundleHasContent(b: ProfileSpecialEventsBundle): boolean {
  return b.events.length > 0 || b.games.length > 0 || b.quest != null;
}

export function ProfileSpecialEventsClient({ bundle }: { bundle: ProfileSpecialEventsBundle }) {
  const [questOpen, setQuestOpen] = useState(false);
  const has = bundleHasContent(bundle);

  if (!has) {
    return (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/25 px-4 py-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Geen actieve special events of quests.</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Als er een platformbericht, banner-game of quest loopt, verschijnt die hier automatisch.
        </p>
      </div>
    );
  }

  const q = bundle.quest;

  return (
    <div className="space-y-5">
      {q ? (
        <section className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/35 to-[var(--bg-surface)]/40 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-300/90">Platformquest</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{q.title}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{q.tagline}</p>
          <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">Prijs bij voltooiing</p>
            <p className="mt-1 text-sm font-medium text-amber-50/95">{q.prizeLine}</p>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {formatWhen(q.startsAt)}
            {q.endsAt ? ` → ${formatWhen(q.endsAt)}` : " · geen vaste eindtijd"}
          </p>
          {q.epigraph ? (
            <p className="mt-3 border-l-2 border-violet-400/40 pl-3 text-sm italic text-[var(--text-muted)]">{q.epigraph}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Voortgang: dag {Math.min(q.eventDay, q.maxDay)}/{q.maxDay}
            {q.completed ? " · voltooid" : ""}
          </p>
          <button
            type="button"
            onClick={() => setQuestOpen(true)}
            className="mt-4 w-full rounded-lg bg-[rgba(var(--mode-rgb),0.35)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] ring-1 ring-[rgba(var(--mode-rgb),0.35)] hover:bg-[rgba(var(--mode-rgb),0.5)] sm:w-auto"
          >
            Quest openen
          </button>
          <QuestCampaignModal open={questOpen} onClose={() => setQuestOpen(false)} />
        </section>
      ) : null}

      {bundle.events.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Platformberichten</h3>
          <ul className="space-y-3">
            {bundle.events.map((ev) => (
              <li
                key={ev.id}
                className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-3 py-3 text-sm text-[var(--text-primary)]"
              >
                <p className="font-semibold text-cyan-100/95">{ev.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--text-muted)]">{ev.body}</p>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  {formatWhen(ev.starts_at)}
                  {ev.ends_at ? ` — ${formatWhen(ev.ends_at)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bundle.games.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Banner-games</h3>
          <ul className="space-y-3">
            {bundle.games.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-violet-500/20 bg-[var(--bg-surface)]/30 px-3 py-3 text-sm text-[var(--text-primary)]"
              >
                <p className="font-semibold text-violet-100/95">{g.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--text-muted)]">{g.body}</p>
                <ConfigBlock config={g.config} />
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  {formatWhen(g.starts_at)}
                  {g.ends_at ? ` — ${formatWhen(g.ends_at)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
