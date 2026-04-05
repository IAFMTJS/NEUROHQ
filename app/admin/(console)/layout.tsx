import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";

export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminNavTabs />
        <div className="flex flex-wrap items-center gap-2">
          <AdminSignOutButton />
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            Naar app
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
