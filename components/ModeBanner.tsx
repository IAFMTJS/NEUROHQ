import type { AppMode } from "@/lib/app-mode";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";

type Props = { mode: AppMode };

const labels: Record<AppMode, string[]> = {
  normal: [],
  low_energy: [
    "Low energy, high precision. Focus on one light mission and protect your momentum.",
    "Today is for clean wins: fewer tasks, better completion.",
    "Small execution beats perfect planning in low-energy mode.",
  ],
  high_sensory: [
    "High sensory load detected. Keep the interface calm and actions minimal.",
    "Noise is high today, so the system reduces visual and task pressure.",
  ],
  driven: [
    "Driven mode active: execute your highest-impact tasks first.",
    "Strong momentum window open. Prioritize difficult tasks while focus is high.",
  ],
  stabilize: [
    "Stabilize mode keeps pace sustainable. Finish or reschedule with intent.",
    "The goal today is control, not volume: complete essentials and reset cleanly.",
  ],
};

export function ModeBanner({ mode, flatFrame = false }: Props) {
  if (mode === "normal" || !labels[mode]) return null;
  const options = labels[mode] as string[];
  const idx = new Date().getDay() % options.length;
  const message = options[idx] ?? options[0];
  return (
    <SciFiPanel
      variant="flat-glass"
      className="overflow-hidden"
      bodyClassName="flex items-start gap-3 px-4 py-3.5 text-sm text-[var(--text-primary)]"
    >
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-focus)]" aria-hidden />
      <span>{message}</span>
    </SciFiPanel>
  );
}
