"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import {
  claimQuestCampaignRewards,
  submitQuestAnswer,
  submitQuestFinaleChoice,
  type QuestClientPayload,
} from "@/app/actions/quest-campaign";
import { buildQuestLootToastModel } from "@/lib/platform-reward-celebration";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { showQuestClearedPendingLootToast, showQuestLootClaimToast } from "@/lib/ui/platform-loot-toast";
import { showLevelUpCelebration } from "@/lib/ui/level-up-celebration";
import { QuestAnswerHistoryList } from "@/components/quests/QuestAnswerHistoryList";

async function fetchQuest(): Promise<QuestClientPayload | null> {
  const res = await fetch("/api/quest-campaign", { credentials: "same-origin" });
  if (!res.ok) return null;
  const json = (await res.json()) as { quest?: QuestClientPayload | null };
  return json.quest ?? null;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatShortAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function QuestCampaignModal({ open, onClose }: Props) {
  const [status, setStatus] = useState<QuestClientPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [paintingLightbox, setPaintingLightbox] = useState<{ src: string; label: string } | null>(null);
  const [finaleOutcomeOpen, setFinaleOutcomeOpen] = useState(true);

  const refresh = useCallback(async () => {
    const q = await fetchQuest();
    setStatus(q);
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) {
      setAnswer("");
      setFeedback(null);
      setFeedbackText(null);
      setPaintingLightbox(null);
      setFinaleOutcomeOpen(true);
    }
  }, [open]);

  const puzzle = status?.puzzle;

  useEffect(() => {
    if (!paintingLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaintingLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paintingLightbox]);

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={status?.title ?? "Quest"}
      subtitle={
        status
          ? status.needsFinaleChoice
            ? `${status.tagline} · Finale keuze`
            : `${status.tagline} · Dag ${Math.min(status.eventDay, status.maxDay)}/${status.maxDay}`
          : undefined
      }
      size="lg"
      cardClassName="quest-platform-modal"
      headerBadge={
        status ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 text-xl ring-1 ring-violet-400/35"
            aria-hidden
          >
            🧩
          </span>
        ) : undefined
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-indigo-400/35 px-3 py-2 text-xs font-semibold text-indigo-100/95 hover:bg-indigo-500/12"
          >
            Sluiten
          </button>
          {puzzle ? (
            <button
              type="button"
              disabled={pending || !answer.trim()}
              onClick={() => {
                if (!status) return;
                setFeedback(null);
                setFeedbackText(null);
                startTransition(async () => {
                  const res = await submitQuestAnswer(status.campaignId, answer);
                  if (!res.ok) {
                    neuroToast.error(res.error);
                    return;
                  }
                  if (!res.correct) {
                    setFeedback("bad");
                    setFeedbackText(res.message);
                    return;
                  }
                  setFeedback("ok");
                  setFeedbackText(
                    [res.unlockMessage, res.unlockWord ? `» ${res.unlockWord}` : null].filter(Boolean).join("\n") ||
                      "Correct."
                  );
                  setAnswer("");
                  await refresh();
                  if (res.completed && !res.awaitingFinaleChoice) {
                    showQuestClearedPendingLootToast();
                  } else if (res.awaitingFinaleChoice) {
                    showQuestClearedPendingLootToast({ awaitingFinaleChoice: true });
                  }
                });
              }}
              className="rounded-xl bg-[rgba(var(--mode-rgb),0.38)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[rgba(var(--mode-rgb),0.4)] transition hover:bg-[rgba(var(--mode-rgb),0.52)] disabled:opacity-50"
            >
              {pending ? "…" : "Controleer"}
            </button>
          ) : null}
        </div>
      }
    >
      {!status ? (
        <p className="text-sm text-[var(--text-muted)]">Laden…</p>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/35 bg-gradient-to-br from-violet-950/55 via-[var(--bg-surface)]/38 to-indigo-950/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-fuchsia-500/15 sm:p-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 top-1/3 h-48 w-48 -translate-y-1/2 rounded-full bg-fuchsia-500/12 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
          {!status.completed && status.maxDay > 0 ? (
            <div>
              <div className="mb-1 flex justify-between text-[11px] font-medium text-[var(--text-muted)]">
                <span>Quest-voortgang</span>
                <span className="tabular-nums">
                  {status.needsFinaleChoice
                    ? `Dag ${status.maxDay}/${status.maxDay} · finale`
                    : `Dag ${Math.min(status.eventDay, status.maxDay)}/${status.maxDay}`}
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-black/30 ring-1 ring-violet-500/25"
                role="progressbar"
                aria-valuenow={
                  status.needsFinaleChoice
                    ? status.maxDay
                    : Math.min(status.eventDay, status.maxDay)
                }
                aria-valuemin={0}
                aria-valuemax={status.maxDay}
                aria-label={
                  status.needsFinaleChoice
                    ? "Alle puzzels voltooid, finale keuze open"
                    : `Dag ${Math.min(status.eventDay, status.maxDay)} van ${status.maxDay}`
                }
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500 ease-out"
                  style={{
                    width: `${status.needsFinaleChoice ? 100 : Math.min(100, Math.round((Math.min(status.eventDay, status.maxDay) / status.maxDay) * 100))}%`,
                  }}
                />
              </div>
              {status.needsFinaleChoice ? (
                <p className="mt-2 text-xs leading-snug text-fuchsia-200/90">
                  Kies <span className="font-semibold text-rose-200">HELPEN</span> of{" "}
                  <span className="font-semibold text-sky-200">STOPPEN</span> om het verhaal (gevolgen + slot) te zien; daarna
                  flex/badge claimen.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 to-amber-950/25 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/90">Loot bij voltooiing</p>
            <p className="mt-1 text-sm font-semibold text-amber-50/95">{status.prizeLine}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {formatWhen(status.startsAt)}
            {status.endsAt ? ` → ${formatWhen(status.endsAt)}` : " · geen vaste eindtijd"}
          </p>
          {status.epigraph ? (
            <p className="border-l-2 border-violet-400/50 pl-3 text-sm italic leading-relaxed text-[var(--text-muted)]">
              {status.epigraph}
            </p>
          ) : null}

          {status.finaleOutcomeText ? (
            <details
              className="group rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 px-4 py-3 open:bg-fuchsia-950/28"
              open={finaleOutcomeOpen}
              onToggle={(e) => setFinaleOutcomeOpen(e.currentTarget.open)}
            >
              <summary className="cursor-pointer select-none text-sm font-semibold text-fuchsia-100/95">
                Gevolgen van je keuze (volledige tekst)
              </summary>
              <pre className="mt-3 max-h-[min(28rem,52vh)] overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--text-primary)]/95">
                {status.finaleOutcomeText}
              </pre>
            </details>
          ) : null}

          {status.needsFinaleChoice ? (
            <div className="space-y-4 rounded-xl border border-rose-500/35 bg-gradient-to-br from-rose-950/35 to-[var(--bg-surface)]/25 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-200/90">Finale beslissing</p>
              <pre className="max-h-[min(20rem,40vh)] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                {status.finaleChoiceIntro ?? ""}
              </pre>
              <p className="text-xs text-[var(--text-muted)]">
                Je ziet hier geen XP-bedrag — de wereld reageert op wat je kiest.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!status) return;
                    startTransition(async () => {
                      const res = await submitQuestFinaleChoice(status.campaignId, "help");
                      if (!res.ok) {
                        neuroToast.error(res.error);
                        return;
                      }
                      if (res.already) {
                        await refresh();
                        return;
                      }
                      if (res.levelUp && typeof res.newLevel === "number") {
                        showLevelUpCelebration({ newLevel: res.newLevel });
                      }
                      await refresh();
                      showQuestClearedPendingLootToast({ afterFinaleChoice: true });
                    });
                  }}
                  className="flex-1 rounded-xl border border-rose-500/50 bg-rose-600/25 px-4 py-3 text-sm font-bold text-rose-50 ring-1 ring-rose-400/35 hover:bg-rose-600/40 disabled:opacity-50"
                >
                  {status.finaleHelpLabel ?? "HELPEN"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!status) return;
                    startTransition(async () => {
                      const res = await submitQuestFinaleChoice(status.campaignId, "stop");
                      if (!res.ok) {
                        neuroToast.error(res.error);
                        return;
                      }
                      if (res.already) {
                        await refresh();
                        return;
                      }
                      if (res.levelUp && typeof res.newLevel === "number") {
                        showLevelUpCelebration({ newLevel: res.newLevel });
                      }
                      await refresh();
                      showQuestClearedPendingLootToast({ afterFinaleChoice: true });
                    });
                  }}
                  className="flex-1 rounded-xl border border-sky-500/45 bg-sky-600/20 px-4 py-3 text-sm font-bold text-sky-50 ring-1 ring-sky-400/30 hover:bg-sky-600/35 disabled:opacity-50"
                >
                  {status.finaleStopLabel ?? "STOPPEN"}
                </button>
              </div>
            </div>
          ) : null}

          {status.completed ? (
            <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 to-emerald-950/20 p-4 text-sm text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="font-semibold">Je hebt de reis voltooid.</p>
              {status.rewardsGranted ? (
                <p className="mt-2 text-xs text-emerald-200/90">
                  Beloning geclaimd — badge: {status.badgeLabel}.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-xs text-emerald-200/90">
                    {status.finaleOutcomeText
                      ? "Tik op onderstaande knop voor flexbonus (indien actief) en badge. Story-XP kreeg je al bij je finale-keuze."
                      : "Tik op onderstaande knop om je XP, flexbudget (indien actief) en badge te ontvangen."}
                  </p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const res = await claimQuestCampaignRewards(status.campaignId);
                        if (!res.ok) {
                          neuroToast.error(res.error);
                          return;
                        }
                        if (res.alreadyClaimed) {
                          neuroToast.info("Deze beloning had je al geclaimd.");
                          await refresh();
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
                            storyXpFromFinaleChoice: res.storyXpFromFinaleChoice,
                          })
                        );
                        await refresh();
                      });
                    }}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 px-4 py-3 text-sm font-bold text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-amber-300/50 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 sm:w-auto"
                  >
                    {pending ? "…" : "Beloning claimen"}
                  </button>
                </>
              )}
            </div>
          ) : null}

          {!status.completed && !status.needsFinaleChoice && !puzzle ? (
            <div className="rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-950/35 to-[var(--bg-surface)]/20 p-4 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-violet-500/15">
              <p>Je bent bij voor vandaag. Kom morgen terug voor de volgende dag.</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Opgeloste dagen: {status.solvedDays.length > 0 ? status.solvedDays.join(", ") : "—"}
              </p>
            </div>
          ) : null}

          {puzzle ? (
            <>
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-violet-500/15">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/90">{puzzle.headline}</p>
                {puzzle.kind === "multi" && puzzle.stepTotal != null ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Deel {(puzzle.stepIndex ?? 0) + 1} van {puzzle.stepTotal}
                  </p>
                ) : null}
              </div>

              {puzzle.kind === "paintings" && puzzle.paintings?.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {puzzle.paintings.map((p, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-950/80 to-slate-900/90 shadow-inner"
                    >
                      {p.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPaintingLightbox({ src: p.imageUrl!, label: p.title })}
                          className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-violet-500/20 outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-inset"
                          aria-label={`${p.title} — vergroten om details te zoeken`}
                        >
                          {p.imageUrl.startsWith("/") ? (
                            <Image
                              src={p.imageUrl}
                              alt=""
                              fill
                              className="object-cover object-center"
                              sizes="(max-width: 640px) 50vw, 22vw"
                            />
                          ) : (
                            // Remote / CDN — geen next.config nodig
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover object-center"
                              loading="lazy"
                            />
                          )}
                        </button>
                      ) : (
                        <div
                          className="pointer-events-none relative aspect-[4/3] w-full shrink-0 border-b border-violet-500/15 bg-black/25"
                          style={{
                            backgroundImage: `radial-gradient(circle at ${30 + (i * 17) % 40}% ${40 + (i * 11) % 30}%, rgba(167,139,250,0.28), transparent 55%)`,
                          }}
                          aria-hidden
                        />
                      )}
                      <div className="relative p-3">
                        <div
                          className="pointer-events-none absolute inset-0 opacity-90"
                          style={{
                            backgroundImage: `radial-gradient(circle at ${30 + (i * 17) % 40}% ${40 + (i * 11) % 30}%, rgba(167,139,250,0.2), transparent 55%)`,
                          }}
                        />
                        <p className="relative text-xs font-semibold text-violet-100/95">{p.title}</p>
                        {p.caption ? <p className="relative mt-1 text-[10px] text-white/50">{p.caption}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {puzzle.intro ? <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{puzzle.intro}</p> : null}
              {puzzle.storyLine ? (
                <p className="text-xs italic text-[var(--text-muted)] whitespace-pre-wrap">{puzzle.storyLine}</p>
              ) : null}
              {puzzle.riddle ? (
                <p className="rounded-xl border border-indigo-400/25 bg-black/30 p-3 text-sm text-[var(--text-primary)] whitespace-pre-wrap shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-indigo-500/10">
                  {puzzle.riddle}
                </p>
              ) : null}

              {(status.recentAttempts?.length ?? 0) > 0 ? (
                <div className="rounded-xl border border-indigo-400/28 bg-gradient-to-br from-indigo-950/40 to-violet-950/20 px-3 py-2.5 ring-1 ring-indigo-500/15">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-200/85">
                    Jouw eerdere antwoorden (deze stap)
                  </p>
                  <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto text-xs">
                    {(status.recentAttempts ?? []).map((a, i) => (
                      <li
                        key={`${a.at}-${i}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.06] pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className={a.correct ? "text-emerald-300/95" : "text-rose-200/90"}>
                          {a.correct ? "Goed: " : "Fout: "}
                          <span className="font-medium text-[var(--text-primary)]">{a.answer}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">{formatShortAt(a.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <label className="block text-xs font-medium text-[var(--text-muted)]" htmlFor="quest-answer">
                {puzzle.kind === "coords" ? "Coördinaten (breedtegraad, lengtegraad)" : "Jouw antwoord"}
              </label>
              <input
                id="quest-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-indigo-400/30 bg-black/25 px-3 py-2 text-sm text-[var(--text-primary)] outline-none ring-1 ring-violet-500/10 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/35"
                placeholder={puzzle.kind === "coords" ? "bijv. 34.865736, 135.491608" : "Typ je antwoord"}
              />

              {feedback === "bad" && feedbackText ? (
                <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">
                  {feedbackText}
                </p>
              ) : null}
              {feedback === "ok" && feedbackText ? (
                <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {feedbackText}
                </p>
              ) : null}
            </>
          ) : null}
          {status.answerHistory.length > 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-indigo-400/35 bg-gradient-to-br from-indigo-950/45 via-violet-950/30 to-[var(--bg-surface)]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-indigo-500/20">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-16 top-0 h-32 w-32 rounded-full bg-indigo-500/15 blur-2xl"
                aria-hidden
              />
              <div className="relative flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/35 to-violet-900/50 text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-indigo-400/40"
                  aria-hidden
                >
                  📋
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200/85">Quest-log</p>
                  <p className="mt-0.5 text-sm font-bold tracking-tight text-[var(--text-primary)]">
                    Jouw vragen en antwoorden
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    Alle dagen · nieuwste bovenaan · zelfde als op profiel → Events
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-500/25 px-2.5 py-1 text-xs font-black tabular-nums text-indigo-50 ring-1 ring-indigo-400/40">
                  {status.answerHistory.length}
                </span>
              </div>
              <div className="relative bg-black/15 px-4 pb-4 pt-3">
                <QuestAnswerHistoryList
                  variant="eventsBoard"
                  rows={status.answerHistory}
                  listClassName="max-h-[min(22rem,50vh)]"
                />
              </div>
            </div>
          ) : null}
          </div>
        </div>
      )}
    </Modal>
    {paintingLightbox ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${paintingLightbox.label} — vergroot`}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-[2px]"
        onClick={() => setPaintingLightbox(null)}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-[1] rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70"
          onClick={(e) => {
            e.stopPropagation();
            setPaintingLightbox(null);
          }}
        >
          Sluiten
        </button>
        <div className="max-h-[min(90dvh,920px)] max-w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
          {/* Lightbox: altijd native img (ook voor /paths) zodat vergroten zonder extra config werkt */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={paintingLightbox.src}
            alt={paintingLightbox.label}
            className="mx-auto max-h-[min(86dvh,880px)] w-auto max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      </div>
    ) : null}
    </>
  );
}
