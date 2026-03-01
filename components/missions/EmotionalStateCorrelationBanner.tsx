"use client";

type Props = {
  message: string | null;
};

export function EmotionalStateCorrelationBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/5 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Emotie & prestaties</h3>
      <p className="mt-1 text-[var(--text-primary)]">{message}</p>
    </div>
  );
}
