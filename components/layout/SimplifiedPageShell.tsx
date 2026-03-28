"use client";

import Link from "next/link";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { profileEngineHref } from "@/lib/profile-routes";

export type SimplifiedFooterLink = { href: string; label: string };

const DEFAULT_FOOTER: SimplifiedFooterLink[] = [
  { href: "/tasks", label: "Missions" },
  { href: "/budget", label: "Budget" },
  { href: "/strategy", label: "Strategy" },
];

type Props = {
  title: string;
  children: React.ReactNode;
  topSlot?: React.ReactNode;
  /** Extra classes on the scrollable body (padding, max-width). */
  bodyClassName?: string;
  footerLinks?: SimplifiedFooterLink[];
  /** Verberg de grote titelbalk; behoud sr-only titel voor toegankelijkheid. */
  hideTitleBar?: boolean;
};

export function SimplifiedPageShell({
  title,
  children,
  topSlot,
  bodyClassName,
  footerLinks,
  hideTitleBar = false,
}: Props) {
  const links = footerLinks ?? DEFAULT_FOOTER;
  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
      <SciFiPanel
        variant="command"
        className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
        bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-0 p-0"
      >
        <CornerNode corner="top-left" />
        <CornerNode corner="top-right" />
        {hideTitleBar ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-b border-[rgba(var(--mode-rgb),0.12)] px-3 py-2">
            <h2 className="sr-only">{title}</h2>
            <Link
              href="/dashboard"
              className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-sm"
            >
              HQ
            </Link>
          </div>
        ) : (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] px-4 py-3">
            <h2 className="hq-h2 min-w-0 flex-1 text-[var(--text-primary)]">{title}</h2>
            <Link
              href="/dashboard"
              className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-sm"
            >
              HQ
            </Link>
          </div>
        )}
        {topSlot ? (
          <div className="shrink-0 border-b border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb),0.04)] px-3 py-2">{topSlot}</div>
        ) : null}
        <div
          data-hq-simplified-scroll="1"
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] ${bodyClassName ?? "px-2 py-2 sm:px-3"}`}
        >
          {children}
        </div>
        <p className="shrink-0 border-t border-[rgba(var(--mode-rgb),0.1)] px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
          {links.map((l, i) => (
            <span key={l.href}>
              {i > 0 ? " · " : null}
              <Link href={l.href} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                {l.label}
              </Link>
            </span>
          ))}
          {" · "}
          <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
            Turn off simplified
          </Link>
        </p>
      </SciFiPanel>
    </div>
  );
}
