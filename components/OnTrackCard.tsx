import Link from "next/link";

type Props = {
  learningMinutes: number;
  learningTarget: number;
  strategySet: boolean;
};

export function OnTrackCard({ learningMinutes, learningTarget, strategySet }: Props) {
  const learningOk = learningMinutes >= learningTarget;
  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">On track?</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Quick view: learning & strategy.</p>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Learning this week</span>
          <span className={learningOk ? "text-green-400/90" : "text-[var(--text-primary)]"}>
            {learningMinutes} / {learningTarget} min
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Strategy set</span>
          <span className={strategySet ? "text-green-400/90" : "text-[var(--text-muted)]"}>{strategySet ? "Yes" : "No"}</span>
        </div>
        <Link href="/report" className="mt-2 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline">
          Reality report →
        </Link>
      </div>
    </div>
  );
}
