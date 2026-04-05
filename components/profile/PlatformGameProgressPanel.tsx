"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProfileSpecialGameRow } from "@/app/actions/profile-special-events";
import { setPlatformGameChecklistItem, submitPlatformGameAnswer } from "@/app/actions/platform-game-progress";
import { neuroToast } from "@/lib/ui/neuro-toast";

export function PlatformGameProgressPanel({ game }: { game: ProfileSpecialGameRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answer, setAnswer] = useState("");
  const { interaction: i } = game;

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
                  id={`pg-${game.id}-${item.id}`}
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
                          router.refresh();
                        } catch (err) {
                          neuroToast.error(err instanceof Error ? err.message : "Opslaan mislukt.");
                        }
                      })();
                    });
                  }}
                />
                <label htmlFor={`pg-${game.id}-${item.id}`} className="cursor-pointer text-sm text-[var(--text-primary)]">
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
