import Link from "next/link";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
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

/** Simplified hub pages: same command-deck chrome as `/tasks` (missions). */
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
    <div className="flex w-full flex-col">
      <div className="hq-frosted-main-shell">
        <DashboardCommandDeckFrame deckTitle={title} hideTitleVisually={hideTitleBar}>
          {topSlot ? (
            <div className="mt-4 shrink-0 rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.45)] px-3 py-2 backdrop-blur-sm">
              {topSlot}
            </div>
          ) : null}
          <div
            data-hq-simplified-scroll="1"
            className={`mt-4 space-y-6 ${bodyClassName ?? "px-2 py-2 sm:px-3"}`}
          >
            {children}
          </div>
          <p className="mt-4 shrink-0 border-t border-[rgba(var(--mode-rgb),0.14)] pt-3 text-center text-[11px] text-[var(--text-muted)]">
            {links.map((l, i) => (
              <span key={l.href}>
                {i > 0 ? " · " : null}
                <Link href={l.href} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
            {" · "}
            <Link
              href={profileEngineHref("modes")}
              className="text-[var(--accent-focus)] underline-offset-2 hover:underline"
            >
              Turn off simplified
            </Link>
          </p>
        </DashboardCommandDeckFrame>
      </div>
    </div>
  );
}
