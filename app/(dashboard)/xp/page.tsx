import { XPPageClient } from "@/components/xp/XPPageClient";
import { HQPageHeader } from "@/components/hq";

function XPShell() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQPageHeader
          title="XP Command Center"
          subtitle="Energie-economie · Gedragsanalyse · Strategische optimalisatie"
          backHref="/dashboard"
        />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Alles draait rond één event-systeem: XP Core Engine, Mission Library, Completion & Validation, Analytics & Quality.
      </p>
      <div className="xp-mascot-hero min-h-[120px]" data-mascot-page="xp" aria-hidden />
    </>
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
