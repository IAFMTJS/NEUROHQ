"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ProfileSpecialEventsBundle } from "@/app/actions/profile-special-events";
import { claimQuestCampaignRewards } from "@/app/actions/quest-campaign";
import { PlatformGameProgressPanel } from "@/components/profile/PlatformGameProgressPanel";
import { QuestCampaignModal } from "@/components/quests/QuestCampaignModal";
import { QuestAnswerHistoryList } from "@/components/quests/QuestAnswerHistoryList";
import { buildQuestLootToastModel } from "@/lib/platform-reward-celebration";
import { getPlatformGameStatusSummary, platformGameStatusBadgeClass } from "@/lib/platform-game-status";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { showQuestLootClaimToast } from "@/lib/ui/platform-loot-toast";
import { showLevelUpCelebration } from "@/lib/ui/level-up-celebration";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function bundleHasContent(b: ProfileSpecialEventsBundle): boolean {
  return (
    b.events.length > 0 ||
    b.upcomingEvents.length > 0 ||
    b.upcomingGames.length > 0 ||
    b.upcomingQuests.length > 0 ||
    b.games.length > 0 ||
    b.quest != null
  );
}

function SectionHeading({
  icon,
  label,
  kicker,
  id,
  count,
}: {
  icon: string;
  label: string;
  kicker?: string;
  id?: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(var(--mode-rgb),0.35)] to-[var(--bg-surface)]/40 text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[rgba(var(--mode-rgb),0.35)]"
        aria-hidden
      >
        {icon}
        <span
          className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.55)]"
          aria-hidden
        />
      </span>
      <div className="min-w-0 flex-1">
        {kicker ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{kicker}</p>
        ) : null}
        <h3 id={id} className="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          <span>{label}</span>
          {typeof count === "number" ? (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-[rgba(var(--mode-rgb),0.22)] px-1.5 text-[10px] font-bold tabular-nums text-[var(--semantic-accent)] ring-1 ring-[rgba(var(--mode-rgb),0.32)]">
              {count}
            </span>
          ) : null}
        </h3>
      </div>
    </div>
  );
}

function EventsBoardHero({
  hasQuest,
  questActive,
  nGames,
  nAnnounce,
  nUpcoming,
}: {
  hasQuest: boolean;
  questActive: boolean;
  nGames: number;
  nAnnounce: number;
  nUpcoming: number;
}) {
  const chips: { href: string; label: string; hint: string }[] = [];
  if (hasQuest) chips.push({ href: "#event-board-quest", label: "Quest", hint: "Missie" });
  if (nAnnounce > 0) chips.push({ href: "#event-board-feed", label: "Feed", hint: "Live" });
  if (nGames > 0) chips.push({ href: "#platform-games", label: "Games", hint: "Challenges" });
  if (nUpcoming > 0) chips.push({ href: "#event-board-soon", label: "Komt eraan", hint: "Planning" });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-[linear-gradient(152deg,rgba(56,24,102,0.58),rgba(6,8,18,0.94))] p-5 shadow-[0_24px_64px_rgba(76,29,149,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.085) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.085) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/85">Mission board</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[1.65rem]">
            Events &amp; platform
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Quests, aankondigingen en platform-games op één bord — dezelfde signalen als op je dashboard, maar hier blijven ze
            staan. Volg je voortgang, claim loot, en zie wat er nog aankomt.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[min(100%,28rem)]">
          <div className="rounded-2xl border border-violet-400/25 bg-black/25 px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-violet-200/75">Quest</p>
            <p className="mt-1 text-sm font-black tracking-[0.12em] text-[var(--text-primary)]">
              {hasQuest ? (questActive ? "LIVE" : "DONE") : "—"}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{hasQuest ? (questActive ? "Actief" : "Loot claimen?") : "Geen missie"}</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/25 bg-black/25 px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/75">Games</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">{nGames}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Live challenges</p>
          </div>
          <div className="rounded-2xl border border-amber-400/25 bg-black/25 px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200/75">Feed</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">{nAnnounce}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Berichten</p>
          </div>
          <div className="rounded-2xl border border-indigo-400/25 bg-black/25 px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-indigo-200/75">Pipeline</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">{nUpcoming}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Gepland</p>
          </div>
        </div>
      </div>

      {chips.length > 0 ? (
        <nav
          className="relative mt-4 flex flex-wrap gap-2 border-t border-white/[0.08] pt-4"
          aria-label="Snel naar sectie"
        >
          {chips.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className="group inline-flex items-center gap-2 rounded-full border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb),0.12)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-[rgba(var(--mode-rgb),0.22)] hover:ring-1 hover:ring-[rgba(var(--mode-rgb),0.4)]"
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] group-hover:text-[var(--semantic-accent)]">
                {c.hint}
              </span>
              {c.label}
            </a>
          ))}
        </nav>
      ) : null}
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
      <div className="relative overflow-hidden rounded-3xl border border-[var(--card-border)] bg-gradient-to-br from-[var(--bg-surface)]/40 via-[var(--bg-surface)]/20 to-violet-950/20 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
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
  const nAnnounce = bundle.events.length;
  const nGames = bundle.games.length;
  const nUpcoming = bundle.upcomingEvents.length + bundle.upcomingGames.length + bundle.upcomingQuests.length;

  return (
    <div className="space-y-10">
      <EventsBoardHero
        hasQuest={Boolean(q)}
        questActive={Boolean(q && !q.completed)}
        nGames={nGames}
        nAnnounce={nAnnounce}
        nUpcoming={nUpcoming}
      />

      {q ? (
        <section
          id="event-board-quest"
          className="scroll-mt-24"
          aria-labelledby="profile-quest-heading"
        >
          <div
            className="relative overflow-hidden rounded-3xl border border-fuchsia-500/35 bg-gradient-to-br from-violet-950/55 via-[var(--bg-surface)]/38 to-indigo-950/35 p-5 shadow-[0_20px_56px_rgba(147,51,234,0.2),inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-fuchsia-500/15"
          >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-fuchsia-500/12 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-fuchsia-200/75">Hoofdquest</p>
            <p className="font-mono text-[10px] text-fuchsia-300/55">Live platform</p>
          </div>
          <div className="relative mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 text-2xl ring-1 ring-violet-400/35"
                aria-hidden
              >
                🧩
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/90">Story missie</p>
                <h2 id="profile-quest-heading" className="mt-0.5 text-xl font-bold tracking-tight text-[var(--text-primary)]">
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
              <span>Quest-voortgang</span>
              <span className="tabular-nums">
                Dag {questDay}/{q.maxDay}
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-black/30 ring-1 ring-violet-500/25"
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

          <div className="relative mt-4 rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 to-amber-950/25 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/90">Loot bij voltooiing</p>
            <p className="mt-1 text-sm font-semibold text-amber-50/95">{q.prizeLine}</p>
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
                  showQuestLootClaimToast(
                    buildQuestLootToastModel({
                      pointsApplied: res.pointsApplied,
                      flexPercentBp: res.flexPercentBp,
                      flexAppliedCents: res.flexAppliedCents,
                      flexSkippedReason: res.flexSkippedReason,
                      badgeLabel: res.badgeLabel,
                    })
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
          </div>
        </section>
      ) : null}

      {bundle.events.length > 0 ? (
        <section id="event-board-feed" className="scroll-mt-24" aria-labelledby="profile-events-heading">
          <SectionHeading
            id="profile-events-heading"
            icon="📣"
            kicker="Live feed"
            label="Platformberichten"
            count={bundle.events.length}
          />
          <ul className="space-y-3">
            {bundle.events.map((ev) => (
              <li
                key={ev.id}
                className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/38 via-[var(--bg-surface)]/25 to-slate-950/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl"
                  aria-hidden
                />
                <p className="relative mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300/65">Uitzending</p>
                <div className="relative flex gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-sm ring-1 ring-cyan-400/30"
                    aria-hidden
                  >
                    📣
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-cyan-100/95">{ev.title}</p>
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

      {nUpcoming > 0 ? (
        <div id="event-board-soon" className="scroll-mt-24 space-y-10" aria-label="Gepland op het platform">
          {bundle.upcomingEvents.length > 0 ? (
            <section aria-labelledby="profile-upcoming-events-heading">
              <SectionHeading
                id="profile-upcoming-events-heading"
                icon="🗓️"
                kicker="Pipeline"
                label="Aankomende aankondigingen"
                count={bundle.upcomingEvents.length}
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
                          Teaser
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

          {bundle.upcomingQuests.length > 0 ? (
            <section aria-labelledby="profile-upcoming-quests-heading">
              <SectionHeading
                id="profile-upcoming-quests-heading"
                icon="🧩"
                kicker="Pipeline"
                label="Aankomende quests"
                count={bundle.upcomingQuests.length}
              />
              <ul className="space-y-3">
                {bundle.upcomingQuests.map((uq) => (
                  <li
                    key={`upcoming-quest-${uq.campaignId}`}
                    className="relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/30 via-[var(--bg-surface)]/25 to-violet-950/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-2xl"
                      aria-hidden
                    />
                    <div className="relative flex gap-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-sm ring-1 ring-fuchsia-400/30"
                        aria-hidden
                      >
                        🧩
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-fuchsia-100/95">{uq.title}</p>
                        <p className="mt-1 text-xs text-violet-200/85">{uq.tagline}</p>
                        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-fuchsia-300/85">
                          Teaser
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{uq.storyPreview}</p>
                        <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/90">
                            Loot bij voltooiing
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-amber-50/95">{uq.prizeLine}</p>
                        </div>
                        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                          <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-fuchsia-200/80">
                            Start: {formatWhen(uq.startsAt)}
                          </span>
                          {uq.endsAt ? (
                            <>
                              <span aria-hidden>—</span>
                              <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-fuchsia-200/80">
                                Einde: {formatWhen(uq.endsAt)}
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

          {bundle.upcomingGames.length > 0 ? (
            <section aria-labelledby="profile-upcoming-games-heading">
              <SectionHeading
                id="profile-upcoming-games-heading"
                icon="🎮"
                kicker="Pipeline"
                label="Aankomende platform-games"
                count={bundle.upcomingGames.length}
              />
              <ul className="space-y-3">
                {bundle.upcomingGames.map((ug) => (
                  <li
                    key={`upcoming-game-${ug.id}`}
                    className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/35 via-[var(--bg-surface)]/25 to-indigo-950/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div
                      className="pointer-events-none absolute -right-10 top-0 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl"
                      aria-hidden
                    />
                    <div className="relative flex gap-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-sm ring-1 ring-violet-400/30"
                        aria-hidden
                      >
                        🎮
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-violet-100/95">{ug.title}</p>
                        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-300/85">
                          Teaser
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{ug.storyPreview}</p>
                        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                          <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-violet-200/80">
                            Start: {formatWhen(ug.starts_at)}
                          </span>
                          {ug.ends_at ? (
                            <>
                              <span aria-hidden>—</span>
                              <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[10px] text-violet-200/80">
                                Einde: {formatWhen(ug.ends_at)}
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
        </div>
      ) : null}

      {bundle.games.length > 0 ? (
        <section id="platform-games" className="scroll-mt-24" aria-labelledby="profile-games-heading">
          <SectionHeading
            id="profile-games-heading"
            icon="🎮"
            kicker="Challenges"
            label="Platform-games"
            count={bundle.games.length}
          />
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
                  <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-violet-950/45 via-[var(--bg-surface)]/32 to-cyan-950/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-cyan-500/10">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-violet-500/12 blur-3xl"
                      aria-hidden
                    />
                    <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-200/75">Side challenge</p>
                      <p className="font-mono text-[10px] text-cyan-300/50">Platform</p>
                    </div>
                    <div className="relative mt-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-lg ring-1 ring-violet-400/30"
                          aria-hidden
                        >
                          🎮
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/85">
                            Live challenge
                          </p>
                          <p className="font-bold text-[var(--text-primary)]">{g.title}</p>
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
