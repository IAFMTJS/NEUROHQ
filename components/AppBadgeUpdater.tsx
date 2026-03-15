"use client";

import { useHQStore } from "@/lib/hq-store";
import { useAppBadge } from "@/lib/use-app-badge";

/** Stable empty array so getSnapshot doesn't change every render (avoids React #185 / useSyncExternalStore loop). */
const EMPTY_TASKS: { completed?: boolean }[] = [];

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
  const tasks = useHQStore((s) => (today ? (s.tasksByDate[today] ?? EMPTY_TASKS) : EMPTY_TASKS));
  const incompleteCount = tasks.filter((t) => !(t as { completed?: boolean }).completed).length;
  useAppBadge(incompleteCount);
  return null;
}
