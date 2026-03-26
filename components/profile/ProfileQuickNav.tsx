import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Missions" },
  { href: "/budget", label: "Budget" },
  { href: "/learning", label: "Growth" },
  { href: "/strategy", label: "Strategy" },
  { href: "/help", label: "Help" },
] as const;

/** Compacte hub: één tik naar de belangrijkste bases. */
export function ProfileQuickNav() {
  return (
    <section className="card-simple p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Snel naar</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Routes vanuit je profiel</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/20 px-3 py-2 text-center text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]/35"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
