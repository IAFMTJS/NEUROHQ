"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { commitTasksFromUserGoal } from "@/app/actions/user-goal-tasks";
import { buildUserGoalMissionPreview } from "@/lib/user-goal-mission-preview";
import { Modal } from "@/components/Modal";
import { deleteTask } from "@/app/actions/tasks";

const TAG_OPTIONS = ["social", "discipline", "health", "learning", "werk"] as const;
const UNDO_MS = 25_000;

export function UserGoalMissionGeneratorCard() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<{ title: string; due_date: string }[]>([]);
  const [pending, startTransition] = useTransition();

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function openPreview() {
    try {
      const rows = buildUserGoalMissionPreview(text.trim(), tags);
      setPreviewRows(rows.map((r) => ({ title: r.title, due_date: r.due_date })));
      setPreviewOpen(true);
    } catch (e) {
      neuroToast.error(e instanceof Error ? e.message : "Check je invoer.");
    }
  }

  function confirmCreate() {
    startTransition(async () => {
      try {
        const { created, taskIds } = await commitTasksFromUserGoal({
          goal: text.trim(),
          tags,
        });
        setPreviewOpen(false);
        setText("");
        setTags([]);
        neuroToast.success(`${created} taken toegevoegd op je missions.`, {
          duration: UNDO_MS,
          action: {
            label: "Ongedaan maken",
            onClick: () => {
              startTransition(async () => {
                try {
                  for (const id of taskIds) {
                    await deleteTask(id);
                  }
                  neuroToast.message("Taken verwijderd.");
                  router.refresh();
                } catch {
                  neuroToast.error("Ongedaan maken mislukt.");
                }
              });
            },
          },
        });
        router.refresh();
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Mislukt.");
      }
    });
  }

  return (
    <>
      <section className="card-simple space-y-3 border-l-4 border-[var(--semantic-accent)] bg-[var(--bg-elevated)]/30">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Doel → missies (vrij)</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Voor <strong className="text-[var(--text-secondary)]">vrije doelen</strong> (niet uit een vast protocol hierboven).
          Preview van ~20 micro-taken; na bevestiging op Missions. Vaste trajecten: gebruik Protocollen → &quot;Zet week op
          Missions&quot;.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          placeholder="Bv. meer initiatief nemen op het werk…"
        />
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Tags (optioneel)</p>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  tags.includes(t)
                    ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={pending || text.trim().length < 8}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={openPreview}
        >
          Preview taken
        </button>
      </section>

      <Modal open={previewOpen} onClose={() => !pending && setPreviewOpen(false)} title="Preview: taken aanmaken" size="lg">
        <p className="text-xs text-[var(--text-muted)]">
          We leggen <strong>{previewRows.length}</strong> concrete micro-taken aan op je board. Je kunt dit nog annuleren.
        </p>
        <ul className="mt-3 max-h-[min(320px,50dvh)] space-y-1.5 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-3 text-xs text-[var(--text-secondary)]">
          {previewRows.map((r, i) => (
            <li key={i} className="flex justify-between gap-2 border-b border-[var(--card-border)]/50 pb-1.5 last:border-0">
              <span className="min-w-0 flex-1">{r.title}</span>
              <span className="shrink-0 tabular-nums text-[var(--text-muted)]">{r.due_date}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={confirmCreate}
          >
            {pending ? "Bezig…" : `${previewRows.length} taken toevoegen`}
          </button>
          <button type="button" disabled={pending} onClick={() => setPreviewOpen(false)} className="btn-secondary rounded-lg px-4 py-2 text-sm">
            Annuleren
          </button>
        </div>
      </Modal>
    </>
  );
}
