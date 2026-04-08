import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { GrowthReimaginedBExperience } from "@/components/growth/GrowthReimaginedBExperience";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;

  const learningBody = <GrowthReimaginedBExperience showLearningLink={false} />;

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
