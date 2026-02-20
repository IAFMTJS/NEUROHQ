"use client";

type Props = {
  text: string;
  type: "streak" | "level" | "momentum" | "first_mission" | null;
};

export function SmartSuggestionBanner({ text, type }: Props) {
  if (!text) return null;

  const style =
    type === "streak"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
      : type === "level"
        ? "border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 text-[var(--accent-focus)]"
        : "border-[var(--card-border)] bg-white/5 text-[var(--text-secondary)]";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${style}`}
      role="status"
      aria-live="polite"
    >
      <span className="font-medium">Tip: </span>
      {text}
    </div>
  );
}
