"use client";

import { useState } from "react";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";

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
            Meldingen · command deck (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Zelfde command deck + <code className="rounded bg-black/30 px-1 text-[10px]">dashboard-top-strip</code> als andere hubs; LED-accenten per urgentie,
            voorkeurenstrip — mock inbox.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <VisualLabCommandDeck accentFlareClassName="bg-[radial-gradient(ellipse_at_80%_20%,rgba(var(--hud-amber-500-rgb),0.08),transparent_50%)]">
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

          <div className="mt-4 space-y-6">
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
      </VisualLabCommandDeck>
    </section>
  );
}
