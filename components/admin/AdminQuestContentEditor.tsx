"use client";

import { useMemo, useState } from "react";
import type { QuestCampaignContent, QuestDayDef, QuestDayKind } from "@/lib/quests/types";
import {
  acceptsFromTextarea,
  acceptsToTextarea,
  createEmptyDay,
  nextDayNumber,
} from "@/lib/quests/admin-quest-editor-utils";

const field =
  "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:ring-2 focus:ring-amber-500/50";
const label = "mb-1 block text-xs font-medium text-white/50";
const hint = "mt-1 text-[10px] text-white/35";
const card = "rounded-xl border border-white/10 bg-black/25 p-4";
const btnSecondary =
  "rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10";
const btnDanger = "rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/15";

const KIND_OPTIONS: { value: QuestDayKind; label: string; description: string }[] = [
  { value: "paintings", label: "Schilderijen", description: "Letters in beelden; één woord als antwoord." },
  { value: "riddle", label: "Raadsel", description: "Vrije tekstvraag met geaccepteerde antwoorden." },
  { value: "multi", label: "Meerdere stappen", description: "Eerst deel A, daarna deel B (zelfde dag)." },
  { value: "coords", label: "Coördinaten", description: "Finale: breedte- en lengtegraad met tolerantie." },
];

type Props = {
  content: QuestCampaignContent;
  onChange: (next: QuestCampaignContent) => void;
};

function DayCard({
  day,
  index,
  total,
  onPatch,
  onReplace,
  onRemove,
  onMove,
  onChangeKind,
}: {
  day: QuestDayDef;
  index: number;
  total: number;
  onPatch: (p: Partial<QuestDayDef>) => void;
  onReplace: (d: QuestDayDef) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onChangeKind: (kind: QuestDayKind) => void;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={`${card} scroll-mt-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-bold text-amber-100">
            {day.day}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{day.headline || `Dag ${day.day}`}</span>
            <span className="text-[10px] text-white/45">{KIND_OPTIONS.find((k) => k.value === day.kind)?.label ?? day.kind}</span>
          </span>
          <span className="text-white/40">{open ? "▼" : "▶"}</span>
        </button>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className={btnSecondary} disabled={index === 0} onClick={() => onMove(-1)} title="Omhoog">
            ↑
          </button>
          <button type="button" className={btnSecondary} disabled={index >= total - 1} onClick={() => onMove(1)} title="Omlaag">
            ↓
          </button>
          <button type="button" className={btnDanger} onClick={() => confirm("Deze dag verwijderen?") && onRemove()}>
            Verwijderen
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Dagnummer</label>
              <input
                type="number"
                min={1}
                max={99}
                className={field}
                value={day.day}
                onChange={(e) => onPatch({ day: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
              />
            </div>
            <div>
              <label className={label}>Type dag</label>
              <select
                className={field}
                value={day.kind}
                onChange={(e) => onChangeKind(e.target.value as QuestDayKind)}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className={hint}>{KIND_OPTIONS.find((k) => k.value === day.kind)?.description}</p>
            </div>
          </div>
          <div>
            <label className={label}>Koptekst (zichtbaar boven de puzzel)</label>
            <input className={field} value={day.headline} onChange={(e) => onPatch({ headline: e.target.value })} />
          </div>

          {day.kind === "paintings" ? (
            <PaintingsBlock day={day as QuestDayDef & { kind: "paintings" }} onPatch={onPatch} onReplace={onReplace} />
          ) : null}
          {day.kind === "riddle" ? (
            <RiddleBlock day={day as QuestDayDef & { kind: "riddle" }} onPatch={onPatch} />
          ) : null}
          {day.kind === "multi" ? (
            <MultiBlock day={day as QuestDayDef & { kind: "multi" }} onReplace={onReplace} />
          ) : null}
          {day.kind === "coords" ? (
            <CoordsBlock day={day as QuestDayDef & { kind: "coords" }} onPatch={onPatch} />
          ) : null}

          <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
            <div>
              <label className={label}>Bericht na goed antwoord</label>
              <textarea
                className={`${field} min-h-[4rem] resize-y`}
                rows={2}
                value={day.unlockMessage ?? ""}
                onChange={(e) => onPatch({ unlockMessage: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className={label}>Woord / hint op scherm (optioneel)</label>
              <input
                className={field}
                value={day.unlockWord ?? ""}
                onChange={(e) => onPatch({ unlockWord: e.target.value || undefined })}
                placeholder="Bijv. AZIË of coördinaten"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PaintingsBlock({
  day,
  onPatch,
  onReplace,
}: {
  day: QuestDayDef & { kind: "paintings" };
  onPatch: (p: Partial<QuestDayDef>) => void;
  onReplace: (d: QuestDayDef) => void;
}) {
  const paintings = day.paintings ?? [];
  const setPaintings = (next: typeof paintings) => onReplace({ ...day, paintings: next });

  return (
    <div className="space-y-3">
      <div>
        <label className={label}>Intro (boven de schilderijen)</label>
        <textarea className={`${field} min-h-[3rem] resize-y`} rows={2} value={day.intro ?? ""} onChange={(e) => onPatch({ intro: e.target.value || undefined })} />
      </div>
      <div>
        <label className={label}>Verhaallijn (optioneel)</label>
        <textarea className={`${field} min-h-[2.5rem] resize-y`} rows={2} value={day.storyLine ?? ""} onChange={(e) => onPatch({ storyLine: e.target.value || undefined })} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label + " mb-0"}>Schilderijen</span>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => setPaintings([...paintings, { title: "", letter: "", caption: "" }])}
          >
            + Rij
          </button>
        </div>
        <div className="space-y-2">
          {paintings.map((p, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className={label}>Titel</label>
                <input
                  className={field}
                  value={p.title}
                  onChange={(e) => {
                    const next = [...paintings];
                    next[i] = { ...p, title: e.target.value };
                    setPaintings(next);
                  }}
                />
              </div>
              <div className="sm:col-span-1">
                <label className={label}>Letter</label>
                <input
                  className={field}
                  maxLength={4}
                  value={p.letter}
                  onChange={(e) => {
                    const next = [...paintings];
                    next[i] = { ...p, letter: e.target.value };
                    setPaintings(next);
                  }}
                />
              </div>
              <div className="sm:col-span-5">
                <label className={label}>Bijschrift</label>
                <input
                  className={field}
                  value={p.caption ?? ""}
                  onChange={(e) => {
                    const next = [...paintings];
                    next[i] = { ...p, caption: e.target.value || undefined };
                    setPaintings(next);
                  }}
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  className={`${btnDanger} w-full`}
                  disabled={paintings.length <= 1}
                  onClick={() => setPaintings(paintings.filter((_, j) => j !== i))}
                >
                  Verwijder
                </button>
              </div>
              <div className="sm:col-span-12">
                <label className={label}>Afbeelding-URL (optioneel)</label>
                <input
                  className={`${field} font-mono text-xs`}
                  value={p.imageUrl ?? ""}
                  placeholder="/quests/... of https://..."
                  onChange={(e) => {
                    const next = [...paintings];
                    next[i] = { ...p, imageUrl: e.target.value.trim() || undefined };
                    setPaintings(next);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className={label}>Geaccepteerde antwoorden (één per regel, normalisatie: kleine letters, accenten)</label>
        <textarea
          className={`${field} min-h-[5rem] font-mono text-xs`}
          value={acceptsToTextarea(day.accepts)}
          onChange={(e) => onPatch({ accepts: acceptsFromTextarea(e.target.value) })}
          placeholder={"azie\nasia"}
        />
      </div>
    </div>
  );
}

function RiddleBlock({ day, onPatch }: { day: QuestDayDef & { kind: "riddle" }; onPatch: (p: Partial<QuestDayDef>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={label}>Intro (optioneel, boven het raadsel)</label>
        <textarea className={`${field} min-h-[2.5rem] resize-y`} rows={2} value={day.intro ?? ""} onChange={(e) => onPatch({ intro: e.target.value || undefined })} />
      </div>
      <div>
        <label className={label}>Verhaallijn (optioneel, cursief)</label>
        <textarea className={`${field} min-h-[2.5rem] resize-y`} rows={2} value={day.storyLine ?? ""} onChange={(e) => onPatch({ storyLine: e.target.value || undefined })} />
      </div>
      <div>
        <label className={label}>Raadsel / vraag</label>
        <textarea
          className={`${field} min-h-[6rem] resize-y`}
          rows={5}
          value={day.riddle ?? ""}
          onChange={(e) => onPatch({ riddle: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Geaccepteerde antwoorden (één per regel)</label>
        <textarea
          className={`${field} min-h-[5rem] font-mono text-xs`}
          value={acceptsToTextarea(day.accepts)}
          onChange={(e) => onPatch({ accepts: acceptsFromTextarea(e.target.value) })}
        />
      </div>
    </div>
  );
}

function MultiBlock({ day, onReplace }: { day: QuestDayDef & { kind: "multi" }; onReplace: (d: QuestDayDef) => void }) {
  const steps = day.steps ?? [];
  const setSteps = (next: typeof steps) => onReplace({ ...day, steps: next });

  return (
    <div className="space-y-3">
      <div>
        <label className={label}>Intro (boven stap 1)</label>
        <textarea className={`${field} min-h-[2.5rem] resize-y`} rows={2} value={day.intro ?? ""} onChange={(e) => onReplace({ ...day, intro: e.target.value || undefined })} />
      </div>
      <div className="flex items-center justify-between">
        <span className={label + " mb-0"}>Stappen (volgorde = vaste volgorde voor de speler)</span>
        <button type="button" className={btnSecondary} onClick={() => setSteps([...steps, { riddle: "", accepts: [""] }])}>
          + Stap
        </button>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-200/90">Stap {i + 1}</span>
              <button
                type="button"
                className={btnDanger}
                disabled={steps.length <= 1}
                onClick={() => setSteps(steps.filter((_, j) => j !== i))}
              >
                Stap verwijderen
              </button>
            </div>
            <label className={label}>Raadsel</label>
            <textarea
              className={`${field} mb-2 min-h-[4rem] resize-y`}
              rows={3}
              value={step.riddle}
              onChange={(e) => {
                const next = [...steps];
                next[i] = { ...step, riddle: e.target.value };
                setSteps(next);
              }}
            />
            <label className={label}>Antwoorden (één per regel)</label>
            <textarea
              className={`${field} min-h-[4rem] font-mono text-xs`}
              value={acceptsToTextarea(step.accepts)}
              onChange={(e) => {
                const next = [...steps];
                next[i] = { ...step, accepts: acceptsFromTextarea(e.target.value) };
                setSteps(next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CoordsBlock({ day, onPatch }: { day: QuestDayDef & { kind: "coords" }; onPatch: (p: Partial<QuestDayDef>) => void }) {
  const ac = day.acceptCoords ?? { lat: 0, lng: 0, epsilon: 0.01 };
  return (
    <div className="space-y-3">
      <div>
        <label className={label}>Tekst voor de speler</label>
        <textarea className={`${field} min-h-[5rem] resize-y`} rows={4} value={day.riddle ?? ""} onChange={(e) => onPatch({ riddle: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={label}>Breedtegraad (lat)</label>
          <input
            type="number"
            step="any"
            className={field}
            value={Number.isFinite(ac.lat) ? ac.lat : 0}
            onChange={(e) =>
              onPatch({
                acceptCoords: { ...ac, lat: parseFloat(e.target.value) || 0 },
              })
            }
          />
        </div>
        <div>
          <label className={label}>Lengtegraad (lng)</label>
          <input
            type="number"
            step="any"
            className={field}
            value={Number.isFinite(ac.lng) ? ac.lng : 0}
            onChange={(e) =>
              onPatch({
                acceptCoords: { ...ac, lng: parseFloat(e.target.value) || 0 },
              })
            }
          />
        </div>
        <div>
          <label className={label}>Tolerantie (epsilon, in graden)</label>
          <input
            type="number"
            step="any"
            min={0}
            className={field}
            value={Number.isFinite(ac.epsilon) ? ac.epsilon : 0.01}
            onChange={(e) =>
              onPatch({
                acceptCoords: { ...ac, epsilon: Math.max(0, parseFloat(e.target.value) || 0.01) },
              })
            }
          />
          <p className={hint}>Bijv. 0,004 ≈ ±400 m — speler mag kleine afwijking invoeren.</p>
        </div>
      </div>
    </div>
  );
}

export function AdminQuestContentEditor({ content, onChange }: Props) {
  const sortedIndices = useMemo(() => {
    const withIdx = content.days.map((d, i) => ({ d, i }));
    withIdx.sort((a, b) => a.d.day - b.d.day);
    return withIdx.map((x) => x.i);
  }, [content.days]);

  const updateDay = (index: number, patch: Partial<QuestDayDef>) => {
    const days = [...content.days];
    days[index] = { ...days[index], ...patch } as QuestDayDef;
    onChange({ ...content, days });
  };

  const replaceDay = (index: number, day: QuestDayDef) => {
    const days = [...content.days];
    days[index] = day;
    onChange({ ...content, days });
  };

  const removeDay = (index: number) => {
    onChange({ ...content, days: content.days.filter((_, i) => i !== index) });
  };

  const moveDay = (index: number, dir: -1 | 1) => {
    const arr = [...content.days];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    onChange({ ...content, days: arr });
  };

  const changeKind = (index: number, kind: QuestDayKind) => {
    const old = content.days[index];
    const fresh = createEmptyDay(old.day, kind);
    fresh.headline = old.headline;
    fresh.unlockMessage = old.unlockMessage;
    fresh.unlockWord = old.unlockWord;
    replaceDay(index, fresh);
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-amber-400/90">Verhaal (hele quest)</h3>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className={label}>Epigraaf (optioneel, op profiel / modal)</label>
            <textarea
              className={`${field} min-h-[4rem] resize-y`}
              rows={2}
              value={content.storyEpigraph ?? ""}
              onChange={(e) => onChange({ ...content, storyEpigraph: e.target.value.trim() || undefined })}
              placeholder="Korte sfeertekst bovenaan…"
            />
          </div>
          <div className="w-full sm:w-28">
            <label className={label}>Schema-versie</label>
            <input
              type="number"
              min={1}
              className={field}
              value={content.version}
              onChange={(e) => onChange({ ...content, version: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90">Dagen (puzzels)</h3>
          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS.map((k) => (
              <button
                key={k.value}
                type="button"
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/20"
                onClick={() => {
                  const n = nextDayNumber(content.days);
                  onChange({ ...content, days: [...content.days, createEmptyDay(n, k.value)] });
                }}
              >
                + Dag ({k.label})
              </button>
            ))}
          </div>
        </div>

        {content.days.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center text-sm text-white/45">
            Nog geen dagen. Voeg er een toe met de knoppen hierboven.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedIndices.map((origIndex) => (
              <DayCard
                key={`${content.days[origIndex].day}-${origIndex}`}
                day={content.days[origIndex]}
                index={origIndex}
                total={content.days.length}
                onPatch={(p) => updateDay(origIndex, p)}
                onReplace={(d) => replaceDay(origIndex, d)}
                onRemove={() => removeDay(origIndex)}
                onMove={(dir) => moveDay(origIndex, dir)}
                onChangeKind={(kind) => changeKind(origIndex, kind)}
              />
            ))}
          </div>
        )}
        <p className={`mt-3 ${hint}`}>
          Tip: dagnummers bepalen de logica in de app (dag 1, 2, …). Volgorde in deze lijst is alleen voor jouw overzicht — sorteer op nummer met ↑↓ of pas nummers aan.
        </p>
      </div>
    </div>
  );
}
