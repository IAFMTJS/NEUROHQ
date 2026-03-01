"use server";

import { createClient } from "@/lib/supabase/server";

type FunnelStepDef = {
  id: string;
  label: string;
};

export type WeeklyFunnelStep = {
  id: string;
  label: string;
  users: number;
  /** 0–1, conversie t.o.v. vorige stap; null = niet van toepassing. */
  conversionFromPrevious: number | null;
};

export type WeeklyFunnel = {
  weekStart: string;
  weekEnd: string;
  onboarding: WeeklyFunnelStep[];
  missions: WeeklyFunnelStep[];
};

const ONBOARDING_STEPS: FunnelStepDef[] = [
  { id: "signup_completed", label: "Sign‑up voltooid" },
  { id: "brain_status_saved", label: "Eerste check‑in" },
  { id: "task_created", label: "Eerste missie aangemaakt" },
  { id: "task_completed", label: "Eerste completion" },
  { id: "mission_chain_created", label: "Mission chain aangemaakt" },
];

const MISSION_STEPS: FunnelStepDef[] = [
  { id: "task_created", label: "Missie toegevoegd" },
  { id: "mission_started", label: "Missie gestart" },
  { id: "mission_completed", label: "Missie voltooid" },
];

// Map ruwe event-namen → funnel-stappen
const EVENT_TO_ONBOARDING_STEP: Record<string, string> = {
  signup_completed: "signup_completed",
  brain_status_saved: "brain_status_saved",
  task_created: "task_created",
  task_completed: "task_completed",
  mission_chain_created: "mission_chain_created",
  // Backwards compatible: mission_completed telt als completion in onboarding-funnel.
  mission_completed: "task_completed",
};

const EVENT_TO_MISSION_STEP: Record<string, string> = {
  task_created: "task_created",
  mission_started: "mission_started",
  mission_completed: "mission_completed",
};

function startOfWeekUtc(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 (Sun) – 6 (Sat)
  // Maandag als start van de week
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildStepsForWeek(
  defs: FunnelStepDef[],
  countsByStep: Map<string, Set<string>>
): WeeklyFunnelStep[] {
  const result: WeeklyFunnelStep[] = [];
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const current = countsByStep.get(def.id)?.size ?? 0;
    const prev = i === 0 ? 0 : countsByStep.get(defs[i - 1].id)?.size ?? 0;
    const conv =
      i === 0 || prev === 0
        ? null
        : Math.max(0, Math.min(1, current / prev));
    result.push({
      id: def.id,
      label: def.label,
      users: current,
      conversionFromPrevious: conv,
    });
  }
  return result;
}

/**
 * Simple weekly onboarding funnel:
 * - unieke users per stap (sign-up → check‑in → missie → completion → chain)
 * - conversiepercentages tussen stappen.
 *
 * Alleen beschikbaar voor admins (users.role === 'admin') om RLS te respecteren.
 */
export async function getAnalyticsFunnel(weeks: number = 8): Promise<WeeklyFunnel[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Check admin‑rol
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (userRow as { role?: string | null } | null)?.role ?? "user";
  if (role !== "admin") {
    // Geen toegang tot globale funnel – later uit te breiden met per‑user funnel.
    return [];
  }

  const allEventNames = Array.from(
    new Set([
      ...Object.keys(EVENT_TO_ONBOARDING_STEP),
      ...Object.keys(EVENT_TO_MISSION_STEP),
    ])
  );

  const today = new Date();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  const sinceStr = since.toISOString();

  const { data: events } = await supabase
    .from("analytics_events")
    .select("user_id, event_name, created_at")
    .in("event_name", allEventNames)
    .gte("created_at", sinceStr);

  if (!events?.length) return [];

  type Bucket = {
    onboarding: Map<string, Set<string>>;
    missions: Map<string, Set<string>>;
  };

  const byWeek = new Map<string, Bucket>();

  for (const row of events as { user_id: string; event_name: string; created_at: string }[]) {
    const eventDate = new Date(row.created_at);
    const weekStart = startOfWeekUtc(eventDate);

    let bucket = byWeek.get(weekStart);
    if (!bucket) {
      bucket = {
        onboarding: new Map(),
        missions: new Map(),
      };
      byWeek.set(weekStart, bucket);
    }

    const userId = row.user_id;
    const onboardingStep = EVENT_TO_ONBOARDING_STEP[row.event_name];
    if (onboardingStep) {
      const set =
        bucket.onboarding.get(onboardingStep) ?? new Set<string>();
      set.add(userId);
      bucket.onboarding.set(onboardingStep, set);
    }

    const missionStep = EVENT_TO_MISSION_STEP[row.event_name];
    if (missionStep) {
      const set =
        bucket.missions.get(missionStep) ?? new Set<string>();
      set.add(userId);
      bucket.missions.set(missionStep, set);
    }
  }

  const weeksSorted = Array.from(byWeek.keys()).sort();

  return weeksSorted.map((weekStart) => {
    const bucket = byWeek.get(weekStart)!;
    const weekEnd = addDays(weekStart, 6);

    const onboarding = buildStepsForWeek(ONBOARDING_STEPS, bucket.onboarding);
    const missions = buildStepsForWeek(MISSION_STEPS, bucket.missions);

    return {
      weekStart,
      weekEnd,
      onboarding,
      missions,
    };
  });
}

