"use client";

import { useState, useEffect } from "react";

const STORAGE_PREFIX = "dashboard-card-";

type Props = {
  title: string;
  subtitle?: string;
  storageKey?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Reusable collapsible dashboard card; optional localStorage persistence. */
export function CollapsibleDashboardCard({
  title,
  subtitle,
  storageKey,
  defaultExpanded = true,
  children,
  className = "",
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !storageKey) return;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (raw === "false") setIsExpanded(false);
      if (raw === "true") setIsExpanded(true);
    } catch {
      // ignore
    }
  }, [mounted, storageKey]);

  function toggle() {
    const next = !isExpanded;
    setIsExpanded(next);
    if (storageKey) {
      try {
        localStorage.setItem(STORAGE_PREFIX + storageKey, String(next));
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)]/80 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={toggle}
          className="shrink-0 rounded-md border border-[var(--card-border)]/80 px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Minimize ${title}` : `Expand ${title}`}
        >
          {isExpanded ? "Minimize" : "Expand"}
        </button>
      </div>
      {isExpanded && <div className="p-0">{children}</div>}
    </div>
  );
}
