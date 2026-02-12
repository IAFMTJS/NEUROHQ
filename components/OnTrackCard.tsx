import Link from "next/link";

type Props = {
  learningMinutes: number;
  learningTarget: number;
  strategySet: boolean;
};

export function OnTrackCard({ learningMinutes, learningTarget, strategySet }: Props) {
  const learningOk = learningMinutes >= learningTarget;
  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">On track?</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Quick view: learning & strategy.</p>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neuro-muted">Learning this week</span>
          <span className={learningOk ? "text-green-400/90" : "text-neuro-silver"}>
            {learningMinutes} / {learningTarget} min
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neuro-muted">Strategy set</span>
          <span className={strategySet ? "text-green-400/90" : "text-neuro-muted"}>{strategySet ? "Yes" : "No"}</span>
        </div>
        <Link href="/report" className="mt-2 inline-block text-sm font-medium text-neuro-blue hover:underline">
          Reality report →
        </Link>
      </div>
    </div>
  );
}
