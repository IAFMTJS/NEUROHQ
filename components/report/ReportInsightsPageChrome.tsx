import { HQPageHeader } from "@/components/hq";

/** Intro block for Profiel → Insights. */
export function ReportInsightsPageChrome() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQPageHeader compact title="Insights" subtitle="Verklaren, voorspellen, sturen." />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Momentum, trend, gedragspatronen, voorspellingen en aanbevelingen. Alles wat we tracken: 7d / 30d, bronnen,
        wekelijkse vergelijking.
      </p>
    </>
  );
}
