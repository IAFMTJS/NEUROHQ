"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { MoodManualPanel } from "@/components/mood/MoodManualPanel";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { MOOD_LABEL_META, type MoodLabel } from "@/lib/mood-intervention-config";
import { reportInsightsHref } from "@/lib/profile-routes";

type ProfileMain = "home" | "engine";

const PROFILE_ORBIT_TILE =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.07)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-3 py-2.5 transition-colors";

function OrbitTile({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`${PROFILE_ORBIT_TILE} ${className}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{title}</p>
      <div className="mt-1.5 text-sm font-semibold leading-snug text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

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
 * Profiel home in nieuwe commander-panel stijl — mock, alleen visual lab.
 */
export function VisualLabProfilePageConcept() {
  const [main, setMain] = useState<ProfileMain>("home");
  const [moodOpen, setMoodOpen] = useState(false);
  const [moodLabel, setMoodLabel] = useState<MoodLabel | null>("good");

  const ringSize = 200;
  const barPct = 70;
  const curXp = 8_420;
  const spanXp = 12_000;
  const totalXp = 45_200;
  const level = 12;
  const dailyRewardXp = 360;
  const xpToNext = 3_580;

  return (
    <section
      className="relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="profile-user-visual-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="profile-user-visual-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Profiel · command deck (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Zelfde command deck + segmented tab rail als productie <code className="rounded bg-black/30 px-1 text-[10px]">/profile</code> (
            <code className="rounded bg-black/30 px-1 text-[10px]">ProfileCommandDeckLayout</code>). Inhoud volgt profiel-home (
            <code className="rounded bg-black/30 px-1 text-[10px]">ProfileHomeCompact</code>): level-
            <code className="rounded bg-black/30 px-1 text-[10px]">EnergyRing</code>-orbit, challenges, mood, insight. Mock data.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <VisualLabCommandDeck>
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.18)] pb-4">
            <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Operator</p>
              <h3 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                Profiel
              </h3>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.55)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] shadow-[0_0_18px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              ← HQ
            </button>
          </header>

          <div className="mt-4" role="navigation" aria-label="Profiel navigatie (concept)">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Weergave</span>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
              <button
                type="button"
                role="tab"
                aria-selected={main === "home"}
                onClick={() => setMain("home")}
                className={tasksDeckTabClass(main === "home")}
              >
                Profiel
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={main === "engine"}
                onClick={() => setMain("engine")}
                className={tasksDeckTabClass(main === "engine")}
              >
                Engine
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {main === "home" ? (
              <>
                <section
                  className="glass-card !rounded-xl !p-3 !shadow-none sm:!p-5"
                  aria-label="Level orbit (concept, zoals profiel home)"
                >
                  <div className="relative z-[1] mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-[1fr_minmax(0,220px)_1fr] md:items-center md:gap-3">
                    <div className="order-2 hidden flex-col justify-center gap-3 md:order-1 md:flex">
                      <OrbitTile title="Rang">
                        <span className="line-clamp-2 text-[13px] leading-snug" title="Strategist III (mock)">
                          Strategist III
                        </span>
                      </OrbitTile>
                      <OrbitTile title="Streak actief">4 dagen</OrbitTile>
                      <OrbitTile title="Langste reeks">21 dagen</OrbitTile>
                      <OrbitTile title="Momentum" className="bg-[rgba(var(--mode-rgb-deep),0.1)]">
                        62 · Stabiel
                      </OrbitTile>
                    </div>

                    <div className="order-1 flex flex-col items-center justify-center md:order-2">
                      <div className="relative">
                        <div
                          className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.16)_0%,transparent_62%)] blur-md"
                          aria-hidden
                        />
                        <div className="relative drop-shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
                          <EnergyRing
                            profileOrbit
                            size={ringSize}
                            progress={barPct}
                            label={`Level ${level}`}
                            value={`${barPct}%`}
                            mode="green"
                          />
                        </div>
                      </div>
                      <p className="mt-3 max-w-[260px] text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
                        <span className="tabular-nums text-[var(--text-secondary)]">
                          {curXp.toLocaleString()} / {spanXp.toLocaleString()} XP
                        </span>{" "}
                        naar Level {level + 1} · {totalXp.toLocaleString()} totaal
                      </p>
                      <p className="mt-1.5 text-center">
                        <Link
                          href="/xp"
                          className="text-[11px] font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
                        >
                          XP-bridge
                        </Link>
                      </p>
                    </div>

                    <div className="order-3 hidden flex-col justify-center gap-3 md:flex">
                      <OrbitTile title="Volgende rang">Architect I</OrbitTile>
                      <OrbitTile title="XP tot unlock">
                        Nog {xpToNext.toLocaleString()} XP
                      </OrbitTile>
                      <OrbitTile title="Totaal XP">{totalXp.toLocaleString()}</OrbitTile>
                    </div>

                    <div className="order-4 flex flex-wrap justify-center gap-2 md:col-span-3 md:hidden">
                      <OrbitTile title="Rang">
                        <span className="max-w-[100px] truncate text-xs">Strategist III</span>
                      </OrbitTile>
                      <OrbitTile title="Streak">4d</OrbitTile>
                      <OrbitTile title="Unlock">{xpToNext.toLocaleString()} XP</OrbitTile>
                      <OrbitTile title="XP %">{barPct}%</OrbitTile>
                    </div>
                  </div>
                </section>

                <section
                  className="glass-card !rounded-xl !space-y-4 !p-4 sm:!p-5 !shadow-none"
                  aria-labelledby="vl-daily-challenges-heading"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 id="vl-daily-challenges-heading" className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">
                        Dagelijkse challenges
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                        3 lichte challenges, elk ongeveer {dailyRewardXp} XP (
                        {Math.round((dailyRewardXp / Math.max(1, xpToNext)) * 100)}% richting volgend level).
                      </p>
                    </div>
                    <span
                      className="pointer-events-none min-w-[10.5rem] rounded-lg border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.48)] to-[rgba(6,18,30,0.96)] px-2.5 py-1.5 text-center text-sm font-medium text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_14px_rgba(var(--mode-rgb),0.07)] [color-scheme:dark]"
                      aria-hidden
                    >
                      2026-03-29
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {[
                      { tone: "Opstart", title: "Inbox: 5 items wegwerken", xp: dailyRewardXp },
                      { tone: "Momentum", title: "20 min wandeling (ochtend)", xp: dailyRewardXp },
                      { tone: "Uitdaging", title: "Deep-work: één blok 45 min", xp: dailyRewardXp },
                    ].map((c) => (
                      <div
                        key={c.tone}
                        className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb-deep),0.06)] p-3"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{c.tone}</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{c.title}</p>
                        <p className="mt-1 text-xs text-[var(--accent-focus)]">+{c.xp} XP potentieel</p>
                        <button
                          type="button"
                          className="mt-2 w-full cursor-default rounded-lg border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] opacity-80"
                          disabled
                        >
                          Plan uitdaging (mock)
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    Volledige XP-bridge:{" "}
                    <Link
                      href="/xp"
                      className="font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
                    >
                      XP-pagina
                    </Link>
                    .
                  </p>
                </section>

                <div className="glass-card !rounded-xl !p-4 !shadow-none sm:!p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300/90">Mood</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {moodLabel && MOOD_LABEL_META[moodLabel] ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-violet-950/35 px-2.5 py-1 text-[11px] font-semibold text-violet-100/95">
                        <span aria-hidden>{MOOD_LABEL_META[moodLabel].emoji}</span>
                        {MOOD_LABEL_META[moodLabel].label}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Nog geen mood vandaag</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setMoodOpen(true)}
                      className="rounded-lg border border-violet-500/40 bg-violet-950/30 px-3 py-1.5 text-[11px] font-semibold text-violet-100/95 hover:border-violet-400/50"
                    >
                      Update mood
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                    Zelfde flow als Brain Status op het dashboard — energie/focus daar, mood hier.
                  </p>
                </div>

                <MoodManualPanel open={moodOpen} onClose={() => setMoodOpen(false)} onMoodSaved={(label) => setMoodLabel(label)} />

                <div className="glass-card !rounded-xl !p-4 !shadow-none sm:!p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">Insight</p>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--text-primary)]">
                    Kleine actie vandaag verzet veel — log een missie om je curve te vullen. (mock coachregel)
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
                    <Link
                      href={reportInsightsHref("overview")}
                      className="rounded-sm text-[var(--accent-focus)] underline-offset-2 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
                    >
                      Volledige insights
                    </Link>
                    <span className="text-[var(--text-muted)]" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/xp"
                      className="rounded-sm text-[var(--text-muted)] underline-offset-2 hover:text-[var(--accent-focus)] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
                    >
                      Voorspelling
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="card-simple space-y-3 !rounded-xl p-4 md:p-5">
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
      </VisualLabCommandDeck>
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
