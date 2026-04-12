import type { QuestAnswerHistoryDisplayRow } from "@/lib/quests/answer-history-display";

function formatShortAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type Props = {
  rows: QuestAnswerHistoryDisplayRow[];
  /** Extra classes on the scroll container (default max-h-72). */
  listClassName?: string;
  /** `eventsBoard`: rijkere kaarten voor Profiel → Events; `default`: compact in modal. */
  variant?: "default" | "eventsBoard";
};

export function QuestAnswerHistoryList({
  rows,
  listClassName = "max-h-72",
  variant = "default",
}: Props) {
  if (rows.length === 0) return null;

  const isBoard = variant === "eventsBoard";

  return (
    <ul className={`mt-2 space-y-3 overflow-y-auto pr-1 ${listClassName}`}>
      {rows.map((row, i) => {
        const key = `${row.at}-${row.day}-${row.step ?? "x"}-${i}`;
        if (!isBoard) {
          return (
            <li
              key={key}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 font-semibold leading-snug text-[var(--text-primary)]">
                  Dag {row.day}
                  {row.kind === "multi" && row.step != null ? ` · deel ${row.step + 1}` : ""}
                  <span className="font-normal text-[var(--text-muted)]"> · {row.headline}</span>
                </p>
                <time dateTime={row.at} className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                  {formatShortAt(row.at)}
                </time>
              </div>
              {row.questionPreview && row.questionPreview !== "—" ? (
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-[rgba(var(--mode-rgb),0.25)] pl-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {row.questionPreview}
                </p>
              ) : null}
              <p className="mt-2 leading-snug">
                <span className={row.correct ? "text-emerald-300/95" : "text-rose-200/90"}>
                  {row.correct ? "Jouw antwoord (goed): " : "Jouw antwoord (fout): "}
                </span>
                <span className="break-words font-medium text-[var(--text-primary)]">{row.answer}</span>
              </p>
            </li>
          );
        }

        return (
          <li
            key={key}
            className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-950/50 via-[var(--bg-surface)]/15 to-indigo-950/40 pl-4 pr-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-violet-500/15"
          >
            <span
              className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${
                row.correct
                  ? "bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-700"
                  : "bg-gradient-to-b from-rose-400 via-rose-500 to-red-900"
              }`}
              aria-hidden
            />
            <div className="flex flex-wrap items-start justify-between gap-2 pl-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-violet-500/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-100 ring-1 ring-violet-400/35">
                  Dag {row.day}
                  {row.kind === "multi" && row.step != null ? ` · deel ${row.step + 1}` : ""}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                    row.correct
                      ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40"
                      : "bg-rose-500/20 text-rose-100 ring-rose-400/35"
                  }`}
                >
                  {row.correct ? "Goed" : "Fout"}
                </span>
              </div>
              <time
                dateTime={row.at}
                className="shrink-0 rounded-md bg-black/30 px-2 py-0.5 font-mono text-[10px] text-violet-200/80 ring-1 ring-white/10"
              >
                {formatShortAt(row.at)}
              </time>
            </div>
            <p className="mt-2 pl-1 text-xs font-semibold leading-snug text-[var(--text-primary)]">{row.headline}</p>
            {row.questionPreview && row.questionPreview !== "—" ? (
              <div className="mt-2.5 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 pl-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-violet-300/75">Vraag / hint</p>
                <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {row.questionPreview}
                </p>
              </div>
            ) : null}
            <div className="mt-3 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(var(--mode-rgb),0.08)] px-3 py-2 pl-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Jouw antwoord</p>
              <p className="mt-1 break-words font-mono text-sm font-medium text-[var(--text-primary)]">{row.answer}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
