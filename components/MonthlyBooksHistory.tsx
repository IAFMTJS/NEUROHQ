type Book = { id: string; year: number; month: number; title: string; completed_at: string | null; slot?: number };

type Props = { books: Book[] };

export function MonthlyBooksHistory({ books }: Props) {
  if (books.length === 0) return null;
  const byMonth = books.reduce<Record<string, Book[]>>((acc, b) => {
    const key = `${b.year}-${b.month}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});
  const keys = Object.keys(byMonth).sort().reverse().slice(0, 6);

  return (
    <div className="rounded-xl border border-neuro-border bg-neuro-dark/40 px-4 py-3">
      <p className="mb-2 text-xs font-medium text-neuro-muted">Recent books</p>
      <ul className="space-y-1 text-sm text-neuro-silver">
        {keys.map((key) => {
          const [y, m] = key.split("-").map(Number);
          const monthBooks = byMonth[key];
          const label = new Date(y, m - 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
          return (
            <li key={key}>
              <span className="text-neuro-muted">{label}:</span>{" "}
              {monthBooks.map((b) => b.title).join(", ")}
              {monthBooks.some((b) => b.completed_at) && " ✓"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
