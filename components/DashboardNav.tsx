"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconHQ,
  IconMissions,
  IconGrowth,
  IconInsights,
  IconSettings,
  IconBudget,
  IconStrategy,
  IconAssistant,
} from "@/components/hq/NavIcons";

/** Bottom nav: all main app sections */
const hqNavLinks = [
  { href: "/dashboard", label: "HQ", icon: IconHQ },
  { href: "/assistant", label: "Assistant", icon: IconAssistant },
  { href: "/tasks", label: "Missions", icon: IconMissions },
  { href: "/budget", label: "Budget", icon: IconBudget },
  { href: "/learning", label: "Growth", icon: IconGrowth },
  { href: "/strategy", label: "Strategy", icon: IconStrategy },
  { href: "/report", label: "Insight", icon: IconInsights },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--accent-neutral)] bg-[var(--bg-surface)] px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] rounded-xl"
      >
        <Image src="/app-icon.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-contain shrink-0" priority />
        <Image src="/logo-naam.png" alt="NEUROHQ" width={140} height={36} className="h-8 w-auto max-w-[120px] object-contain object-left" priority />
      </Link>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 border-t border-[var(--accent-neutral)] safe-area-pb backdrop-blur-[12px]"
      style={{
        minHeight: "var(--footer-height)",
        backgroundColor: "var(--nav-bg)",
      }}
      aria-label="Main navigation"
    >
      <ul className="flex h-16 items-center justify-around px-2">
        {hqNavLinks.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <li key={link.href} className="flex-1 min-w-0">
              <Link
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-2 min-h-[44px] transition-all duration-200 ease-out ${
                  active ? "nav-link-active text-[var(--text-primary)] bg-[var(--bg-elevated)]/80" : "nav-link text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-secondary)]"
                }`}
              >
                <span className="nav-icon-wrap inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ease-out" style={{ transform: active ? "scale(1.05)" : "scale(1)" }}>
                  <Icon active={active} />
                </span>
                <span className="text-[11px] font-medium tracking-wide relative inline-block pb-1.5">
                  {link.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 h-0.5 w-5 rounded-full bg-[var(--accent-cta)] origin-center hq-nav-underline"
                      aria-hidden
                    />
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-end border-t border-[var(--accent-neutral)] px-3 py-1">
        <button
          onClick={handleSignOut}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

export function DashboardNav() {
  return (
    <>
      <AppHeader />
      <BottomNav />
    </>
  );
}
