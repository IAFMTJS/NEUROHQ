import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { HelpPageClient } from "./HelpPageClient";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;
  return <HelpPageClient simplifiedLayout={simplified} />;
}
