"use client";

import { useState, useTransition } from "react";
import { upsertQuarterlyStrategy } from "@/app/actions/strategy";

const THEME_PRESETS = ["Focus", "Health", "Ship", "Learn", "Rest", "Create", "Connect", "Simplify"];

const IDENTITY_PROMPTS = [
  "I am someone who…",
  "When I'm stuck I want to remember…",
  "I am focused and consistent.",
];

type Strategy = {
  id?: string;
  primary_theme: string | null;
  secondary_theme: string | null;
  savings_goal_id: string | null;
  identity_statement: string | null;
  key_results: string | null;
  anti_goals?: string | null;
  one_word?: string | null;
  north_star?: string | null;
} | null;

type Goal = { id: string; name: string };

const IDENTITY_MAX = 300;
const KEY_RESULTS_MAX_LINES = 6;

export function StrategyForm({ initial, goals }: { initial: Strategy; goals: Goal[] }) {
  const [primary, setPrimary] = useState(initial?.primary_theme ?? "");
  const [secondary, setSecondary] = useState(initial?.secondary_theme ?? "");
  const [savingsGoalId, setSavingsGoalId] = useState(initial?.savings_goal_id ?? "");
  const [identity, setIdentity] = useState(initial?.identity_statement ?? "");
  const [keyResults, setKeyResults] = useState(initial?.key_results ?? "");
  const [antiGoals, setAntiGoals] = useState(initial?.anti_goals ?? "");
  const [oneWord, setOneWord] = useState(initial?.one_word ?? "");
  const [northStar, setNorthStar] = useState(initial?.north_star ?? "");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ themes: true, identity: true, results: true, other: true });
  const [pending, startTransition] = useTransition();

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertQuarterlyStrategy({
        primary_theme: primary || null,
        secondary_theme: secondary || null,
        savings_goal_id: savingsGoalId || null,
        identity_statement: identity || null,
        key_results: keyResults.trim() || null,
        anti_goals: antiGoals.trim() || null,
        one_word: oneWord.trim() || null,
        north_star: northStar.trim() || null,
      });
    });
  }

  const keyResultsLines = keyResults.trim().split(/\n/).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Quarterly strategy</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Theme, identity, key results, anti-goals, and linked savings goal.</p>
      </div>
      <div className="divide-y divide-[var(--card-border)]">
        <section>
          <button
            type="button"
            onClick={() => toggleSection("themes")}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">Themes & one word</span>
            <span className="text-[var(--text-muted)]">{openSections.themes ? "−" : "+"}</span>
          </button>
          {openSections.themes && (
            <div className="space-y-3 px-4 pb-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Quick picks</p>
                <div className="flex flex-wrap gap-2">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPrimary(primary === t ? "" : t)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                        primary === t
                          ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]"
                          : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">Primary theme</label>
                <input
                  type="text"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  placeholder="e.g. Focus"
                  maxLength={80}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">Secondary theme</label>
                <input
                  type="text"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  placeholder="e.g. Health"
                  maxLength={80}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">One word for the quarter</label>
                <input
                  type="text"
                  value={oneWord}
                  onChange={(e) => setOneWord(e.target.value.slice(0, 30))}
                  placeholder="e.g. Ship"
                  maxLength={30}
                  className="mt-1.5 w-full max-w-[140px] rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
              </div>
            </div>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection("identity")}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">Identity & north star</span>
            <span className="text-[var(--text-muted)]">{openSections.identity ? "−" : "+"}</span>
          </button>
          {openSections.identity && (
            <div className="space-y-3 px-4 pb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">Identity statement</label>
                <textarea
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value.slice(0, IDENTITY_MAX))}
                  placeholder={IDENTITY_PROMPTS[0]}
                  rows={3}
                  maxLength={IDENTITY_MAX}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Who you want to be this quarter. {identity.length}/{IDENTITY_MAX}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">North star (if one thing only)</label>
                <input
                  type="text"
                  value={northStar}
                  onChange={(e) => setNorthStar(e.target.value.slice(0, 120))}
                  placeholder="The single outcome that would make this quarter a success"
                  maxLength={120}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
              </div>
            </div>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection("results")}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">Key results & anti-goals</span>
            <span className="text-[var(--text-muted)]">{openSections.results ? "−" : "+"}</span>
          </button>
          {openSections.results && (
            <div className="space-y-3 px-4 pb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">Key results / milestones</label>
                <textarea
                  value={keyResults}
                  onChange={(e) => {
                    const lines = e.target.value.split(/\n/).slice(0, KEY_RESULTS_MAX_LINES);
                    setKeyResults(lines.join("\n"));
                  }}
                  placeholder="e.g. Ship feature X. Complete course Y. Save €Z."
                  rows={4}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  One per line, up to {KEY_RESULTS_MAX_LINES}. {keyResultsLines}/{KEY_RESULTS_MAX_LINES}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">Anti-goals (what I’m not doing)</label>
                <textarea
                  value={antiGoals}
                  onChange={(e) => setAntiGoals(e.target.value.slice(0, 400))}
                  placeholder="e.g. No new side projects. No extra meetings on Fridays."
                  rows={2}
                  maxLength={400}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                />
              </div>
            </div>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => toggleSection("other")}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">Linked goal & save</span>
            <span className="text-[var(--text-muted)]">{openSections.other ? "−" : "+"}</span>
          </button>
          {openSections.other && (
            <div className="space-y-3 px-4 pb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)]">Savings goal (optional)</label>
                <select
                  value={savingsGoalId}
                  onChange={(e) => setSavingsGoalId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
                >
                  <option value="">None</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
                Save strategy
              </button>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}
