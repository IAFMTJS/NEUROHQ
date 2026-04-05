"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertStrategyReview } from "@/app/actions/strategyFocus";
import type { StrategyWeeklyReviewPayload } from "@/lib/strategy/weekly-review-payload";
import { STRATEGY_REVIEW_PILLAR_KEYS } from "@/lib/strategy/weekly-review-payload";

const PILLAR_META: Record<
  (typeof STRATEGY_REVIEW_PILLAR_KEYS)[number],
  { title: string; hint: string }
> = {
  savings: { title: "Spaardoel", hint: "Sparen en budgetgedrag deze week." },
  learning: { title: "Leerdoel", hint: "Growth, protocol en leren." },
  xp: { title: "XP-doel", hint: "Voortgang en beloningssignaal." },
  discipline: { title: "Executie & gedrag", hint: "Missies afgerond vs uitstel / skip / verwijderen." },
};

const Q_LABELS = [
  "Hoe goed zat je op schema dit week voor dit onderdeel? (1 = niet, 5 = heel goed)",
  "Hoe tevreden ben je over je aanpak? (1 = niet, 5 = heel tevreden)",
  "Hoe zwaar voelde dit mentaal? (1 = licht, 5 = zwaar)",
] as const;

type Props = {
  strategyId: string;
  weekNumber: number;
  weekStart: string;
  reviewDue: boolean;
  lastAlignmentScore: number | null;
};

function defaultPillar() {
  return { q1: 3, q2: 3, q3: 3, open: "" };
}

export function StrategyReviewTabPanel({
  strategyId,
  weekNumber,
  weekStart,
  reviewDue,
  lastAlignmentScore,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savings, setSavings] = useState(defaultPillar);
  const [learning, setLearning] = useState(defaultPillar);
  const [xp, setXp] = useState(defaultPillar);
  const [discipline, setDiscipline] = useState(defaultPillar);

  const sets = useMemo(
    () =>
      ({
        savings: setSavings,
        learning: setLearning,
        xp: setXp,
        discipline: setDiscipline,
      }) as const,
    []
  );

  const payload: StrategyWeeklyReviewPayload = useMemo(
    () => ({ savings, learning, xp, discipline }),
    [savings, learning, xp, discipline]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await upsertStrategyReview({
          strategyId,
          weekNumber,
          weekStart,
          alignment_score: lastAlignmentScore ?? undefined,
          weeklyReviewPayload: payload,
        });
        toast.success("Wekelijkse review opgeslagen. Je kunt weer verder door de app.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  if (!reviewDue) {
    return (
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Review</h2>
        <p className="mt-2 text-sm text-[var(--text-primary)]">
          Deze week heb je je review al afgerond. De volgende review verschijnt aan het begin van een nieuwe week.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong>Verplicht.</strong> Vul alle onderdelen in om de app te ontgrendelen. Elke sectie heeft drie schalen (1–5) en
        één open reflectie.
      </div>

      {STRATEGY_REVIEW_PILLAR_KEYS.map((key) => {
        const meta = PILLAR_META[key];
        const state =
          key === "savings"
            ? savings
            : key === "learning"
              ? learning
              : key === "xp"
                ? xp
                : discipline;
        const setState = sets[key];

        return (
          <section
            key={key}
            className="space-y-4 rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)]/90 p-4 sm:p-5"
          >
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{meta.title}</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{meta.hint}</p>
            </div>

            {[1, 2, 3].map((qi) => (
              <div key={qi}>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">{Q_LABELS[qi - 1]}</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={qi === 1 ? state.q1 : qi === 2 ? state.q2 : state.q3}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setState((prev) => ({
                      ...prev,
                      ...(qi === 1 ? { q1: v } : qi === 2 ? { q2: v } : { q3: v }),
                    }));
                  }}
                  className="mt-2 w-full accent-[var(--semantic-accent)]"
                />
                <p className="mt-1 text-center font-mono text-sm text-[var(--text-primary)]">
                  {qi === 1 ? state.q1 : qi === 2 ? state.q2 : state.q3}
                </p>
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Open antwoord — wat neem je mee naar volgende week?
              </label>
              <textarea
                required
                minLength={2}
                value={state.open}
                onChange={(e) => setState((prev) => ({ ...prev, open: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                placeholder="Minimaal een paar woorden…"
              />
            </div>
          </section>
        );
      })}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl border border-[var(--semantic-accent)]/50 bg-[var(--semantic-accent)]/20 py-3 text-sm font-semibold text-[var(--semantic-accent)] transition hover:bg-[var(--semantic-accent)]/30 disabled:opacity-50"
      >
        {pending ? "Opslaan…" : "Review opslaan & app ontgrendelen"}
      </button>
    </form>
  );
}
