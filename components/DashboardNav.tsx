"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/budget", label: "Budget" },
  { href: "/learning", label: "Learning" },
  { href: "/strategy", label: "Strategy" },
  { href: "/report", label: "Report" },
  { href: "/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="flex flex-col border-b border-neutral-800 bg-neuro-surface md:w-52 md:border-b-0 md:border-r md:border-neutral-800">
      <div className="flex h-14 items-center px-4 md:justify-center">
        <Link href="/dashboard" className="text-lg font-bold text-neuro-silver">
          NEURO<span className="text-neuro-blue">HQ</span>
        </Link>
      </div>
      <ul className="flex gap-1 p-2 md:flex-col md:p-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block rounded px-3 py-2 text-sm transition ${
                pathname === link.href
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neuro-silver"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-neutral-800 p-4">
        <button
          onClick={handleSignOut}
          className="w-full rounded px-3 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neuro-silver"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
