"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { suggestPlayDeckTasks, addPlayDeckTasksForToday, unlockPlayDeckFull } from "@/app/actions/play-deck";
import type { PlayDeckSuggestion } from "@/app/actions/play-deck";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { profileEngineHref } from "@/lib/profile-routes";
import { refreshMergedSnapshotFromNetwork } from "@/lib/daily-bootstrap";
import styles from "./play-deck-modal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  dateStr: string;
};

const KIND_LABEL: Record<string, string> = {
  fun: "Leuk",
  unwind: "Ontspan",
  challenge: "Challenge",
};

const MAX_PICK_GENERATION = 2;
/** Time between each card starting its flip (overlapping flips = dealer-style cadence). */
const REVEAL_STAGGER_MS = 300;

export function PlayDeckModal({ open, onClose, dateStr }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [unlockPending, startUnlock] = useTransition();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlayDeckSuggestion[]>([]);
  const [pickGeneration, setPickGeneration] = useState(0);
  const [revealStep, setRevealStep] = useState(0);
  const [fullDeckUnlocked, setFullDeckUnlocked] = useState(true);
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearRevealTimers = useCallback(() => {
    for (const t of revealTimersRef.current) clearTimeout(t);
    revealTimersRef.current = [];
  }, []);

  const loadSuggestions = useCallback(
    async (generation: number) => {
      setLoading(true);
      clearRevealTimers();
      setRevealStep(0);
      try {
        const { suggestions: s, fullDeckUnlocked: full } = await suggestPlayDeckTasks({
          dateStr,
          pickGeneration: generation,
        });
        setSuggestions(s);
        setFullDeckUnlocked(full);
      } finally {
        setLoading(false);
      }
    },
    [dateStr, clearRevealTimers]
  );

  useEffect(() => {
    if (!open) return;
    setPickGeneration(0);
    void loadSuggestions(0);
  }, [open, loadSuggestions]);

  useEffect(() => {
    if (!open || loading || suggestions.length === 0) {
      if (!loading) setRevealStep(0);
      return;
    }
    clearRevealTimers();
    setRevealStep(0);
    const n = suggestions.length;
    for (let i = 1; i <= n; i++) {
      const t = setTimeout(() => setRevealStep(i), 200 + (i - 1) * REVEAL_STAGGER_MS);
      revealTimersRef.current.push(t);
    }
    return () => clearRevealTimers();
  }, [open, loading, suggestions, pickGeneration, clearRevealTimers]);

  useEffect(() => {
    return () => clearRevealTimers();
  }, [clearRevealTimers]);

  function reshuffle() {
    if (pickGeneration >= MAX_PICK_GENERATION) return;
    const next = pickGeneration + 1;
    setPickGeneration(next);
    void loadSuggestions(next);
  }

  function unlockFullDeck() {
    startUnlock(async () => {
      const r = await unlockPlayDeckFull();
      if (!r.ok) {
        neuroToast.error(r.error);
        return;
      }
      neuroToast.success("Volledig play deck ontgrendeld.");
      setFullDeckUnlocked(true);
      setPickGeneration(0);
      await loadSuggestions(0);
      router.refresh();
    });
  }

  function addAllPicks() {
    const ids = suggestions.map((s) => s.id);
    if (ids.length === 0) {
      neuroToast.message("Geen ideeën om toe te voegen.");
      return;
    }
    startTransition(async () => {
      const r = await addPlayDeckTasksForToday({ dateStr, templateIds: ids });
      if (r.errors.length && r.created === 0) {
        neuroToast.error(r.errors[0] ?? "Kon niet toevoegen.");
        return;
      }
      if (r.errors.length) {
        neuroToast.warning(`${r.created} toegevoegd.`, { description: r.errors.join(" ") });
      } else {
        neuroToast.success(`${r.created} play-missie${r.created === 1 ? "" : "s"} toegevoegd.`);
      }
      void refreshMergedSnapshotFromNetwork();
      router.refresh();
      onClose();
    });
  }

  const reshufflesLeft = MAX_PICK_GENERATION - pickGeneration;
  const revealDone = !loading && suggestions.length > 0 && revealStep >= suggestions.length;

  return (
    <Modal open={open} onClose={onClose} title="Play deck" size="lg">
      <div className="[color-scheme:dark] space-y-4">
        {fullDeckUnlocked ? (
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Het deck kiest drie ideeën voor vandaag — plezier, ontspanning of een lichte challenge. Niet bedoeld als coaching.{" "}
            {reshufflesLeft > 0 ? (
              <>
                Nog <span className="text-[var(--text-secondary)]">{reshufflesLeft}</span> keer opnieuw schudden mogelijk.{" "}
              </>
            ) : (
              <>Geen schuifbeurten meer in dit venster. </>
            )}
            <Link href={profileEngineHref("play")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Play-profiel
            </Link>{" "}
            verfijnt de matches verder.
          </p>
        ) : (
          <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[var(--bg-primary)]/30 p-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">Start simpel — drie ideeën</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
              We trekken drie kaarten uit een compact deck.{" "}
              <span className="text-[var(--text-secondary)]">Wil je betere matches?</span> Voeg iets toe aan je{" "}
              <Link href={profileEngineHref("play")} className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline">
                Play-profiel
              </Link>{" "}
              — dan ontgrendelt automatisch het volledige deck.
              {reshufflesLeft > 0 ? ` Nog ${reshufflesLeft} keer schudden beschikbaar.` : " Geen schuifbeurten meer."}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="h-10 w-10 rounded-full border-2 border-[rgba(var(--mode-rgb),0.35)] border-t-[var(--accent-focus)] animate-spin"
              aria-hidden
            />
            <p className="text-sm text-[var(--text-muted)]">Deck schudden…</p>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Geen ideeën gevonden. Vul je Play-profiel aan of probeer later opnieuw.</p>
        ) : (
          <ul className="space-y-3" aria-live="polite">
            {suggestions.map((s, i) => {
              const shown = revealStep > i;
              return (
                <li key={`${s.id}-${pickGeneration}`}>
                  <div className={styles.scene}>
                    <div className={`${styles.inner} ${shown ? styles.innerRevealed : ""}`}>
                      <div className={`${styles.face} ${styles.back}`} aria-hidden>
                        <div className={styles.backOrnament}>?</div>
                        <span className={styles.backCaption}>Play deck</span>
                      </div>
                      <div
                        className={`${styles.face} ${styles.front} rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/25 p-4 shadow-[0_0_0_1px_rgba(var(--mode-rgb),0.06)]`}
                        aria-hidden={!shown}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb-deep),0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            {KIND_LABEL[s.play_kind] ?? s.play_kind}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">~{4 + s.energy} energie</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{s.title}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!fullDeckUnlocked && !loading && (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-elevated)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-focus)]">Meer ideeën</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Na een korte Play-profiel update zie je automatisch het volledige deck. Of ontgrendel nu alles — zonder profiel zijn matches generieker.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={profileEngineHref("play")}
                className="inline-flex items-center justify-center rounded-lg border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.15)] px-3 py-2 text-xs font-semibold text-[var(--accent-focus)] no-underline hover:bg-[rgba(var(--mode-rgb-deep),0.22)]"
              >
                Play-profiel aanvullen
              </Link>
              <button
                type="button"
                disabled={unlockPending}
                onClick={unlockFullDeck}
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/40 disabled:opacity-50"
              >
                {unlockPending ? "Bezig…" : "Toon volledig deck nu"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[var(--card-border)]/60 pt-4">
          <button
            type="button"
            disabled={loading || reshufflesLeft <= 0 || !revealDone}
            onClick={reshuffle}
            title={reshufflesLeft <= 0 ? "Geen schuifbeurten meer vandaag in dit venster" : undefined}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/40 disabled:opacity-50"
          >
            Opnieuw schudden ({reshufflesLeft} over)
          </button>
          <button
            type="button"
            disabled={pending || !revealDone || suggestions.length === 0}
            onClick={addAllPicks}
            className="rounded-lg border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.2)] px-3 py-2 text-xs font-semibold text-[var(--accent-focus)] disabled:opacity-50"
          >
            {pending ? "Bezig…" : `Alle ${suggestions.length} toevoegen aan vandaag`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Sluiten
          </button>
        </div>
      </div>
    </Modal>
  );
}
