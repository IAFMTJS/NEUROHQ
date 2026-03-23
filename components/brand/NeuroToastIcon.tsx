"use client";

type NeuroToastIconVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

const VARIANT_CLASS: Record<NeuroToastIconVariant, string> = {
  default: "border-cyan-400/50 bg-cyan-500/15 text-cyan-200",
  success: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200",
  error: "border-rose-400/50 bg-rose-500/15 text-rose-200",
  warning: "border-amber-400/50 bg-amber-500/15 text-amber-200",
  info: "border-sky-400/50 bg-sky-500/15 text-sky-200",
  loading: "border-violet-400/50 bg-violet-500/15 text-violet-200",
};

type Props = {
  variant?: NeuroToastIconVariant;
};

export function NeuroToastIcon({ variant = "default" }: Props) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1 text-[10px] font-bold uppercase tracking-wide ${VARIANT_CLASS[variant]}`}
    >
      NQ
    </span>
  );
}
