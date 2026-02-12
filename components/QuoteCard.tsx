import type { Quote } from "@/types/database.types";

type Props = { quote: Quote | null };

export function QuoteCard({ quote }: Props) {
  if (!quote) {
    return (
      <div className="card-modern p-4">
        <p className="text-sm text-neuro-muted">No quote for today. Add quotes to the database.</p>
      </div>
    );
  }
  return (
    <div className="card-modern p-5">
      <p className="text-[1.05rem] leading-relaxed text-neuro-silver">&ldquo;{quote.quote_text}&rdquo;</p>
      <p className="mt-3 text-xs text-neuro-muted">
        — {quote.author_name}
        {quote.era && ` · ${quote.era}`}
        {quote.topic && ` · On ${quote.topic}`}
      </p>
    </div>
  );
}
