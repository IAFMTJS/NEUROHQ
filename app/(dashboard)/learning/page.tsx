import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { getPersonalGrowthFocus, getPersonalGrowthWeekStats } from "@/app/actions/personal-growth";
import { PersonalGrowthHubClient } from "@/components/growth/PersonalGrowthHubClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;

  const [initialFocus, weekStats] = await Promise.all([getPersonalGrowthFocus(), getPersonalGrowthWeekStats()]);
  const learningBody = <PersonalGrowthHubClient initialFocus={initialFocus} weekStats={weekStats} />;

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
