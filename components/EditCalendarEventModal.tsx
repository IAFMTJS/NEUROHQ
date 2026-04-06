"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { Modal } from "@/components/Modal";
import { updateManualEvent } from "@/app/actions/calendar";

type EventRow = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  linked_task_id?: string | null;
};

export function EditCalendarEventModal({
  event,
  open,
  onClose,
}: {
  event: EventRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isSocial, setIsSocial] = useState(false);
  const [linkTask, setLinkTask] = useState(false);

  useEffect(() => {
    if (!event || !open) return;
    setTitle(event.title ?? "");
    const s = new Date(event.start_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}T${pad(s.getHours())}:${pad(s.getMinutes())}`;
    setStart(local);
    const e = new Date(event.end_at);
    const localE = `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}T${pad(e.getHours())}:${pad(e.getMinutes())}`;
    setEnd(localE);
    setIsSocial(event.is_social);
    setLinkTask(!!event.linked_task_id);
  }, [event, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!title.trim() || endDate <= startDate) {
      neuroToast.error("Titel invullen en eindtijd na starttijd.");
      return;
    }
    startTransition(async () => {
      try {
        await updateManualEvent({
          id: event.id,
          title: title.trim(),
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          is_social: isSocial,
          link_task: linkTask,
        });
        neuroToast.success("Afspraak bijgewerkt.");
        if (linkTask) {
          neuroToast.info("Taaktitel en vervaldatum zijn mee bijgewerkt met de afspraak.");
        }
        onClose();
        router.refresh();
      } catch (err) {
        neuroToast.error(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <Modal open={open} onClose={() => !pending && onClose()} title="Afspraak bewerken" size="md">
      {event ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Einde</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" checked={isSocial} onChange={(e) => setIsSocial(e.target.checked)} />
            Sociale afspraak
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" checked={linkTask} onChange={(e) => setLinkTask(e.target.checked)} />
            Ook als taak op Missions (titel en verval volgen de afspraak)
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
              {pending ? "Opslaan…" : "Opslaan"}
            </button>
            <button type="button" disabled={pending} onClick={onClose} className="btn-secondary rounded-lg px-4 py-2 text-sm">
              Annuleren
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
