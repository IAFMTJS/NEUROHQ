"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Home", prefetch: true },
  { href: "/admin/diagnostics", label: "Diagnostiek", prefetch: false },
  { href: "/admin/events", label: "Events", prefetch: true },
  { href: "/admin/games", label: "Games", prefetch: true },
  { href: "/admin/quests", label: "Quest", prefetch: true },
] as const;

export function AdminNavTabs() {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Admin">
      <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">Beheer</span>
      {tabs.map(({ href, label, prefetch }) => {
        const isActive =
          href === "/admin" ? normalized === "/admin" : normalized === href || normalized.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            prefetch={prefetch}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
