"use client";

type Props = {
  message: string | null;
};

export function ResistanceIndexBanner({ message }: Props) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="status">
      <span className="font-medium">Resistance Index: </span>
      {message}
    </div>
  );
}
