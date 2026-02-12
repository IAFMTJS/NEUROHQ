import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getCurrentQuarter } from "@/lib/utils/strategy";

export async function StrategyBlock() {
  const strategy = await getQuarterlyStrategy();
  const { year, quarter } = getCurrentQuarter();
  if (!strategy?.identity_statement && !strategy?.primary_theme) return null;
  return (
    <div className="card-modern p-4">
      <h2 className="mb-2 text-sm font-semibold text-neuro-silver">Q{quarter} {year}</h2>
      {strategy.primary_theme && (
        <p className="text-sm text-neutral-400">Theme: {strategy.primary_theme}</p>
      )}
      {strategy.identity_statement && (
        <p className="mt-2 text-sm italic leading-relaxed text-neuro-silver">&ldquo;{strategy.identity_statement}&rdquo;</p>
      )}
    </div>
  );
}
