import type { ReactNode } from "react";

type CategoryProps = {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Top-level collapsible section on the profile / user page (matches settings `<details>` pattern). */
export function ProfileCategory({ title, subtitle, defaultOpen = false, children }: CategoryProps) {
  return (
    <details className="card-simple overflow-hidden p-0" open={defaultOpen}>
      <summary className="cursor-pointer list-none border-b border-[var(--card-border)] px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]/35">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
      </summary>
      <div className="space-y-4 p-4">{children}</div>
    </details>
  );
}

type SubCardProps = {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Nested collapsible inside a profile category for long forms. */
export function ProfileSubCard({ title, subtitle, defaultOpen = false, children }: SubCardProps) {
  return (
    <details className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/20" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-hover)]/25">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
      </summary>
      <div className="space-y-3 border-t border-[var(--card-border)]/50 p-3">{children}</div>
    </details>
  );
}
