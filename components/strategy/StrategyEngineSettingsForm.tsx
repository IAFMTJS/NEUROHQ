"use client";

import { useMemo, useState, useTransition } from "react";
import { updateStrategyEngineParams } from "@/app/actions/strategyFocus";
import {
  derivedMissionTargets,
  type ExecutionBehaviorFocus,
  type PushAreaStyle,
  type StrategyEngineParams,
} from "@/lib/strategy/engine-params";
import {
  EXECUTION_BEHAVIOR_OPTIONS,
  EXECUTION_BEHAVIOR_LABELS_NL,
} from "@/lib/strategy/execution-behavior";
import { formatCents, parseToCents } from "@/lib/utils/currency";
import { useRouter } from "next/navigation";

type Props = {
  strategyId: string;
  initial: StrategyEngineParams;
  locksUsedThisQuarter: number;
  /** Voor anchor links (default: strategy-engine). */
  sectionId?: string;
};

const PUSH_OPTIONS: { value: PushAreaStyle; label: string }[] = [
  { value: "balanced", label: "Gebalanceerd" },
  { value: "reminder", label: "Meer reminders (strak)" },
  { value: "positive", label: "Meer positieve reinforcement" },
];

export function StrategyEngineSettingsForm({
  strategyId,
  initial,
  locksUsedThisQuarter,
  sectionId = "strategy-engine",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [minLow, setMinLow] = useState(String(initial.missions.minOnLowEnergyDay));
  const [med, setMed] = useState(
    initial.missions.targetOnMediumDay != null ? String(initial.missions.targetOnMediumDay) : ""
  );
  const [good, setGood] = useState(
    initial.missions.targetOnGoodDay != null ? String(initial.missions.targetOnGoodDay) : ""
  );
  const [maxLocks, setMaxLocks] = useState(String(initial.budget.maxLocksPerQuarter));
  const [saveEuro, setSaveEuro] = useState(
    initial.savings.quarterlyMustSaveCents != null
      ? (initial.savings.quarterlyMustSaveCents / 100).toFixed(2)
      : ""
  );
  const [learnPct, setLearnPct] = useState(
    initial.growth.quarterlyLearningProgressTargetPct != null
      ? String(initial.growth.quarterlyLearningProgressTargetPct)
      : ""
  );
  const [xpQuarter, setXpQuarter] = useState(
    initial.xp.quarterlyTargetXpEarned != null ? String(initial.xp.quarterlyTargetXpEarned) : ""
  );
  const [nM, setNM] = useState<PushAreaStyle>(initial.notifications.missions);
  const [nB, setNB] = useState<PushAreaStyle>(initial.notifications.budget);
  const [nG, setNG] = useState<PushAreaStyle>(initial.notifications.growth);
  const [nS, setNS] = useState<PushAreaStyle>(initial.notifications.strategy);
  const [behaviorFocus, setBehaviorFocus] = useState<ExecutionBehaviorFocus>(initial.execution.behaviorFocus);

  const preview = useMemo(() => {
    const min = Math.max(1, Math.min(8, parseInt(minLow, 10) || 1));
    return derivedMissionTargets({
      minOnLowEnergyDay: min,
      targetOnMediumDay: med.trim() === "" ? null : Math.max(1, Math.min(8, parseInt(med, 10) || 1)),
      targetOnGoodDay: good.trim() === "" ? null : Math.max(1, Math.min(8, parseInt(good, 10) || 1)),
    });
  }, [minLow, med, good]);

  function save() {
    setErr(null);
    setOk(false);
    startTransition(async () => {
      try {
        const minL = Math.max(1, Math.min(8, parseInt(minLow, 10) || 1));
        const medV = med.trim() === "" ? null : Math.max(1, Math.min(8, parseInt(med, 10) || 1));
        const goodV = good.trim() === "" ? null : Math.max(1, Math.min(8, parseInt(good, 10) || 1));
        const locks = Math.max(0, Math.min(100, parseInt(maxLocks, 10) || 12));
        const saveCents =
          saveEuro.trim() === "" ? null : parseToCents(saveEuro.replace(/\s/g, "").replace(",", "."));
        const lp =
          learnPct.trim() === "" ? null : Math.max(0, Math.min(100, parseInt(learnPct, 10) || 0));
        const xpRaw = xpQuarter.trim() === "" ? null : Math.max(0, Math.floor(parseInt(xpQuarter, 10) || 0));
        const xpTarget = xpRaw != null && xpRaw > 0 ? xpRaw : null;

        await updateStrategyEngineParams(strategyId, {
          missions: {
            minOnLowEnergyDay: minL,
            targetOnMediumDay: medV,
            targetOnGoodDay: goodV,
          },
          budget: { maxLocksPerQuarter: locks },
          savings: {
            quarterlyMustSaveCents: saveCents != null && saveCents >= 0 ? saveCents : null,
          },
          growth: {
            quarterlyLearningProgressTargetPct: lp,
          },
          xp: {
            quarterlyTargetXpEarned: xpTarget,
          },
          notifications: {
            missions: nM,
            budget: nB,
            growth: nG,
            strategy: nS,
          },
          execution: {
            behaviorFocus,
          },
        });
        setOk(true);
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  const maxL = Math.max(0, Math.min(100, parseInt(maxLocks, 10) || 12));

  return (
    <section
      id={sectionId}
      className="space-y-6 rounded-2xl border border-[var(--accent-focus)]/25 bg-[var(--bg-elevated)]/90 p-5 shadow-[0_0_36px_rgba(59,130,246,0.08)]"
      aria-label="Strategy engine instellingen"
    >
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-focus)]">
          Strategy engine
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Deze waarden sturen het hele systeem: aanbevolen missies per energieniveau, budget-lock limiet, spaar- en
          leerdoelen dit kwartaal, en bias voor push-notificaties.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Missies (energie)</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Minimum op een slechte dag (lage energie) wordt opgeteld met slaap/fysiek model; normaal/goed volgen of je
            vult zelf doelen in.
          </p>
          <label className="block text-xs text-[var(--text-muted)]">
            Min. missies bij lage energie (1–8)
            <input
              type="number"
              min={1}
              max={8}
              value={minLow}
              onChange={(e) => setMinLow(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--text-muted)]">
            Doel gemiddelde energie (leeg = auto: min + 2)
            <input
              type="number"
              min={1}
              max={8}
              value={med}
              onChange={(e) => setMed(e.target.value)}
              placeholder="auto"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--text-muted)]">
            Doel hoge energie (leeg = auto: min + 4)
            <input
              type="number"
              min={1}
              max={8}
              value={good}
              onChange={(e) => setGood(e.target.value)}
              placeholder="auto"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
          <p className="rounded-lg bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            Preview: laag <strong className="text-[var(--text-primary)]">{preview.low}</strong> · gemiddeld{" "}
            <strong className="text-[var(--text-primary)]">{preview.medium}</strong> · goed/ultra{" "}
            <strong className="text-[var(--text-primary)]">{preview.good}</strong> (na normalisatie max 8)
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4 lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Executie op Missions — gedragsfocus
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Kies welk gedrag het kwartaal meetelt voor de executie-pijler op Strategy Command. Elke optie gebruikt andere
            signalen uit je missiepagina (deadlines, routine, weerstand, …).
          </p>
          <label className="block text-xs text-[var(--text-muted)]">
            Focus
            <select
              value={behaviorFocus}
              onChange={(e) => setBehaviorFocus(e.target.value as ExecutionBehaviorFocus)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {EXECUTION_BEHAVIOR_OPTIONS.map((id) => (
                <option key={id} value={id}>
                  {EXECUTION_BEHAVIOR_LABELS_NL[id].title}
                </option>
              ))}
            </select>
          </label>
          <p className="rounded-lg bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {EXECUTION_BEHAVIOR_LABELS_NL[behaviorFocus].measure}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Budget locks</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Maximaal aantal nieuwe no-spend locks in dit kalenderkwartaal. Nu gebruikt:{" "}
            <strong className="text-[var(--text-primary)]">
              {locksUsedThisQuarter} / {maxL || "—"}
            </strong>
            .
          </p>
          <label className="block text-xs text-[var(--text-muted)]">
            Max locks per kwartaal (0–100)
            <input
              type="number"
              min={0}
              max={100}
              value={maxLocks}
              onChange={(e) => setMaxLocks(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sparen dit kwartaal</h3>
          <label className="block text-xs text-[var(--text-muted)]">
            Verplicht spaardoel (EUR, leeg = geen vast doel in engine)
            <input
              type="text"
              inputMode="decimal"
              value={saveEuro}
              onChange={(e) => setSaveEuro(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
          {initial.savings.quarterlyMustSaveCents != null && (
            <p className="text-xs text-[var(--text-muted)]">
              Huidig doel: {formatCents(initial.savings.quarterlyMustSaveCents)} — vergelijk met je spaarrekening op
              Budget.
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Growth / learning</h3>
          <label className="block text-xs text-[var(--text-muted)]">
            Doel leerprogress dit kwartaal (% van actief traject, 0–100)
            <input
              type="number"
              min={0}
              max={100}
              value={learnPct}
              onChange={(e) => setLearnPct(e.target.value)}
              placeholder="bijv. 25"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
          <p className="text-[10px] text-[var(--text-muted)]">
            Heb je een actief protocol: de Strategy-score gebruikt dan eerst{" "}
            <span className="font-medium text-[var(--text-secondary)]">afgeronde weekmissies / taken in die week</span>{" "}
            op je Missions-bord; dit veld geldt als fallback als er geen weektaken in de definitie staan.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">XP dit kwartaal</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Bruto XP dat je wilt verdienen dit kalenderkwartaal (zoals gelogd in xp_events). Leeg = neutraal in strategy
            score.
          </p>
          <label className="block text-xs text-[var(--text-muted)]">
            Doel XP (heel getal, leeg = geen vast doel)
            <input
              type="number"
              min={0}
              value={xpQuarter}
              onChange={(e) => setXpQuarter(e.target.value)}
              placeholder="bijv. 5000"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Push-notificaties (per domein)
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Bepaalt bias in copy-selectie (reminder vs positief). Master-toggle blijft in Settings → meldingen.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Missies", nM, setNM] as const,
            ["Budget", nB, setNB] as const,
            ["Growth", nG, setNG] as const,
            ["Strategy", nS, setNS] as const,
          ].map(([label, val, set]) => (
            <label key={label} className="block text-xs text-[var(--text-muted)]">
              {label}
              <select
                value={val}
                onChange={(e) => set(e.target.value as PushAreaStyle)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {PUSH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {err && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">{err}</p>
      )}
      {ok && (
        <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          Engine bijgewerkt. Dashboard en missies gebruiken dit bij de volgende refresh.
        </p>
      )}

      <button
        type="button"
        onClick={() => void save()}
        disabled={pending}
        className="rounded-xl border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--accent-focus)] transition hover:bg-[var(--accent-focus)]/30 disabled:opacity-50"
      >
        {pending ? "Opslaan…" : "Engine opslaan"}
      </button>
    </section>
  );
}
