"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { suggestPlayDeckTasks, addPlayDeckTasksForToday } from "@/app/actions/play-deck";
import type { PlayDeckSuggestion } from "@/app/actions/play-deck";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { profileEngineHref } from "@/lib/profile-routes";
import { refreshMergedSnapshotFromNetwork } from "@/lib/daily-bootstrap";

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

export function PlayDeckModal({ open, onClose, dateStr }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlayDeckSuggestion[]>([]);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setCursor(0);
    setSelected(new Set());
    setLoading(true);
    void (async () => {
      try {
        const { suggestions: s } = await suggestPlayDeckTasks({ dateStr, cursor: 0, limit: 8 });
        setSuggestions(s);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, dateStr]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function loadMore() {
    const next = cursor + 8;
    setLoading(true);
    void (async () => {
      try {
        const { suggestions: s } = await suggestPlayDeckTasks({ dateStr, cursor: next, limit: 8 });
        setSuggestions(s);
        setCursor(next);
        setSelected(new Set());
      } finally {
        setLoading(false);
      }
    })();
  }

  function addSelected() {
    const ids = [...selected];
    if (ids.length === 0) {
      neuroToast.message("Kies minstens één idee.");
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

  return (
    <Modal open={open} onClose={onClose} title="Play deck" size="lg">
      <div className="[color-scheme:dark] space-y-4">
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Optionele ideeën voor plezier, ontspanning of een lichte challenge — niet bedoeld als coaching. Vink wat je wilt en voeg toe aan vandaag.{" "}
          <Link href={profileEngineHref("play")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
            Play-profiel invullen
          </Link>{" "}
          geeft betere matches (mag groot en uitgebreid).
        </p>

        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Ideeën laden…</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Geen ideeën gevonden. Probeer Play-profiel aan te vullen of Meer ideeën.</p>
        ) : (
          <ul className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
            {suggestions.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/25 p-3 transition hover:bg-[var(--bg-primary)]/40">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--card-border)] accent-[var(--semantic-accent)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb-deep),0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                        {KIND_LABEL[s.play_kind] ?? s.play_kind}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        ~{4 + s.energy} energie
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-[var(--text-primary)]">{s.title}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[var(--card-border)]/60 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={loadMore}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/40 disabled:opacity-50"
          >
            Meer ideeën
          </button>
          <button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={addSelected}
            className="rounded-lg border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.2)] px-3 py-2 text-xs font-semibold text-[var(--accent-focus)] disabled:opacity-50"
          >
            {pending ? "Bezig…" : `Toevoegen aan vandaag (${selected.size})`}
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
