"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ProfileSpecialEventsBundle } from "@/app/actions/profile-special-events";
import { claimQuestCampaignRewards } from "@/app/actions/quest-campaign";
import { PlatformGameProgressPanel } from "@/components/profile/PlatformGameProgressPanel";
import { QuestCampaignModal } from "@/components/quests/QuestCampaignModal";
import { QuestAnswerHistoryList } from "@/components/quests/QuestAnswerHistoryList";
import { buildQuestClaimCelebrationMessage } from "@/lib/platform-reward-celebration";
import { getPlatformGameStatusSummary, platformGameStatusBadgeClass } from "@/lib/platform-game-status";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { showLevelUpCelebration } from "@/lib/ui/level-up-celebration";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function bundleHasContent(b: ProfileSpecialEventsBundle): boolean {
  return b.events.length > 0 || b.upcomingEvents.length > 0 || b.games.length > 0 || b.quest != null;
}

function SectionHeading({
  icon,
  label,
  kicker,
  id,
}: {
  icon: string;
  label: string;
  kicker?: string;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface)]/50 text-lg ring-1 ring-[var(--card-border)]/60"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{kicker}</p>
        ) : null}
        <h3 id={id} className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          {label}
        </h3>
      </div>
    </div>
  );
}

export function ProfileSpecialEventsClient({ bundle }: { bundle: ProfileSpecialEventsBundle }) {
  const router = useRouter();
  const [questPending, startQuestClaimTransition] = useTransition();
  const [questOpen, setQuestOpen] = useState(false);
  const has = bundleHasContent(bundle);

  useEffect(() => {
    if (typeof window === "undefined" || !has) return;
    const id = window.location.hash.replace(/^#/, "");
    if (!id.startsWith("platform-game-")) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [has, bundle.games]);

  if (!has) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-[var(--bg-surface)]/40 via-[var(--bg-surface)]/20 to-violet-950/20 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden
        />
        <p className="text-3xl" aria-hidden>
          ✨
        </p>
        <p className="mt-3 text-base font-medium text-[var(--text-primary)]">Geen actieve events</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
          Zodra er een platformbericht, game of quest loopt, verschijnt die hier automatisch. Je ziet banners ook op het
          dashboard.
        </p>
      </div>
    );
  }

  const q = bundle.quest;
  const questDay = q ? Math.min(q.eventDay, q.maxDay) : 0;
  const questPct = q && q.maxDay > 0 ? Math.min(100, Math.round((questDay / q.maxDay) * 100)) : 0;

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--card-border)]/60 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/90">Overzicht</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Events en platform</h1>
        <p className="mt-1.5 max-w-lg text-sm text-[var(--text-muted)]">
          Quests, aankondigingen en games op één plek — hetzelfde als de banners op je dashboard, maar permanent
          beschikbaar.
        </p>
      </header>

      {q ? (
        <section
          className="relative overflow-hidden rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/45 via-[var(--bg-surface)]/35 to-indigo-950/30 p-5 shadow-[0_16px_48px_rgba(76,29,149,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
          aria-labelledby="profile-quest-heading"
        >
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-fuchsia-500/12 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 text-2xl ring-1 ring-violet-400/35"
                aria-hidden
              >
                🧩
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/90">Platformquest</p>
                <h2 id="profile-quest-heading" className="mt-0.5 text-xl font-semibold text-[var(--text-primary)]">
                  {q.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{q.tagline}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${
                q.completed
                  ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40"
                  : "bg-amber-500/15 text-amber-100 ring-amber-400/35"
              }`}
            >
              {q.completed ? "Voltooid" : "Actief"}
            </span>
          </div>

          <div className="relative mt-4">
            <div className="mb-1 flex justify-between text-[11px] font-medium text-[var(--text-muted)]">
              <span>Voortgang</span>
              <span>
                Dag {questDay}/{q.maxDay}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-black/25 ring-1 ring-violet-500/20"
              role="progressbar"
              aria-valuenow={questDay}
              aria-valuemin={0}
              aria-valuemax={q.maxDay}
              aria-label={`Quest voortgang dag ${questDay} van ${q.maxDay}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500 ease-out"
                style={{ width: `${questPct}%` }}
              />
            </div>
          </div>

          <div className="relative mt-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/12 to-amber-950/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/90">Prijs bij voltooiing</p>
            <p className="mt-1 text-sm font-medium text-amber-50/95">{q.prizeLine}</p>
          </div>

          <p className="relative mt-3 text-xs text-[var(--text-muted)]">
            {formatWhen(q.startsAt)}
            {q.endsAt ? ` → ${formatWhen(q.endsAt)}` : " · geen vaste eindtijd"}
          </p>
          {q.epigraph ? (
            <p className="relative mt-3 border-l-2 border-violet-400/50 pl-3 text-sm italic leading-relaxed text-[var(--text-muted)]">
              {q.epigraph}
            </p>
          ) : null}

          {q.completed && !q.rewardsGranted ? (
            <button
              type="button"
              disabled={questPending}
              onClick={() => {
                startQuestClaimTransition(async () => {
                  const res = await claimQuestCampaignRewards(q.campaignId);
                  if (!res.ok) {
                    neuroToast.error(res.error);
                    return;
                  }
                  if (res.alreadyClaimed) {
                    neuroToast.info("Deze beloning had je al geclaimd.");
                    router.refresh();
                    return;
                  }
                  if (res.levelUp && typeof res.newLevel === "number") {
                    showLevelUpCelebration({ newLevel: res.newLevel });
                  }
                  neuroToast.success(
                    buildQuestClaimCelebrationMessage({
                      pointsApplied: res.pointsApplied,
                      flexPercentBp: res.flexPercentBp,
                      flexAppliedCents: res.flexAppliedCents,
                      flexSkippedReason: res.flexSkippedReason,
                      badgeLabel: res.badgeLabel,
                    }),
                    { duration: 10_000 }
                  );
                  router.refresh();
                });
              }}
              className="relative mt-5 w-full rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 px-4 py-3 text-sm font-bold text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-amber-300/50 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 sm:w-auto sm:min-w-[11rem]"
            >
              {questPending ? "…" : "Beloning claimen"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setQuestOpen(true)}
            className={`relative w-full rounded-xl bg-[rgba(var(--mode-rgb),0.38)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[rgba(var(--mode-rgb),0.4)] transition hover:bg-[rgba(var(--mode-rgb),0.52)] sm:w-auto sm:min-w-[11rem] ${q.completed && !q.rewardsGranted ? "mt-3" : "mt-5"}`}
          >
            {q.completed ? "Quest bekijken" : "Quest openen"}
          </button>

          {q.answerHistory.length > 0 ? (
            <details className="relative mt-4 rounded-xl border border-violet-500/25 bg-violet-950/20 px-4 py-3 open:bg-violet-950/30">
              <summary className="cursor-pointer select-none text-sm font-medium text-violet-100/95">
                Jouw eerdere vragen en antwoorden ({q.answerHistory.length})
              </summary>
              <p className="mt-2 text-[11px] leading-snug text-[var(--text-muted)]">
                Per poging: de vraag (of hint) zoals die toen gold, en wat je invulde.
              </p>
              <QuestAnswerHistoryList rows={q.answerHistory} listClassName="max-h-[min(24rem,55vh)]" />
            </details>
          ) : null}
          <QuestCampaignModal open={questOpen} onClose={() => setQuestOpen(false)} />
        </section>
      ) : null}

      {bundle.events.length > 0 ? (
        <section aria-labelledby="profile-events-heading">
          <SectionHeading id="profile-events-heading" icon="📣" kicker="Aankondigingen" label="Platformberichten" />
          <ul className="space-y-3">
            {bundle.events.map((ev) => (
              <li
                key={ev.id}
                className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/35 via-[var(--bg-surface)]/25 to-slate-950/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-sm ring-1 ring-cyan-400/30"
                    aria-hidden
                  >
                    📣
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cyan-100/95">{ev.title}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)]">{ev.body}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                      <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-cyan-200/80">
                        {formatWhen(ev.starts_at)}
                      </span>
                      {ev.ends_at ? (
                        <>
                          <span aria-hidden>—</span>
                          <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-cyan-200/80">
                            {formatWhen(ev.ends_at)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bundle.upcomingEvents.length > 0 ? (
        <section aria-labelledby="profile-upcoming-events-heading">
          <SectionHeading
            id="profile-upcoming-events-heading"
            icon="🗓️"
            kicker="Planning"
            label="Upcoming events"
          />
          <ul className="space-y-3">
            {bundle.upcomingEvents.map((ev) => (
              <li
                key={`upcoming-${ev.id}`}
                className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/35 via-[var(--bg-surface)]/25 to-violet-950/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-400/10 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-sm ring-1 ring-indigo-400/30"
                    aria-hidden
                  >
                    🗓️
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-indigo-100/95">{ev.title}</p>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-300/85">
                      Story preview
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{ev.storyPreview}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                      <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-indigo-200/80">
                        Start: {formatWhen(ev.starts_at)}
                      </span>
                      {ev.ends_at ? (
                        <>
                          <span aria-hidden>—</span>
                          <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-indigo-200/80">
                            Einde: {formatWhen(ev.ends_at)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bundle.games.length > 0 ? (
        <section id="platform-games" aria-labelledby="profile-games-heading">
          <SectionHeading id="profile-games-heading" icon="🎮" kicker="Challenges" label="Platform-games" />
          <ul className="space-y-4">
            {bundle.games.map((g) => {
              const summary = getPlatformGameStatusSummary(g);
              const badgeClass = platformGameStatusBadgeClass(summary.tone);
              return (
                <li
                  id={`platform-game-${g.id}`}
                  key={g.id}
                  className="scroll-mt-24"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-[var(--bg-surface)]/30 to-indigo-950/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div
                      className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-violet-500/12 blur-3xl"
                      aria-hidden
                    />
                    <div className="relative flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-lg ring-1 ring-violet-400/30"
                          aria-hidden
                        >
                          🎮
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/85">
                            Platform-game
                          </p>
                          <p className="font-semibold text-[var(--text-primary)]">{g.title}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${badgeClass}`}>
                        {summary.label}
                      </span>
                    </div>
                    <p className="relative mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)]">
                      {g.body}
                    </p>
                    <div className="relative mt-3 rounded-xl border border-violet-400/20 bg-black/20 p-2">
                      <PlatformGameProgressPanel game={g} domIdPrefix="pg-profile" />
                    </div>
                    <p className="relative mt-3 text-[11px] text-[var(--text-muted)]">
                      <span className="font-mono text-[10px] text-violet-200/70">{formatWhen(g.starts_at)}</span>
                      {g.ends_at ? (
                        <>
                          <span className="mx-1.5 text-[var(--text-muted)]">—</span>
                          <span className="font-mono text-[10px] text-violet-200/70">{formatWhen(g.ends_at)}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
