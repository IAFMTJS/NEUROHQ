import { PolygonHudMeter } from "@/components/visual-lab/VisualLabPolygonMeters";

type Props = {
  weekLabel: string;
  activeProtocolTitle: string;
  weeklyProgressPct: number;
  todayDoneCount: number;
  todayTotalCount: number;
  daysDoneCount: number;
  daysTotalCount: number;
};

export function GrowthCommanderSummaryCard({
  weekLabel,
  activeProtocolTitle,
  weeklyProgressPct,
  todayDoneCount,
  todayTotalCount,
  daysDoneCount,
  daysTotalCount,
}: Props) {
  return (
    <section className="rounded-2xl border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(3,10,20,0.92)_0%,rgba(7,20,38,0.9)_52%,rgba(6,10,22,0.95)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.35)] md:p-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex justify-center md:justify-start">
          <PolygonHudMeter
            variant="hex"
            style="ring"
            label="Week progress"
            value={`${weeklyProgressPct}%`}
            pct={weeklyProgressPct}
          />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">Commander Card</p>
            <h2 className="mt-1 text-lg font-semibold text-white md:text-xl">{activeProtocolTitle}</h2>
            <p className="mt-1 text-xs text-slate-300">Weekvenster {weekLabel}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] text-slate-300">Taken vandaag</p>
              <p className="mt-1 text-base font-semibold text-white">
                {todayDoneCount}/{todayTotalCount}
              </p>
            </article>
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] text-slate-300">Dagen gedaan</p>
              <p className="mt-1 text-base font-semibold text-white">
                {daysDoneCount}/{daysTotalCount}
              </p>
            </article>
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] text-slate-300">Week progressie</p>
              <p className="mt-1 text-base font-semibold text-cyan-100">{weeklyProgressPct}%</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
