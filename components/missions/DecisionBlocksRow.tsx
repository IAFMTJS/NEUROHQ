"use client";

import type { TaskWithMeta } from "@/app/actions/missions-performance";
import Link from "next/link";

type Block = {
  id: "streak_critical" | "high_pressure" | "recovery" | "alignment_fix";
  label: string;
  icon: string;
  tasks: TaskWithMeta[];
  className: string;
};

type Props = {
  streakCritical: TaskWithMeta[];
  highPressure: TaskWithMeta[];
  recovery: TaskWithMeta[];
  alignmentFix: TaskWithMeta[];
};

function BlockCard({ block }: { block: Block }) {
  if (block.tasks.length === 0) return null;

  return (
    <div className={`rounded-lg border p-3 ${block.className}`}>
      <p className="text-xs font-medium text-[var(--text-muted)]">
        {block.icon} {block.label}
      </p>
      <ul className="mt-2 space-y-1">
        {block.tasks.slice(0, 3).map((t) => (
          <li key={t.id}>
            <Link
              href="/tasks"
              className="block truncate text-sm text-[var(--text-primary)] hover:underline"
            >
              {t.title ?? "Task"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DecisionBlocksRow({
  streakCritical,
  highPressure,
  recovery,
  alignmentFix,
}: Props) {
  const blocks: Block[] = [
    {
      id: "streak_critical",
      label: "Streak Critical",
      icon: "⚠",
      tasks: streakCritical,
      className: "border-amber-500/40 bg-amber-500/10",
    },
    {
      id: "high_pressure",
      label: "High Pressure",
      icon: "🔥",
      tasks: highPressure,
      className: "border-orange-500/40 bg-orange-500/10",
    },
    {
      id: "recovery",
      label: "Recovery",
      icon: "🟢",
      tasks: recovery,
      className: "border-emerald-500/40 bg-emerald-500/10",
    },
    {
      id: "alignment_fix",
      label: "Alignment Fix",
      icon: "🎯",
      tasks: alignmentFix,
      className: "border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10",
    },
  ];

  const visible = blocks.filter((b) => b.tasks.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Decision blocks">
      {blocks.map((block) => (
        <BlockCard key={block.id} block={block} />
      ))}
    </section>
  );
}
