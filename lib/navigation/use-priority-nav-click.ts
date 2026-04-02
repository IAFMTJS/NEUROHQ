"use client";

import { useCallback } from "react";
import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { normalizeAppPath } from "@/lib/navigation/normalize-app-path";

/**
 * Primary navigation for shell links (bottom nav, settings, help).
 * Uses imperative router.push so a new tap supersedes an in-flight App Router transition,
 * and re-tapping the current route runs refresh() to escape a stuck streaming state.
 */
export function usePriorityNavClick() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (href: string, event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const el = event.currentTarget;
      if (el.getAttribute("target") === "_blank") return;
      const download = el.getAttribute("download");
      if (download != null && download !== "") return;

      event.preventDefault();

      const targetPath = normalizeAppPath(href);
      const currentPath = normalizeAppPath(pathname);

      if (targetPath === currentPath) {
        router.refresh();
        return;
      }

      router.push(href);
    },
    [router, pathname]
  );
}
