import type { AppMode } from "@/app/actions/mode";

type Props = { mode: AppMode };

const labels: Record<AppMode, string> = {
  normal: "",
  low_energy: "Low energy — showing up to 3 tasks, hiding heavy ones.",
  high_sensory: "High sensory load — minimal UI.",
  driven: "Driven mode — high-impact tasks first.",
  stabilize: "Stabilize mode — 2 tasks only. No new tasks until you finish or reschedule.",
};

export function ModeBanner({ mode }: Props) {
  if (mode === "normal" || !labels[mode]) return null;
  return (
    <div className="card-modern-accent flex items-start gap-3 px-4 py-3.5 text-sm text-neuro-silver">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-neuro-blue" aria-hidden />
      <span>{labels[mode]}</span>
    </div>
  );
}
