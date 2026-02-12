"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const mainNavLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/budget", label: "Budget" },
  { href: "/learning", label: "Learning" },
  { href: "/strategy", label: "Strategy" },
  { href: "/report", label: "Report" },
];
const settingsLink = { href: "/settings", label: "Settings" };

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-neuro-border bg-neuro-surface px-4">
      <Link href="/dashboard" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-neuro-blue focus-visible:ring-offset-2 focus-visible:ring-offset-neuro-dark rounded-lg">
        <Image src="/app-icon.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-contain" priority />
        <div className="flex flex-col">
          <Image src="/logo-naam.png" alt="NEUROHQ" width={160} height={42} className="h-9 w-auto object-contain" priority />
          <span className="text-[10px] font-medium text-neuro-muted">Your daily HQ</span>
        </div>
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
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 border-t border-neuro-border bg-neuro-surface safe-area-pb"
      style={{ minHeight: "var(--footer-height)" }}
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col">
        <ul className="flex flex-1 items-center justify-around gap-0.5 px-1 pt-2">
          {mainNavLinks.map((link) => (
            <li key={link.href} className="flex-1 min-w-0">
              <Link
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] transition min-h-[44px] ${
                  pathname === link.href
                    ? "bg-neuro-blue/15 text-neuro-silver font-medium"
                    : "text-neuro-muted hover:bg-neuro-border/50 hover:text-neuro-silver"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-around border-t border-neutral-800/80 px-2 py-1.5">
          <Link
            href={settingsLink.href}
            className={`rounded px-2 py-1 text-[11px] ${
              pathname === settingsLink.href ? "bg-neuro-blue/15 text-neuro-silver font-medium" : "text-neuro-muted hover:text-neuro-silver"
            }`}
          >
            {settingsLink.label}
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded px-2 py-1 text-[11px] text-neuro-muted hover:bg-neuro-border/50 hover:text-neuro-silver"
          >
            Sign out
          </button>
        </div>
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
