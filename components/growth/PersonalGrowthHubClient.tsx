"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { Modal } from "@/components/Modal";
import { deleteTask } from "@/app/actions/tasks";
import { commitTasksFromPersonalGrowth } from "@/app/actions/user-goal-tasks";
import {
  buildPersonalGrowthMissionPreview,
  getPersonalGrowthAreaPresets,
  type PersonalGrowthIntensity,
} from "@/lib/user-goal-mission-preview";
import { setPersonalGrowthFocus, type PersonalGrowthFocusState, type PersonalGrowthWeekStats } from "@/app/actions/personal-growth";

const UNDO_MS = 25_000;
const TAG_OPTIONS = ["discipline", "confidence", "stress", "social", "health", "career"] as const;

type Props = {
  initialFocus: PersonalGrowthFocusState;
  weekStats: PersonalGrowthWeekStats;
};

function intensityLabel(intensity: PersonalGrowthIntensity): string {
  if (intensity === "light") return "Light";
  if (intensity === "intense") return "Intense";
  return "Normal";
}

export function PersonalGrowthHubClient({ initialFocus, weekStats }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const presets = useMemo(() => getPersonalGrowthAreaPresets(), []);

  const [areaMode, setAreaMode] = useState<"preset" | "custom">("preset");
  const [presetArea, setPresetArea] = useState<string>(initialFocus.area ?? presets[0] ?? "Discipline");
  const [customArea, setCustomArea] = useState<string>("");

  const [goal, setGoal] = useState<string>(initialFocus.goal ?? "");
  const [tags, setTags] = useState<string[]>(initialFocus.tags ?? []);
  const [intensity, setIntensity] = useState<PersonalGrowthIntensity>(initialFocus.intensity ?? "normal");
  const [horizonDays, setHorizonDays] = useState<number>(initialFocus.horizonDays ?? 14);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<{ title: string; due_date: string }[]>([]);

  const effectiveArea = (areaMode === "custom" ? customArea.trim() : presetArea.trim()) || null;

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function saveFocus() {
    startTransition(async () => {
      try {
        await setPersonalGrowthFocus({
          area: effectiveArea,
          goal: goal.trim() || null,
          tags,
          intensity,
          horizonDays,
        });
        neuroToast.success("Personal Growth focus opgeslagen.");
        router.refresh();
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  function openPreview() {
    try {
      const rows = buildPersonalGrowthMissionPreview({
        area: effectiveArea,
        goal: goal.trim(),
        tags,
        intensity,
        horizonDays,
      });
      setPreviewRows(rows.map((r) => ({ title: r.title, due_date: r.due_date })));
      setPreviewOpen(true);
    } catch (e) {
      neuroToast.error(e instanceof Error ? e.message : "Check je invoer.");
    }
  }

  function confirmCreate() {
    startTransition(async () => {
      try {
        const { created, taskIds } = await commitTasksFromPersonalGrowth({
          area: effectiveArea,
          goal: goal.trim(),
          tags,
          intensity,
          horizonDays,
        });
        setPreviewOpen(false);
        neuroToast.success(`${created} personal growth taken toegevoegd op je Missions.`, {
          duration: UNDO_MS,
          action: {
            label: "Ongedaan maken",
            onClick: () => {
              startTransition(async () => {
                try {
                  for (const id of taskIds) await deleteTask(id);
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
        neuroToast.error(e instanceof Error ? e.message : "Aanmaken mislukt.");
      }
    });
  }

  const goalValid = goal.trim().length >= 8;

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="card-simple space-y-3 border-l-4 border-[var(--semantic-accent)] bg-[var(--bg-elevated)]/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Personal growth</p>
            <h1 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Kies focus en beïnvloed je week</h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Week {weekStats.weekStart} → {weekStats.weekEnd} · {weekStats.done}/{weekStats.total} done · {weekStats.open} open
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={saveFocus}
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "Opslaan…" : "Focus opslaan"}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Growth area</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAreaMode("preset")}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  areaMode === "preset"
                    ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                }`}
              >
                Preset
              </button>
              <button
                type="button"
                onClick={() => setAreaMode("custom")}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  areaMode === "custom"
                    ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                }`}
              >
                Custom
              </button>
            </div>
            {areaMode === "preset" ? (
              <select
                disabled={pending}
                value={presetArea}
                onChange={(e) => setPresetArea(e.target.value)}
                className="mt-3 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] [color-scheme:dark] focus:border-[var(--accent-focus)]/60 focus:outline-none"
              >
                {presets.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled={pending}
                value={customArea}
                onChange={(e) => setCustomArea(e.target.value)}
                className="mt-3 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                placeholder="Bv. Assertiviteit, Emotionele regulatie…"
              />
            )}
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Focus goal</p>
            <textarea
              disabled={pending}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              placeholder="Bv. meer initiatief nemen op het werk…"
            />
            <div className="mt-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Tags</p>
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
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Influence · intensity</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["light", "normal", "intense"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={pending}
                  onClick={() => setIntensity(id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    intensity === id
                      ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                      : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                  }`}
                >
                  {intensityLabel(id)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Light = minder taken · Intense = meer density.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Influence · horizon</p>
            <select
              disabled={pending}
              value={String(horizonDays)}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] [color-scheme:dark] focus:border-[var(--accent-focus)]/60 focus:outline-none"
            >
              {[7, 14, 21, 28].map((d) => (
                <option key={d} value={String(d)}>
                  {d} dagen
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Spreiding van je personal growth taken.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !goalValid}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={openPreview}
          >
            Preview taken
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={() => {
              setGoal("");
              setTags([]);
              setCustomArea("");
              neuroToast.message("Reset.");
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <Modal
        open={previewOpen}
        onClose={() => !pending && setPreviewOpen(false)}
        title="Preview: personal growth taken"
        size="lg"
      >
        <p className="text-xs text-[var(--text-muted)]">
          We leggen <strong>{previewRows.length}</strong> concrete taken aan op je Missions, verspreid over {horizonDays} dagen.
        </p>
        <ul className="mt-3 max-h-[min(360px,55dvh)] space-y-1.5 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-3 text-xs text-[var(--text-secondary)]">
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
          <button
            type="button"
            disabled={pending}
            onClick={() => setPreviewOpen(false)}
            className="btn-secondary rounded-lg px-4 py-2 text-sm"
          >
            Annuleren
          </button>
        </div>
      </Modal>
    </div>
  );
}

