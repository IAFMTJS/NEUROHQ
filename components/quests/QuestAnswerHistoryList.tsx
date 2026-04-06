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
};

export function QuestAnswerHistoryList({ rows, listClassName = "max-h-72" }: Props) {
  if (rows.length === 0) return null;

  return (
    <ul className={`mt-2 space-y-3 overflow-y-auto pr-1 ${listClassName}`}>
      {rows.map((row, i) => (
        <li
          key={`${row.at}-${row.day}-${row.step ?? "x"}-${i}`}
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
      ))}
    </ul>
  );
}
