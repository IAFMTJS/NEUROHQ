import Link from "next/link";
import { HudLinkButton } from "@/components/hud-test/HudLinkButton";

type Props = {
  totalXp: number;
  level: number;
  compact?: boolean;
  /** Explicit href avoids hydration mismatch. */
  href: string;
};

export function XPBadge({ totalXp, level, compact = false, href }: Props) {
  if (compact) {
    return (
      <HudLinkButton
        href={href}
        className="dashboard-hud-chip shrink-0 whitespace-nowrap rounded-[10px] px-2 text-[9px] font-semibold normal-case tracking-[0.03em]"
        style={{ height: "26px", minHeight: "26px", paddingTop: 0, paddingBottom: 0, paddingLeft: "6px", paddingRight: "6px" }}
        aria-label={`Level ${level}, ${totalXp} XP`}
      >
        <span aria-hidden>⭐</span>
        <span>Lv.{level}</span>
        <span className="text-[var(--text-muted)]">{totalXp} XP</span>
      </HudLinkButton>
    );
  }
  return (
    <Link
      href={href}
      className="card-simple flex items-center gap-3 px-4 py-3 hover:opacity-90 transition"
    >
      <span className="text-2xl" aria-hidden>⭐</span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Level {level}</p>
        <p className="text-xs text-[var(--text-muted)]">{totalXp} XP total</p>
      </div>
      <span className="ml-auto text-sm text-[var(--accent-focus)]">View in Settings →</span>
    </Link>
  );
}
