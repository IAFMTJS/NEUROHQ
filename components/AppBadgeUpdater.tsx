"use client";

import { useHQStore } from "@/lib/hq-store";
import { useAppBadge } from "@/lib/use-app-badge";

function getClientToday(): string {
  if (typeof window === "undefined") return "";
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/**
 * Sets PWA app icon badge to today's incomplete task count. Mount inside app shell.
 */
export function AppBadgeUpdater() {
  const today = getClientToday();
  const tasks = useHQStore((s) => (today ? (s.tasksByDate[today] ?? []) : []));
  const incompleteCount = tasks.filter((t) => !(t as { completed?: boolean }).completed).length;
  useAppBadge(incompleteCount);
  return null;
}
