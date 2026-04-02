import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ weekStart?: string; tab?: string }> };

/** Oude `/report`-URLs doorsturen naar Profiel → Insights. */
export default async function ReportPageRedirect({ searchParams }: Props) {
  const q = await searchParams;
  const p = new URLSearchParams();
  p.set("view", "insights");
  if (q.tab) p.set("tab", q.tab);
  if (q.weekStart) p.set("weekStart", q.weekStart);
  redirect(`/profile?${p}`);
}
