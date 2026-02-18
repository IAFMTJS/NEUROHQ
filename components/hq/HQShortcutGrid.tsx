"use client";

import Link from "next/link";
import { IconHQ, IconMissions, IconBudget, IconGrowth, IconStrategy } from "@/components/hq/NavIcons";

/** Reference: 2x2 card grid – Missions, Energy, Budget, Growth, Strategy. Cinematic glass + glow. */
const shortcuts = [
  { href: "/tasks", label: "Missions", subtext: "Today's tasks", icon: IconMissions, glow: "cinematic-card-glow-cyan" },
  { href: "/dashboard", label: "Energy", subtext: "Brain status", icon: IconHQ, glow: "cinematic-card-glow-teal" },
  { href: "/budget", label: "Budget", subtext: "Spendable & savings", icon: IconBudget, glow: "cinematic-card-glow-blue" },
  { href: "/learning", label: "Growth", subtext: "Learning & streak", icon: IconGrowth, glow: "cinematic-card-glow-green" },
  { href: "/strategy", label: "Strategy", subtext: "Quarterly focus", icon: IconStrategy, glow: "cinematic-card-glow-purple" },
] as const;

export function HQShortcutGrid() {
  return (
    <section
      className="grid grid-cols-2 gap-3"
      aria-label="Shortcuts"
    >
      {shortcuts.map(({ href, label, subtext, icon: Icon, glow }) => (
        <Link
          key={href + label}
          href={href}
          className={`cinematic-card glass-card-3d ${glow} flex flex-col gap-2 min-h-[100px] p-4 relative z-[1]`}
        >
          <span className="icon-neon-wrap w-10 h-10 shrink-0" aria-hidden>
            <Icon active={false} />
          </span>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)]">{subtext}</p>
        </Link>
      ))}
    </section>
  );
}
