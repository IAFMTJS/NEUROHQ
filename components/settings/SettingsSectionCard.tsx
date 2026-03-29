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
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.14)] via-[var(--bg-elevated)]/10 to-[var(--bg-primary)]/24 shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.1)] px-4 py-3 md:px-5 [&::-webkit-details-marker]:hidden">
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
