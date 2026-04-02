import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { ProfileCommandDeckLayout } from "@/components/profile/ProfileCommandDeckLayout";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getStudyPlan, getAccountabilitySettings } from "@/app/actions/behavior";
import { getXPFullContext } from "@/app/actions/xp-context";
import { getDailyState } from "@/app/actions/daily-state";
import { getProfileDailyChallengeContext } from "@/app/actions/profile-daily-challenges";
import { todayDateString } from "@/lib/utils/timezone";
import { ProfileEngineIdentityCard } from "@/components/profile/ProfileEngineIdentityCard";
import { ProfileHomeCompact } from "@/components/profile/ProfileHomeCompact";
import { ProfileSnapshotFallback } from "@/components/profile/ProfileSnapshotFallback";
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

const ProfileEngineBehaviorTab = nextDynamic(
  () => import("@/components/profile/ProfileEngineBehaviorTab").then((m) => ({ default: m.ProfileEngineBehaviorTab })),
  { loading: () => null },
);
const ProfileEngineModesTab = nextDynamic(
  () => import("@/components/profile/ProfileEngineModesTab").then((m) => ({ default: m.ProfileEngineModesTab })),
  { loading: () => null },
);

export const dynamic = "force-dynamic";

const ENGINE_NAV: { id: ProfileEngineTabId; label: string }[] = [
  { id: "identity", label: "Identiteit" },
  { id: "behavior", label: "Gedrag" },
  { id: "modes", label: "Modi" },
];

function MainTabNavSimplified({ active }: { active: "home" | "engine" }) {
  const base =
    "rounded-xl px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide transition min-h-[44px] flex flex-1 items-center justify-center sm:flex-none outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0";
  const on =
    "border border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(var(--mode-rgb-deep),0.22)] text-[var(--semantic-accent)] shadow-[inset_0_1px_0_rgba(var(--mode-rgb),0.12)]";
  const off =
    "border border-transparent bg-[var(--bg-surface)]/20 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/35 hover:text-[var(--text-primary)]";
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Profiel navigatie">
      <Link href={profileHomeHref()} aria-current={active === "home" ? "page" : undefined} className={`${base} ${active === "home" ? on : off}`}>
        Profiel
      </Link>
      <Link href={profileEngineHref("identity")} aria-current={active === "engine" ? "page" : undefined} className={`${base} ${active === "engine" ? on : off}`}>
        Engine
      </Link>
    </nav>
  );
}

function EngineTabNav({ active }: { active: ProfileEngineTabId }) {
  const base =
    "rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0";
  const on =
    "border border-[rgba(var(--mode-rgb),0.26)] bg-[rgba(var(--mode-rgb-deep),0.18)] text-[var(--semantic-accent)]";
  const off = "border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/35 hover:text-[var(--text-primary)]";
  return (
    <nav className="sticky top-[calc(env(safe-area-inset-top,0px)+4px)] z-20 -mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Engine">
      {ENGINE_NAV.map(({ id, label }) => (
        <Link key={id} href={profileEngineHref(id)} aria-current={active === id ? "page" : undefined} className={`${base} ${active === id ? on : off}`}>
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

async function ProfileHomeAsync({ userId }: { userId: string }) {
  const today = todayDateString();
  const [prefs, xpCtx, todayDaily, dailyChallengeContext] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getXPFullContext(),
    getDailyState(today),
    getProfileDailyChallengeContext(today),
  ]);
  const { identity, insightState, forecast } = xpCtx;
  const moodLabel = (todayDaily as { mood_label?: string | null } | null)?.mood_label ?? null;
  const simplified = prefs.simplified_content === true;

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Profiel"
          hideTitleBar
          footerLinks={[
            { href: profileEngineHref("identity"), label: "Engine" },
            { href: "/settings", label: "Instellingen" },
            { href: "/dashboard", label: "HQ" },
          ]}
        >
          <div className="space-y-4">
            <MainTabNavSimplified active="home" />
            <ProfileHomeCompact
              identity={identity}
              insightState={insightState}
              forecast={forecast}
              initialMoodLabel={moodLabel}
              todayStr={today}
              dailyChallengeContext={dailyChallengeContext}
            />
          </div>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <ProfileCommandDeckLayout main="home">
      <ProfileHomeCompact
        identity={identity}
        insightState={insightState}
        forecast={forecast}
        initialMoodLabel={moodLabel}
        todayStr={today}
        dailyChallengeContext={dailyChallengeContext}
      />
    </ProfileCommandDeckLayout>
  );
}

async function ProfileEngineAsync({
  userEmail,
}: {
  userEmail: string;
}) {
  const [rawPrefs, behaviorProfile, studyPlan, accountabilitySettings] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getBehaviorProfile(),
    getStudyPlan(),
    getAccountabilitySettings(),
  ]);
  return { prefs: rawPrefs, behaviorProfile, studyPlan, accountabilitySettings, userEmail };
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
    return (
      <Suspense fallback={<ProfileSnapshotFallback main="home" />}>
        <ProfileHomeAsync userId={user.id} />
      </Suspense>
    );
  }

  const engineTab = parseProfileEngineTab(raw.engineTab ?? raw.settingsTab);
  const engine = await ProfileEngineAsync({ userEmail: user.email ?? "" });
  const prefs = engine.prefs;
  const behaviorProfile = engine.behaviorProfile;
  const studyPlan = engine.studyPlan;
  const accountabilitySettings = engine.accountabilitySettings;
  const simplified = prefs.simplified_content === true;

  const engineHint = (
    <p className="text-xs text-[var(--text-muted)]">
      Thema, push, budget en meer:{" "}
      <a
        href="/settings"
        className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
      >
        Instellingen
      </a>
      . Insights:{" "}
      <a
        href={reportInsightsHref("overview")}
        className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
      >
        Rapport
      </a>
      .
    </p>
  );

  const engineTabsAndPanels = (
    <>
      <EngineTabNav active={engineTab} />

      {engineTab === "identity" && (
        <ProfileEngineIdentityCard
          userEmail={engine.userEmail}
          behaviorProfile={behaviorProfile}
          displayCallsign={prefs.display_callsign ?? null}
          hqHeadline={prefs.hq_headline ?? null}
          greetingLocale={prefs.greeting_locale ?? "en"}
          selectedEmotion={prefs.selected_emotion}
          pushPersonalityMode={prefs.push_personality_mode ?? null}
          themeId={prefs.theme}
        />
      )}

      {engineTab === "behavior" && (
        <ProfileEngineBehaviorTab
          behaviorProfile={behaviorProfile}
          initialAutoMasterMissions={prefs.auto_master_missions}
          initialStudyPlan={studyPlan}
          initialAccountability={accountabilitySettings}
          initialDaysOff={prefs.usual_days_off ?? null}
          initialDayOffMode={prefs.day_off_mode === "hard" ? "hard" : "soft"}
        />
      )}

      {engineTab === "modes" && (
        <ProfileEngineModesTab initialSimplifiedContent={prefs.simplified_content} />
      )}
    </>
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Engine"
          hideTitleBar
          footerLinks={[
            { href: profileHomeHref(), label: "Profiel" },
            { href: "/settings", label: "Instellingen" },
            { href: "/dashboard", label: "HQ" },
          ]}
        >
          <div className="space-y-5">
            <MainTabNavSimplified active="engine" />
            {engineHint}
            {engineTabsAndPanels}
          </div>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <ProfileCommandDeckLayout main="engine">
      <div className="card-simple space-y-4 !rounded-xl p-4 md:p-5">
        {engineHint}
        {engineTabsAndPanels}
      </div>
    </ProfileCommandDeckLayout>
  );
}
