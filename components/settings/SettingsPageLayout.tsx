"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = { query: string; setQuery: (q: string) => void };

const SettingsPageLayoutContext = createContext<Ctx | null>(null);

export function useSettingsPageLayout() {
  const v = useContext(SettingsPageLayoutContext);
  if (!v) throw new Error("useSettingsPageLayout must be used within SettingsPageLayout");
  return v;
}

const NAV = [
  { id: "settings-section-user", label: "Gebruiker", hint: "Account" },
  { id: "settings-section-missions", label: "Missies", hint: "Automatisering" },
  { id: "settings-section-system", label: "Systeem", hint: "Thema, budget, DCIC" },
  { id: "settings-section-device", label: "Toestel", hint: "Push, agenda, export" },
] as const;

export function SettingsPageLayout({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <SettingsPageLayoutContext.Provider value={value}>
      <div className="space-y-4 md:space-y-5">
        <header className="overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[var(--bg-elevated)]/20 px-4 py-4 md:px-5">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a
              href="#settings-section-system"
              className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:border-[rgba(var(--mode-rgb),0.35)] hover:text-[var(--text-primary)]"
            >
              Cache legen
            </a>
            <a
              href="#settings-section-device"
              className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:border-[rgba(var(--mode-rgb),0.35)] hover:text-[var(--text-primary)]"
            >
              Data export
            </a>
          </div>
          <div className="relative mt-3">
            <label htmlFor="settings-search" className="sr-only">
              Zoek in instellingen
            </label>
            <input
              id="settings-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek in instellingen…"
              autoComplete="off"
              className="w-full rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(0,0,0,0.35)] px-4 py-2.5 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--mode-rgb),0.35)]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]" aria-hidden>
              ⌕
            </span>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] lg:gap-8">
          <nav
            className="mb-6 flex flex-wrap gap-2 lg:sticky lg:top-24 lg:mb-0 lg:flex-col lg:self-start lg:gap-1"
            aria-label="Instellingen-secties"
          >
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-lg border border-transparent px-3 py-2 text-left text-xs transition-colors hover:border-[rgba(var(--mode-rgb),0.2)] hover:bg-[rgba(var(--mode-rgb-deep),0.12)]"
              >
                <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
                <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{item.hint}</span>
              </a>
            ))}
          </nav>

          <div className="min-w-0 space-y-5">{children}</div>
        </div>
      </div>
    </SettingsPageLayoutContext.Provider>
  );
}
