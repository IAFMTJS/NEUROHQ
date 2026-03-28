"use client";

type Props = {
  icon: string;
  title: string;
  /** Korte kenmerkregel (status / samenvatting). */
  trait: string;
  onOpen: () => void;
  badge?: string;
};

/** Compacte Engine-categorie op de userpage; opent detail in modal. */
export function ProfileEngineCategoryTile({ icon, title, trait, onOpen, badge }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(var(--mode-rgb-deep),0.07)] p-3.5 text-left transition hover:border-[rgba(var(--mode-rgb),0.24)] hover:bg-[rgba(var(--mode-rgb-deep),0.12)] outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 sm:gap-4 sm:p-4"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[var(--bg-primary)]/35 text-[1.35rem] leading-none sm:h-12 sm:w-12"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">{title}</span>
          {badge ? (
            <span className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300/95">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">{trait}</span>
      </span>
      <span
        className="mt-1 shrink-0 text-lg font-light text-[var(--text-muted)] transition group-hover:text-[var(--semantic-accent)]"
        aria-hidden
      >
        →
      </span>
    </button>
  );
}
