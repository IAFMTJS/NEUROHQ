"use client";

import { usePathname } from "next/navigation";

/** Mascots are now rendered in-page (after header) on each dashboard route for consistent placement. */
export function PageMascot() {
  const pathname = usePathname();
  const dashboardRoutes = ["/dashboard", "/tasks", "/learning", "/assistant", "/analytics", "/report", "/budget", "/strategy", "/settings", "/xp"];
  if (!pathname || dashboardRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) return null;
  return null;
}
