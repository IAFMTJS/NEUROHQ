import { XPPageClient } from "@/components/xp/XPPageClient";
import { HQPageHeader } from "@/components/hq";

function XPShell() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <HQPageHeader
        title="XP Nexus"
        subtitle="Effectief XP verdienen: missies, streaks en alle actieve bronnen"
        backHref="/dashboard"
      />
    </div>
  );
}

async function XPContent() {
  const today = new Date().toISOString().slice(0, 10);
  return <XPPageClient todayStr={today} />;
}

export default function XPPage() {
  return (
    <div className="container page page-wide space-y-6">
      <XPShell />
      <XPContent />
    </div>
  );
}
