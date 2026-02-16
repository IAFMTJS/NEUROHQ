"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Global keyboard shortcuts: N = new task / quick-add, A = assistant, Esc = back or close.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('[data-quick-add-input]');
        if (input) {
          input.focus();
        } else {
          router.push("/tasks");
        }
      } else if (key === "a") {
        e.preventDefault();
        router.push("/assistant");
      } else if (key === "Escape") {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeBtn = modal.querySelector<HTMLButtonElement>('[aria-label="Sluiten"], [data-close-modal]');
          closeBtn?.click();
        } else if (pathname !== "/dashboard") {
          router.push("/dashboard");
        }
      }
    },
    [router, pathname]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
