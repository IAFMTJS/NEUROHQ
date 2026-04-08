import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { syncGrowthFocusProtocolToCalendarWeek } from "@/app/actions/growth-protocol-calendar-sync";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { LearningContentClient } from "@/components/growth/LearningContentClient";
import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { formatDayShort } from "@/lib/utils/date-locale";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  await syncGrowthFocusProtocolToCalendarWeek();
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;
  const today = todayDateString();
  const { start: budgetWeekStart, end: budgetWeekEnd } = getBudgetWeekBounds(today);
  const budgetWeekLabel = `${formatDayShort(budgetWeekStart)} – ${formatDayShort(budgetWeekEnd)}`;

  const [protocols, progressMap, growthFocus, strategyPacingHints] = await Promise.all([
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
    getStrategyPacingHints(),
  ]);

  const learningBody = (
    <LearningContentClient
      protocols={protocols}
      progressMap={progressMap}
      growthFocus={growthFocus}
      strategyPacingHints={strategyPacingHints}
      budgetWeekLabel={budgetWeekLabel}
      simplified={simplified}
    />
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Growth"
          hideTitleBar
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/dashboard", label: "HQ" },
            { href: "/budget", label: "Budget" },
          ]}
        >
          {learningBody}
        </SimplifiedPageShell>
      </div>
    );
  }

  return <GrowthPageCommandShell>{learningBody}</GrowthPageCommandShell>;
}
