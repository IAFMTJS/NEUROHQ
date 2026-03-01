import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getCurrentQuarter } from "@/lib/utils/strategy";

export async function StrategyBlock() {
  const strategy = await getQuarterlyStrategy();
  const { year, quarter } = getCurrentQuarter();
  if (!strategy?.identity_statement && !strategy?.primary_theme) return null;
  return (
    <div className="card-simple-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Q{quarter} {year}</h2>
        {strategy?.primary_theme && (
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">Theme: {strategy.primary_theme}</p>
        )}
      </div>
      {strategy?.identity_statement && (
        <div className="p-4">
          <p className="text-sm italic leading-relaxed text-[var(--text-primary)]">&ldquo;{strategy.identity_statement}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
