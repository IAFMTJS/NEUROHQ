"use client";

import Link from "next/link";
import { IconHQ, IconMissions, IconBudget, IconGrowth, IconStrategy } from "@/components/hq/NavIcons";

/** Reference: 2x2 card grid – Missions, Energy, Budget, Growth, Strategy. Each: icon, title, subtext, glass + glow. */
const shortcuts = [
  { href: "/tasks", label: "Missions", subtext: "Today's tasks", icon: IconMissions, glow: "glass-card-glow-cyan" },
  { href: "/dashboard", label: "Energy", subtext: "Brain status", icon: IconHQ, glow: "glass-card-glow-teal" },
  { href: "/budget", label: "Budget", subtext: "Spendable & savings", icon: IconBudget, glow: "glass-card-glow-blue" },
  { href: "/learning", label: "Growth", subtext: "Learning & streak", icon: IconGrowth, glow: "glass-card-glow-green" },
  { href: "/strategy", label: "Strategy", subtext: "Quarterly focus", icon: IconStrategy, glow: "glass-card-glow-purple" },
] as const;

export function HQShortcutGrid() {
  return (
    <section
      className="grid grid-cols-2 gap-3"
      aria-label="Shortcuts"
    >
      {shortcuts.map(({ href, label, subtext, icon: Icon }) => (
        <Link
          key={href + label}
          href={href}
          className="growth-card flex flex-col gap-2 min-h-[100px]"
        >
          <span className="growth-card-corner" aria-hidden />
          <div className="growth-card-content flex flex-col gap-2 min-w-0">
            <span className="icon-neon-wrap w-10 h-10 shrink-0" aria-hidden>
              <Icon active={false} />
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
            <p className="text-xs text-[var(--text-muted)]">{subtext}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
