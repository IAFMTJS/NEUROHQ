import { PolygonHudMeter } from "@/components/visual-lab/VisualLabPolygonMeters";

type Props = {
  weekLabel: string;
  activeProtocolTitle: string;
  protocolProgressPct: number;
  protocolDoneCount: number;
  protocolTotalCount: number;
  weeklyProgressPct: number;
  todayDoneCount: number;
  todayTotalCount: number;
  daysDoneCount: number;
  daysTotalCount: number;
};

export function GrowthCommanderSummaryCard({
  weekLabel,
  activeProtocolTitle,
  protocolProgressPct,
  protocolDoneCount,
  protocolTotalCount,
  weeklyProgressPct,
  todayDoneCount,
  todayTotalCount,
  daysDoneCount,
  daysTotalCount,
}: Props) {
  const weekLeftCount = Math.max(0, daysTotalCount - daysDoneCount);
  const protocolStateLabel = protocolProgressPct >= 80 ? "Ver gevorderd" : protocolProgressPct >= 50 ? "Op schema" : "In opbouw";
  const weekStateLabel = weeklyProgressPct >= 80 ? "On track" : weeklyProgressPct >= 50 ? "Stable" : "Catch-up";
  return (
    <section className="rounded-2xl border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(3,10,20,0.92)_0%,rgba(7,20,38,0.9)_52%,rgba(6,10,22,0.95)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.35)] md:p-5">
      <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="flex justify-center md:justify-start">
          <div>
            <PolygonHudMeter
              variant="hex"
              style="ring"
              label="Protocol progress"
              value={`${protocolProgressPct}%`}
              pct={protocolProgressPct}
              size="xxl"
              ringThickness="thick"
              hideFooter
              centerValueText={`${protocolProgressPct}%`}
            />
          </div>
        </div>
        <div className="space-y-3 lg:pl-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">Commander Card</p>
            <h2 className="mt-1 text-lg font-semibold text-white md:text-xl">{activeProtocolTitle}</h2>
            <p className="mt-1 text-xs text-slate-300">Weekvenster {weekLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <article className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.08] p-3">
              <p className="text-[11px] text-cyan-100/90">Protocol progress</p>
              <p className="mt-1 text-base font-semibold text-cyan-100">{protocolProgressPct}%</p>
              <p className="text-[10px] text-slate-300">
                {protocolStateLabel} · {protocolDoneCount}/{protocolTotalCount} taken
              </p>
            </article>
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
              <p className="text-[11px] text-slate-300">Week status</p>
              <p className="mt-1 text-base font-semibold text-cyan-100">{weekStateLabel}</p>
              <p className="text-[10px] text-slate-300">{weekLeftCount} dagen over</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
