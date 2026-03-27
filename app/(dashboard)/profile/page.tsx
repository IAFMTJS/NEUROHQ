import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getStudyPlan, getAccountabilitySettings } from "@/app/actions/behavior";
import { getXPFullContext } from "@/app/actions/xp-context";
import { UserCallsignCard } from "@/components/settings/UserCallsignCard";
import { ProfileCategory } from "@/components/profile/ProfileSection";
import { ProfileHomeCompact } from "@/components/profile/ProfileHomeCompact";
import {
  parseProfileMainView,
  parseProfileEngineTab,
  profileHomeHref,
  profileEngineHref,
  reportInsightsHref,
  type ProfileEngineTabId,
} from "@/lib/profile-routes";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

const BehaviorProfileSettings = nextDynamic(() => import("@/components/settings/BehaviorProfileSettings").then((m) => ({ default: m.BehaviorProfileSettings })), { loading: () => null });
const SettingsEngineProfile = nextDynamic(() => import("@/components/settings/SettingsEngineProfile").then((m) => ({ default: m.SettingsEngineProfile })), { loading: () => null });
const SettingsDaysOff = nextDynamic(() => import("@/components/settings/SettingsDaysOff").then((m) => ({ default: m.SettingsDaysOff })), { loading: () => null });
const SettingsSimplifiedContent = nextDynamic(() => import("@/components/settings/SettingsSimplifiedContent").then((m) => ({ default: m.SettingsSimplifiedContent })), { loading: () => null });

export const dynamic = "force-dynamic";

const ENGINE_NAV: { id: ProfileEngineTabId; label: string }[] = [
  { id: "identity", label: "Identiteit" },
  { id: "behavior", label: "Gedrag" },
  { id: "modes", label: "Modi" },
];

function MainTabNav({ active }: { active: "home" | "engine" }) {
  const c =
    "rounded-lg border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide transition min-h-[44px] flex flex-1 items-center justify-center sm:flex-none";
  const on = "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/20 text-[var(--semantic-accent)]";
  const off = "border-[var(--card-border)]/60 bg-[var(--bg-surface)]/20 text-[var(--text-muted)] hover:border-[var(--semantic-ring)]/40 hover:text-[var(--text-primary)]";
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Profiel navigatie">
      <Link href={profileHomeHref()} aria-current={active === "home" ? "page" : undefined} className={`${c} ${active === "home" ? on : off}`}>
        Profiel
      </Link>
      <Link href={profileEngineHref("identity")} aria-current={active === "engine" ? "page" : undefined} className={`${c} ${active === "engine" ? on : off}`}>
        Engine
      </Link>
    </nav>
  );
}

function EngineTabNav({ active }: { active: ProfileEngineTabId }) {
  const c =
    "rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition whitespace-nowrap";
  const on = "border-[var(--semantic-ring)]/60 bg-[var(--semantic-accent)]/15 text-[var(--semantic-accent)]";
  const off = "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/35 hover:text-[var(--text-primary)]";
  return (
    <nav className="sticky top-[calc(env(safe-area-inset-top,0px)+4px)] z-20 -mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Engine">
      {ENGINE_NAV.map(({ id, label }) => (
        <Link key={id} href={profileEngineHref(id)} aria-current={active === id ? "page" : undefined} className={`${c} ${active === id ? on : off}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

type Search = {
  view?: string;
  settingsTab?: string;
  engineTab?: string;
  insightsTab?: string;
  weekStart?: string;
};

function redirectLegacyProfileQuery(raw: Search) {
  if (raw.view !== "settings") return;
  const st = raw.settingsTab ?? "identity";
  if (st === "insights") {
    const p = new URLSearchParams();
    if (raw.insightsTab) p.set("tab", raw.insightsTab);
    if (raw.weekStart) p.set("weekStart", raw.weekStart);
    redirect(p.toString() ? `/report?${p}` : "/report");
  }
  if (st === "system" || st === "budget") {
    redirect("/settings");
  }
  if (st === "identity" || st === "behavior") {
    redirect(`/profile?view=engine&engineTab=${st}`);
  }
  redirect("/settings");
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  redirectLegacyProfileQuery(raw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mainView = parseProfileMainView(raw.view);

  if (mainView === "home") {
    const [prefs, xpCtx] = await Promise.all([getUserPreferencesOrDefaults(), getXPFullContext()]);
    const { identity, insightState } = xpCtx;
    const simplified = prefs.simplified_content === true;

    if (simplified) {
      return (
        <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
          <SimplifiedPageShell
            title="Profiel"
            footerLinks={[
              { href: profileEngineHref("identity"), label: "Engine" },
              { href: "/settings", label: "Instellingen" },
              { href: "/dashboard", label: "HQ" },
            ]}
          >
            <div className="space-y-4">
              <MainTabNav active="home" />
              <ProfileHomeCompact identity={identity} insightState={insightState} />
            </div>
          </SimplifiedPageShell>
        </div>
      );
    }

    return (
      <div className="container page page-wide space-y-5 pb-10">
        <HQPageHeader title="Profiel" subtitle="Identiteit en status." backHref="/dashboard" />
        <MainTabNav active="home" />
        <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="profile" aria-hidden>
          <div className="mascot-hero-inner mx-auto">
            <HeroMascotImage page="profile" className="mascot-img" heroLarge />
          </div>
        </section>
        <ProfileHomeCompact identity={identity} insightState={insightState} />
      </div>
    );
  }

  const engineTab = parseProfileEngineTab(raw.engineTab ?? raw.settingsTab);
  const [prefs, behaviorProfile, studyPlan, accountabilitySettings] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
    getStudyPlan(),
    getAccountabilitySettings(),
  ]);
  const simplified = prefs.simplified_content === true;

  const engineNavAndHint = (
    <>
      <MainTabNav active="engine" />
      <p className="text-xs text-[var(--text-muted)]">
        Thema, push, budget en meer:{" "}
        <a href="/settings" className="font-medium text-[var(--accent-focus)] hover:underline">
          Instellingen
        </a>
        . Insights:{" "}
        <a href={reportInsightsHref("overview")} className="font-medium text-[var(--accent-focus)] hover:underline">
          Rapport
        </a>
        .
      </p>
    </>
  );

  const engineTabsAndPanels = (
    <>
      <EngineTabNav active={engineTab} />

      {engineTab === "identity" && (
        <div className="space-y-4">
          <div className="card-simple p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Account (alleen ter referentie)</p>
            <p className="mt-1 break-all text-sm text-[var(--text-primary)]">{user.email}</p>
          </div>
          <UserCallsignCard
            embedded
            initialDisplayCallsign={prefs.display_callsign ?? null}
            initialHqHeadline={prefs.hq_headline ?? null}
            initialGreetingLocale={prefs.greeting_locale ?? "en"}
          />
        </div>
      )}

      {engineTab === "behavior" && (
        <div className="space-y-4">
          <ProfileCategory title="Gedragsprofiel" subtitle="Identiteit, weekthema, avoidance" defaultOpen>
            <BehaviorProfileSettings initial={behaviorProfile} initialAutoMasterMissions={prefs.auto_master_missions} />
          </ProfileCategory>
          <ProfileCategory title="Motor &amp; verantwoording" subtitle="Study plan en accountability" defaultOpen={false}>
            <SettingsEngineProfile initialStudyPlan={studyPlan} initialAccountability={accountabilitySettings} />
          </ProfileCategory>
          <ProfileCategory title="Vrije dagen" subtitle="Welke dagen je meestal vrij neemt" defaultOpen={false}>
            <SettingsDaysOff initialDaysOff={prefs.usual_days_off ?? null} initialMode={prefs.day_off_mode ?? "soft"} />
          </ProfileCategory>
        </div>
      )}

      {engineTab === "modes" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--card-border)]/70 bg-[var(--bg-surface)]/15 px-3 py-2.5 text-xs text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Gebruikersmodus</p>
            <p className="mt-1">
              Dit stuurt hoeveel uitleg en shortcut-toasts je ziet. Voor thema&apos;s, push en apparaat zie{" "}
              <a href="/settings" className="text-[var(--accent-focus)] hover:underline">
                Instellingen
              </a>
              .
            </p>
          </div>
          <SettingsSimplifiedContent initialSimplifiedContent={prefs.simplified_content} />
        </div>
      )}
    </>
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Engine"
          footerLinks={[
            { href: profileHomeHref(), label: "Profiel" },
            { href: "/settings", label: "Instellingen" },
            { href: "/dashboard", label: "HQ" },
          ]}
        >
          <div className="space-y-5">
            {engineNavAndHint}
            {engineTabsAndPanels}
          </div>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <div className="container page page-wide space-y-5 pb-10">
      <HQPageHeader
        title="Engine"
        subtitle="Persona en planning die de missie-engine voeden. Site-instellingen staan onder Instellingen."
        backHref="/dashboard"
      />
      {engineNavAndHint}
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="profile" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="profile" className="mascot-img" heroLarge />
        </div>
      </section>
      {engineTabsAndPanels}
    </div>
  );
}
