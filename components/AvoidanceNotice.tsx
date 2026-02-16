import Link from "next/link";

type Props = { carryOverCount: number };

export function AvoidanceNotice({ carryOverCount }: Props) {
  if (carryOverCount < 3) return null;
  return (
    <div className="card-modern-accent flex items-start gap-3 px-4 py-3.5 text-sm text-[var(--text-primary)]">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
      <div>
        <p className="font-medium text-amber-200">
          {carryOverCount} task{carryOverCount !== 1 ? "s" : ""} carried over.
        </p>
        <p className="mt-1 text-[var(--text-muted)]">
          Want to pick one to focus on?
        </p>
        <Link
          href="/tasks"
          className="mt-2 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline"
        >
          Go to tasks →
        </Link>
      </div>
    </div>
  );
}
