import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ weekStart?: string; tab?: string }> };

/** Insights leven voort onder Profiel → Instellingen → Insights (`/profile?view=settings&settingsTab=insights`). */
export default async function ReportPage({ searchParams }: Props) {
  const p = await searchParams;
  const u = new URLSearchParams();
  u.set("view", "settings");
  u.set("settingsTab", "insights");
  if (p.tab) u.set("insightsTab", p.tab);
  if (p.weekStart) u.set("weekStart", p.weekStart);
  redirect(`/profile?${u.toString()}`);
}
