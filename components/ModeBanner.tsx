import type { AppMode } from "@/lib/app-mode";

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

/** Mode hint under missions hero — same visual language as command deck (no SciFiPanel / corner HUD). */
export function ModeBanner({ mode }: Props) {
  if (mode === "normal" || !labels[mode]) return null;
  const options = labels[mode] as string[];
  const idx = new Date().getDay() % options.length;
  const message = options[idx] ?? options[0];
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.38)] px-4 py-3.5 text-sm leading-relaxed text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_24px_rgba(var(--mode-rgb),0.06)]"
    >
      <span
        className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--semantic-accent)]/75 shadow-[0_0_10px_rgba(var(--mode-rgb),0.35)]"
        aria-hidden
      />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
