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
    <div className="card-modern-accent mb-4 px-4 py-3 text-sm text-neutral-300">
      {labels[mode]}
    </div>
  );
}
