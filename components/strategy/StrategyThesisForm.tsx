"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertStrategyFocus } from "@/app/actions/strategyFocus";
import { domainLabel, type StrategyDomain, type WeeklyAllocation } from "@/lib/strategyDomains";

const DOMAINS: StrategyDomain[] = ["discipline", "health", "learning", "business"];
const IDENTITIES = [
  { value: "commander", label: "Commander" },
  { value: "builder", label: "Builder" },
  { value: "operator", label: "Operator" },
  { value: "athlete", label: "Athlete" },
  { value: "scholar", label: "Scholar" },
] as const;

const DEFAULT_ALLOCATION: WeeklyAllocation = {
  discipline: 25,
  health: 25,
  learning: 25,
  business: 25,
};

export function StrategyThesisForm() {
  const router = useRouter();
  const [thesis, setThesis] = useState("");
  const [thesisWhy, setThesisWhy] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetMetric, setTargetMetric] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState<StrategyDomain>("discipline");
  const [secondaryDomains, setSecondaryDomains] = useState<StrategyDomain[]>([]);
  const [identityProfile, setIdentityProfile] = useState<"commander" | "builder" | "operator" | "athlete" | "scholar">("operator");
  const [alloc, setAlloc] = useState<WeeklyAllocation>({ ...DEFAULT_ALLOCATION });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSecondary = (d: StrategyDomain) => {
    if (primaryDomain === d) return;
    setSecondaryDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : prev.length < 2 ? [...prev, d] : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesis.trim() || !deadline) return;
    setError(null);
    setPending(true);
    try {
      await upsertStrategyFocus({
        thesis: thesis.trim(),
        thesis_why: thesisWhy.trim() || null,
        deadline,
        target_metric: targetMetric.trim() || null,
        primary_domain: primaryDomain,
        secondary_domains: secondaryDomains,
        weekly_allocation: alloc,
        identity_profile: identityProfile,
      });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Er is iets misgegaan.";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
  const validAlloc = sum === 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">
        Nieuwe strategie — Thesis & focus
      </h2>
      <p className="text-xs text-[var(--text-muted)]">
        Geen thesis = geen actieve strategie. Vul kernstelling, motivatie, deadline en target in.
      </p>

      {error && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-primary)]" role="alert">
          <p className="font-medium">Strategie opslaan mislukt</p>
          <p className="mt-1 text-[var(--text-muted)]">{error}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Controleer in Vercel: Project → Settings → Environment Variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). Voer migraties uit in Supabase SQL Editor. Zie DEPLOY.md.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Core Thesis (1 zin)</label>
        <input
          type="text"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder="Ik verhoog mijn Discipline-consistency naar 85% binnen 30 dagen..."
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Waarom (persoonlijke motivatie)</label>
        <textarea
          value={thesisWhy}
          onChange={(e) => setThesisWhy(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          placeholder="Om mijn werkoutput te stabiliseren..."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Target metric</label>
          <input
            type="text"
            value={targetMetric}
            onChange={(e) => setTargetMetric(e.target.value)}
            placeholder="85% consistency"
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Primary domein (max 1)</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPrimaryDomain(d)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                primaryDomain === d
                  ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]"
                  : "border-[var(--card-border)] bg-[var(--bg-card)] text-[var(--text-primary)]"
              }`}
            >
              {domainLabel(d)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Secondary domeinen (max 2)</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleSecondary(d)}
              disabled={primaryDomain === d}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${
                secondaryDomains.includes(d)
                  ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                  : "border-[var(--card-border)] bg-[var(--bg-card)] text-[var(--text-primary)]"
              }`}
            >
              {domainLabel(d)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Strategic identity</label>
        <select
          value={identityProfile}
          onChange={(e) => setIdentityProfile(e.target.value as typeof identityProfile)}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          {IDENTITIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">
          Weekly focus (100 punten totaal) — {sum}/100
        </label>
        <div className="mt-2 space-y-2">
          {DOMAINS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-sm text-[var(--text-primary)]">{domainLabel(d)}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={alloc[d]}
                onChange={(e) =>
                  setAlloc((prev) => ({ ...prev, [d]: Number(e.target.value) }))
                }
                className="flex-1"
              />
              <span className="w-8 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {alloc[d]}
              </span>
            </div>
          ))}
        </div>
        {!validAlloc && (
          <p className="mt-1 text-xs text-[var(--accent-warning)]">
            Som moet 100 zijn. Pas sliders aan.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !thesis.trim() || !deadline || !validAlloc}
        className="w-full rounded-lg bg-[var(--accent-focus)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--glow-stack-cyan)] disabled:opacity-50"
      >
        {pending ? "Bezig..." : "Strategie activeren"}
      </button>
    </form>
  );
}
