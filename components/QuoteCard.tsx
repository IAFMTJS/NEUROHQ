import type { Quote } from "@/types/database.types";

type Props = { quote: Quote | null };

export function QuoteCard({ quote }: Props) {
  if (!quote) {
    return (
      <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
        <p className="text-sm text-neutral-500">No quote for today. Add quotes to the database.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <p className="text-neuro-silver">&ldquo;{quote.quote_text}&rdquo;</p>
      <p className="mt-2 text-xs text-neutral-400">
        — {quote.author_name}
        {quote.era && ` · ${quote.era}`}
        {quote.topic && ` · On ${quote.topic}`}
      </p>
    </div>
  );
}
