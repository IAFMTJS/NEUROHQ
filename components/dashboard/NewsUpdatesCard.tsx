import { getLatestNews } from "@/lib/news-updates";
import Link from "next/link";

export function NewsUpdatesCard() {
  const items = getLatestNews(3);
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Laatste updates
      </h2>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li key={`${item.date}-${i}`} className="text-sm">
            <span className="text-[var(--text-muted)]">{item.date}</span>
            {" — "}
            <span className="font-medium text-[var(--text-primary)]">{item.title}</span>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{item.body}</p>
            {item.href && (
              <Link href={item.href} className="mt-1 inline-block text-xs text-[var(--accent-focus)] hover:underline">
                Meer →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
