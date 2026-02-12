import type { Quote } from "@/types/database.types";

type Props = { quote: Quote | null; dayOfYear?: number };

/** One quote per day: system maps quote id 1–365 to day of year. No navigation. */
export function QuoteCard({ quote, dayOfYear }: Props) {
  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Quote of the day</h2>
        {dayOfYear != null && (
          <p className="mt-0.5 text-xs text-neuro-muted">Day {dayOfYear} of 365</p>
        )}
      </div>
      <div className="p-5">
        {!quote ? (
          <p className="text-sm text-neuro-muted">No quote for today. Add quotes to the database.</p>
        ) : (
          <>
            <p className="text-[1.05rem] leading-relaxed text-neuro-silver">&ldquo;{quote.quote_text}&rdquo;</p>
            <p className="mt-3 text-sm text-neuro-muted">
              — {quote.author_name}
              {quote.era && ` · ${quote.era}`}
              {quote.topic && ` · On ${quote.topic}`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
