"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProfileSpecialGameRow } from "@/app/actions/profile-special-events";
import { setPlatformGameChecklistItem, submitPlatformGameAnswer } from "@/app/actions/platform-game-progress";
import { getMetricPreset } from "@/lib/platform-games-metric-presets";
import { neuroToast } from "@/lib/ui/neuro-toast";

function opSymbol(op: string): string {
  if (op === "gte") return "≥";
  if (op === "lte") return "≤";
  return "=";
}

type PanelProps = {
  game: ProfileSpecialGameRow;
  /** Na checklist/antwoord of handmatige refresh: o.a. dashboard-banner opnieuw laden. */
  onAfterServerMutation?: () => void;
  /** Unieke prefix voor input-id’s (banner + profiel kunnen tegelijk open staan). */
  domIdPrefix?: string;
};

export function PlatformGameProgressPanel({
  game,
  onAfterServerMutation,
  domIdPrefix = "pg",
}: PanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answer, setAnswer] = useState("");
  const { interaction: i } = game;
  const fieldId = (suffix: string) => `${domIdPrefix}-${game.id}-${suffix}`;

  if (i.mode === "none") return null;

  const done = Boolean(game.completedAt);

  if (i.mode === "checklist") {
    return (
      <div className="mt-3 rounded-lg border border-violet-500/20 bg-black/20 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/85">Jouw voortgang</p>
        <ul className="mt-2 space-y-2">
          {i.checklist.map((item) => {
            const checked = game.checklistState[item.id] === true;
            return (
              <li key={item.id} className="flex items-start gap-2">
                <input
                  id={fieldId(item.id)}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-violet-400/40"
                  checked={checked}
                  disabled={pending}
                  onChange={(e) => {
                    const next = e.target.checked;
                    startTransition(() => {
                      void (async () => {
                        try {
                          await setPlatformGameChecklistItem(game.id, item.id, next);
                          onAfterServerMutation?.();
                          router.refresh();
                        } catch (err) {
                          neuroToast.error(err instanceof Error ? err.message : "Opslaan mislukt.");
                        }
                      })();
                    });
                  }}
                />
                <label htmlFor={fieldId(item.id)} className="cursor-pointer text-sm text-[var(--text-primary)]">
                  {item.label}
                </label>
              </li>
            );
          })}
        </ul>
        {done ? (
          <p className="mt-3 text-xs font-medium text-emerald-300/95">
            {i.winMessage ?? "Voltooid — je voldoet aan de voorwaarden."}
          </p>
        ) : (
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">Vink alles aan zodra je het gedaan hebt.</p>
        )}
      </div>
    );
  }

  if (i.mode === "auto" && i.auto) {
    const { auto } = i;
    const winAll = auto.winLogic === "all";
    return (
      <div className="mt-3 rounded-lg border border-violet-500/20 bg-black/20 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/85">Automatische meting</p>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {winAll
            ? "Alle onderstaande voorwaarden moeten waar zijn binnen de looptijd van de game."
            : "Minstens één van de voorwaarden moet waar zijn."}
        </p>
        <ul className="mt-3 space-y-2">
          {auto.rules.map((r) => {
            const unit = getMetricPreset(r.preset)?.unit;
            const suffix =
              unit === "percent"
                ? "%"
                : unit === "minutes"
                  ? " min"
                  : unit === "days"
                    ? " dagen"
                    : "";
            return (
              <li
                key={r.ruleId}
                className={`flex flex-col gap-0.5 rounded-md border px-2 py-2 text-sm ${
                  r.satisfied ? "border-emerald-500/35 bg-emerald-500/10" : "border-[var(--card-border)] bg-[var(--bg-surface)]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{r.label}</span>
                  <span className={r.satisfied ? "text-emerald-300" : "text-[var(--text-muted)]"}>
                    {r.satisfied ? "✓" : "…"}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Waarde: <strong className="text-[var(--text-secondary)]">{r.value}{suffix}</strong>{" "}
                  <span className="opacity-80">
                    {opSymbol(r.operator)} {r.threshold}
                    {suffix}
                  </span>
                  {r.detail ? <span className="mt-0.5 block text-[10px] opacity-90">{r.detail}</span> : null}
                </p>
              </li>
            );
          })}
        </ul>
        {done ? (
          <p className="mt-3 text-xs font-medium text-emerald-300/95">
            {i.winMessage ?? "Challenge voltooid — je hebt de voorwaarden gehaald."}
          </p>
        ) : auto.satisfied ? (
          <p className="mt-2 text-xs text-emerald-200/90">Je voldoet nu aan de voorwaarden — beloning wordt verwerkt.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <p className="text-[10px] text-[var(--text-muted)]">
              Na nieuwe missies, learning of budget: meting opnieuw laden.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(() => {
                  onAfterServerMutation?.();
                  router.refresh();
                });
              }}
              className="w-fit rounded-lg bg-[rgba(var(--mode-rgb),0.25)] px-3 py-1.5 text-[10px] font-semibold text-[var(--text-primary)] ring-1 ring-[rgba(var(--mode-rgb),0.35)] hover:bg-[rgba(var(--mode-rgb),0.4)] disabled:opacity-50"
            >
              {pending ? "…" : "Vernieuw meting"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (i.mode === "answer") {
    return (
      <div className="mt-3 rounded-lg border border-violet-500/20 bg-black/20 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/85">Antwoord</p>
        {i.prompt ? <p className="mt-2 text-sm text-[var(--text-muted)] whitespace-pre-wrap">{i.prompt}</p> : null}
        {done ? (
          <p className="mt-3 text-xs font-medium text-emerald-300/95">
            {i.winMessage ?? "Voltooid."}
          </p>
        ) : (
          <>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={pending}
              autoComplete="off"
              placeholder={i.answerPlaceholder ?? "Jouw antwoord"}
              className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[rgba(var(--mode-rgb),0.45)]"
            />
            <button
              type="button"
              disabled={pending || !answer.trim()}
              onClick={() => {
                startTransition(() => {
                  void (async () => {
                    try {
                      const res = await submitPlatformGameAnswer(game.id, answer);
                      if (!res.ok) {
                        neuroToast.error(res.error);
                        return;
                      }
                      setAnswer("");
                      if (res.message && res.message.trim()) neuroToast.success(res.message);
                      onAfterServerMutation?.();
                      router.refresh();
                    } catch (err) {
                      neuroToast.error(err instanceof Error ? err.message : "Versturen mislukt.");
                    }
                  })();
                });
              }}
              className="mt-2 rounded-lg bg-[rgba(var(--mode-rgb),0.35)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] ring-1 ring-[rgba(var(--mode-rgb),0.35)] hover:bg-[rgba(var(--mode-rgb),0.5)] disabled:opacity-50"
            >
              {pending ? "…" : "Controleren"}
            </button>
          </>
        )}
      </div>
    );
  }

  return null;
}
