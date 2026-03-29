"use client";

import { useState } from "react";
import { CommanderStatRing } from "@/components/commander/CommanderStatRing";

type ProfileMain = "home" | "engine";

const MOCK_ALERTS = [
  {
    id: "a1",
    title: "Wekelijkse burn nadert drempel",
    body: "Je zit op 78% van de soft cap — engine verhoogt friction op impuls-spend.",
    time: "12 min",
    tone: "warn" as const,
    unread: true,
  },
  {
    id: "a2",
    title: "Ochtend-push verzonden",
    body: "Herinnering: deep-work blok om 08:00 (mock).",
    time: "2 u",
    tone: "neutral" as const,
    unread: false,
  },
  {
    id: "a3",
    title: "Agenda-sync voltooid",
    body: "Google Calendar · 3 nieuwe events geïmporteerd.",
    time: "Gisteren",
    tone: "ok" as const,
    unread: false,
  },
] as const;

function profileTabClasses(active: boolean) {
  const base =
    "rounded-xl px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide transition min-h-[44px] flex flex-1 items-center justify-center sm:flex-none outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0";
  const on =
    "border border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(var(--mode-rgb-deep),0.22)] text-[var(--semantic-accent)] shadow-[inset_0_1px_0_rgba(var(--mode-rgb),0.12)]";
  const off =
    "border border-transparent bg-[var(--bg-surface)]/20 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/35 hover:text-[var(--text-primary)]";
  return `${base} ${active ? on : off}`;
}

function alertToneBorder(tone: (typeof MOCK_ALERTS)[number]["tone"]) {
  switch (tone) {
    case "warn":
      return "border-[rgba(var(--hud-amber-500-rgb),0.4)] shadow-[0_0_20px_rgba(var(--hud-amber-500-rgb),0.08)]";
    case "ok":
      return "border-[rgba(52,211,153,0.35)] shadow-[0_0_16px_rgba(52,211,153,0.06)]";
    default:
      return "border-[rgba(var(--mode-rgb),0.12)]";
  }
}

function alertLed(tone: (typeof MOCK_ALERTS)[number]["tone"]) {
  switch (tone) {
    case "warn":
      return "bg-[var(--hud-amber-500)] shadow-[0_0_10px_rgba(var(--hud-amber-500-rgb),0.6)]";
    case "ok":
      return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]";
    default:
      return "bg-[var(--semantic-accent)]/70 shadow-[0_0_8px_rgba(var(--mode-rgb),0.35)]";
  }
}

/**
 * Profiel home in nieuwe commander-panel stijl — mock, alleen visual lab.
 */
export function VisualLabProfilePageConcept() {
  const [main, setMain] = useState<ProfileMain>("home");

  return (
    <section
      className="relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="profile-user-visual-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="profile-user-visual-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Profiel · paginastyling (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Cinematic shell zoals missies; hoofdnav matcht productie <span className="text-[var(--text-primary)]">Profiel / Engine</span>. Identiteit,
            stat rings en XP in één scanbare kolom.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div className="dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(var(--mode-rgb),0.14),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-[1] flex flex-col gap-0 p-4 md:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Operator</p>
              <h3 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                Profiel
              </h3>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              ← HQ
            </button>
          </header>

          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Profiel navigatie (concept)">
            <button type="button" className={profileTabClasses(main === "home")} onClick={() => setMain("home")}>
              Profiel
            </button>
            <button type="button" className={profileTabClasses(main === "engine")} onClick={() => setMain("engine")}>
              Engine
            </button>
          </nav>

          <div className="mt-4 space-y-4">
            {main === "home" ? (
              <>
                <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 md:p-5">
                    <div
                      className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[rgba(var(--semantic-accent),0.35)] bg-gradient-to-br from-[rgba(var(--mode-rgb-deep),0.4)] to-[rgba(6,18,30,0.9)] text-2xl font-bold text-[var(--semantic-accent)] shadow-[0_0_28px_rgba(var(--mode-rgb),0.2)] sm:mx-0"
                      aria-hidden
                    >
                      HQ
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Call sign</p>
                      <p className="mt-1 text-lg font-bold text-[var(--text-primary)] md:text-xl">Commander N.</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">commander@neurohq.app</p>
                      <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
                        Lid sinds mrt 2025 · focusmodus <span className="font-semibold text-[var(--text-primary)]">Strategie</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-center gap-3 sm:flex-col sm:justify-center">
                      <span className="cursor-default rounded-lg bg-[var(--semantic-accent)]/15 px-3 py-2 text-center text-[11px] font-semibold text-[var(--semantic-accent)]">
                        Bewerk profiel
                      </span>
                      <span className="cursor-default rounded-lg border border-[rgba(var(--mode-rgb),0.18)] px-3 py-2 text-center text-[11px] font-medium text-[var(--text-secondary)]">
                        Rapport · inzichten
                      </span>
                    </div>
                  </div>
                </article>

                <div className="flex flex-wrap items-end justify-center gap-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.35)] px-4 py-5">
                  <CommanderStatRing variant="energy" value={68} size={96} />
                  <CommanderStatRing variant="focus" value={54} size={96} />
                  <CommanderStatRing variant="load" value={71} size={96} />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <span>XP naar level 13</span>
                    <span className="tabular-nums text-[var(--text-secondary)]">8.420 / 12.000</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
                    <div
                      className="h-full w-[70%] rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] via-[var(--semantic-accent)] to-emerald-400/90 shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)]"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">Level 12 · streak 4 dagen (mock)</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Dagelijkse missie</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Lees 15 min · geen scherm</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
                      <div className="h-full w-[40%] rounded-full bg-[var(--semantic-accent)]/80" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Gedrag · snapshot</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Impuls-score stabiel. Engine beveelt korte recovery aan vóór 17:00.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-[rgba(var(--semantic-accent),0.2)] bg-[rgba(6,18,30,0.4)] p-4 md:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Engine (stub)</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Identiteit · Gedrag · Modi</p>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  In productie: subnav naar identity/behavior/modes. Hier alleen visuele plekhouder zodat de Profiel/Engine-switch dezelfde cadans heeft als op /profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Identiteit", "Gedrag", "Modi"].map((t, i) => (
                    <span
                      key={t}
                      className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                        i === 0
                          ? "border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.2)] text-[var(--semantic-accent)]"
                          : "border-[rgba(var(--mode-rgb),0.12)] text-[var(--text-muted)]"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Meldingen-hub: inbox + voorkeuren in één commander-panel — mock, alleen visual lab.
 */
export function VisualLabNotificationsPageConcept() {
  const [sub, setSub] = useState<"inbox" | "prefs">("inbox");

  return (
    <section
      className="relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="notifications-user-visual-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="notifications-user-visual-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Meldingen · paginastyling (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Gebruikerspagina voor alerts en push: tab-rail, LED-accenten per urgentie, compacte voorkeurenstrip — zelfde HUD-diepte als missies.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div className="dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(var(--hud-amber-500-rgb),0.08),transparent_50%)]"
          aria-hidden
        />

        <div className="relative z-[1] flex flex-col gap-0 p-4 md:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Signalen</p>
              <h3 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                Meldingen
              </h3>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              Alles gelezen
            </button>
          </header>

          <div className="dashboard-top-strip mt-3">
            <div className="dashboard-top-strip-track" role="tablist" aria-label="Meldingen-weergave">
              <button
                type="button"
                role="tab"
                aria-selected={sub === "inbox"}
                onClick={() => setSub("inbox")}
                className={`dashboard-mini-btn ${sub === "inbox" ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`}
              >
                Inbox
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sub === "prefs"}
                onClick={() => setSub("prefs")}
                className={`dashboard-mini-btn ${sub === "prefs" ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`}
              >
                Voorkeuren
              </button>
              <span className="dashboard-mini-strip-label">Weergave</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {sub === "inbox" ? (
              <ul className="space-y-2">
                {MOCK_ALERTS.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={`flex w-full gap-3 rounded-xl border bg-[rgba(6,18,30,0.42)] p-3 text-left transition hover:bg-[rgba(var(--mode-rgb-deep),0.08)] md:p-4 ${alertToneBorder(a.tone)}`}
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${alertLed(a.tone)}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{a.title}</p>
                          {a.unread ? (
                            <span className="rounded bg-[var(--semantic-accent)]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
                              Nieuw
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">{a.body}</p>
                        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{a.time}</p>
                      </div>
                      <span className="shrink-0 self-center text-[var(--text-muted)]" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Push & e-mail (mock)</p>
                {[
                  { label: "Ochtendbriefing", on: true },
                  { label: "Budget- en burn-waarschuwingen", on: true },
                  { label: "Avond recap", on: false },
                  { label: "Productquotes / tips", on: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.45)] px-3 py-2.5"
                  >
                    <span className="text-xs font-medium text-[var(--text-primary)]">{row.label}</span>
                    <span
                      className={`relative h-6 w-11 shrink-0 rounded-full ${row.on ? "bg-emerald-500/55" : "bg-[var(--card-border)]"}`}
                      aria-hidden
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${row.on ? "left-5" : "left-0.5"}`}
                      />
                    </span>
                  </div>
                ))}
                <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/25 p-3 text-[11px] text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Stille uren</span> · 22:00 – 07:00 · tijdzone Europe/Amsterdam
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
