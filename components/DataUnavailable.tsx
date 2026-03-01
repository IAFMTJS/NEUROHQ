import Link from "next/link";

type Page = "dashboard" | "report";

const copy: Record<Page, { title: string; body: string; backHref: string; backLabel: string }> = {
  dashboard: {
    title: "Dashboard tijdelijk niet beschikbaar",
    body: "De verbinding met de server duurde te lang. Dit kan even duren na het inloggen. Vernieuw de pagina om het opnieuw te proberen.",
    backHref: "/dashboard",
    backLabel: "Vernieuw dashboard",
  },
  report: {
    title: "Insights tijdelijk niet beschikbaar",
    body: "De verbinding met de server duurde te lang. Vernieuw de pagina om het opnieuw te proberen.",
    backHref: "/report",
    backLabel: "Vernieuw insights",
  },
};

export function DataUnavailable({ page }: { page: Page }) {
  const c = copy[page];
  return (
    <main className="container page page-wide flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">{c.title}</h1>
      <p className="max-w-md text-sm text-[var(--text-muted)]">{c.body}</p>
      <Link
        href={c.backHref}
        className="rounded-xl bg-[var(--accent-focus)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {c.backLabel}
      </Link>
    </main>
  );
}
