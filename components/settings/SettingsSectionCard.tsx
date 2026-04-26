"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useSettingsPageLayout } from "./SettingsPageLayout";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsSectionCard({
  id,
  title,
  subtitle,
  searchText,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  /** Extra trefwoorden voor zoeken (komma of spaties). */
  searchText: string;
  children: ReactNode;
}) {
  const { query } = useSettingsPageLayout();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const blob = `${title} ${subtitle} ${searchText}`.toLowerCase();
    return blob.includes(q);
  }, [query, title, subtitle, searchText]);

  if (!visible) return null;

  return (
    <section
      id={id}
      className="card-simple scroll-mt-28 overflow-hidden p-0"
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 border-b border-[var(--card-border)] px-4 py-3 md:px-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
          </div>
          <ChevronIcon className="mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="space-y-4 p-4 md:p-5">{children}</div>
      </details>
    </section>
  );
}
