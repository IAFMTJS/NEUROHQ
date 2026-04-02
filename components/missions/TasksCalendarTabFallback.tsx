import { CalendarModal3Trigger } from "@/components/missions";
import { getCalendarGridCells, getCalendarMonthLabelNL } from "@/lib/calendar-month-grid";

type Props = {
  /** From URL / default — drives real month grid while data streams. */
  monthParam: string;
  dateStr: string;
  selectedCalendarDay: string;
  simplifiedContent?: boolean;
};

function deckDayClass(day: {
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}): string {
  const deckBtn =
    "relative flex aspect-square min-h-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums";
  let c = deckBtn;
  if (!day.inCurrentMonth) {
    c +=
      " border-transparent bg-transparent text-[var(--text-muted)]/25";
  } else if (day.isToday) {
    c +=
      " border-[rgba(var(--semantic-accent),0.45)] bg-[var(--semantic-accent)]/12 text-[var(--semantic-accent)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.12)] ring-1 ring-[rgba(var(--semantic-accent),0.25)]";
  } else if (day.isSelected) {
    c +=
      " border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--semantic-accent),0.08)] text-[var(--text-primary)]";
  } else {
    c +=
      " border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] text-[var(--text-secondary)]";
  }
  return c;
}

/**
 * Full command-deck calendar chrome while the calendar tab server component streams.
 * Shows real month label + day grid from URL so layout matches loaded content.
 */
export function TasksCalendarTabFallback({
  monthParam,
  dateStr,
  selectedCalendarDay,
  simplifiedContent = false,
}: Props) {
  const monthLabel = getCalendarMonthLabelNL(monthParam, dateStr) || "…";
  const cells = getCalendarGridCells(monthParam, dateStr, selectedCalendarDay);
  const contentPad = simplifiedContent ? "p-3 space-y-4" : "p-0 space-y-4";

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Kalender laden">
      <section className="overflow-hidden p-0" id="agenda">
        <div className="shrink-0 border-b border-[rgba(var(--mode-rgb),0.1)] px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CalendarModal3Trigger date={dateStr} />
            <p className="max-w-[14rem] text-[10px] leading-relaxed text-[var(--text-muted)]">
              Zelfde tab-strip als Missions; dagdetails laden…
            </p>
          </div>
        </div>

        <div className={contentPad}>
          <div className="card-simple !rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled
                aria-hidden
                className="rounded-full border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-xs text-[var(--text-muted)] opacity-60"
              >
                ←
              </button>
              <p className="text-center text-xs font-semibold capitalize text-[var(--text-primary)]">{monthLabel}</p>
              <button
                type="button"
                disabled
                aria-hidden
                className="rounded-full border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-xs text-[var(--text-muted)] opacity-60"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                <span key={label} className="py-1">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.length > 0
                ? cells.map((day) => {
                    const dayNum = day.dateKey.slice(8, 10);
                    return (
                      <div
                        key={day.dateKey}
                        className={`${deckDayClass(day)} pointer-events-none select-none`}
                        aria-hidden
                      >
                        <span className={day.inCurrentMonth ? "" : "text-[10px]"}>{Number(dayNum)}</span>
                      </div>
                    );
                  })
                : Array.from({ length: 35 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-square min-h-0 animate-pulse rounded-md bg-[rgba(var(--mode-rgb),0.08)]"
                      aria-hidden
                    />
                  ))}
            </div>
          </div>

          <div className="card-simple !rounded-xl p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {(["Vandaag", "Kalender", "Routines", "Te laat"] as const).map((label) => (
                <div
                  key={label}
                  className="h-7 min-w-[4.5rem] animate-pulse rounded-full bg-[rgba(var(--mode-rgb),0.1)] px-3"
                  aria-hidden
                />
              ))}
            </div>
            <div className="h-4 w-48 animate-pulse rounded bg-[rgba(var(--mode-rgb),0.12)]" />
            <div className="mt-3 space-y-2">
              <div className="h-12 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.06)]" />
              <div className="h-12 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.06)]" />
            </div>
          </div>

          <div className="card-simple !rounded-xl p-4">
            <div className="h-4 w-40 animate-pulse rounded bg-[rgba(var(--mode-rgb),0.12)]" />
            <div className="mt-3 h-10 w-full animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.08)]" />
            <div className="mt-2 h-10 max-w-xs animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.06)]" />
          </div>

          <div className="card-simple !rounded-xl p-4">
            <div className="h-4 w-36 animate-pulse rounded bg-[rgba(var(--mode-rgb),0.12)]" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[rgba(var(--mode-rgb),0.06)]" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
