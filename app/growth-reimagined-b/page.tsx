import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { GrowthReimaginedBExperience } from "@/components/growth/GrowthReimaginedBExperience";

export const dynamic = "force-dynamic";

export default async function GrowthReimaginedBPage() {
  return (
    <GrowthPageCommandShell>
      <GrowthReimaginedBExperience showLearningLink />
    </GrowthPageCommandShell>
  );
}
