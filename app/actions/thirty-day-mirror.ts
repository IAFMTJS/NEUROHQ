"use server";

import { createClient } from "@/lib/supabase/server";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";

export type ThirtyDayMirror = {
  fitnessDone: number;
  fitnessTotal: number;
  focusRate: number | null;
  adminAvoidRate: number | null;
};

export async function getThirtyDayMirror(): Promise<ThirtyDayMirror> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fitnessDone: 0, fitnessTotal: 0, focusRate: null, adminAvoidRate: null };

  const profile = await getBehaviorProfile();

  const today = new Date();
  const since = new Date(today);
  since.setDate(today.getDate() - 30);
  const todayStr = today.toISOString().slice(0, 10);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("domain, completed, due_date, avoidance_tag")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .is("parent_task_id", null)
    .gte("due_date", sinceStr)
    .lte("due_date", todayStr);

  let fitnessDone = 0;
  let fitnessTotal = 0;
  let focusDone = 0;
  let focusTotal = 0;
  let adminTotal = 0;
  let adminCompleted = 0;

  for (const raw of tasks ?? []) {
    const t = raw as {
      domain?: string | null;
      completed?: boolean | null;
      avoidance_tag?: string | null;
    };
    const completed = !!t.completed;

    // Fitness ~ health-domein; extra gewicht als identiteit of hobby dit belangrijk maakt.
    if (t.domain === "health") {
      const weight =
        (profile.identityTargets.includes("fit_person") ? 1 : 0) +
        (profile.hobbyCommitment.fitness ?? 0);
      fitnessTotal += 1;
      if (completed) fitnessDone += 1;
    }

    // Focus ~ discipline-domein (voltooiingsgraad).
    if (t.domain === "discipline") {
      focusTotal += 1;
      if (completed) focusDone += 1;
    }

    // Administration avoidance via avoidance_tag.
    if (t.avoidance_tag === "administration") {
      adminTotal += 1;
      if (completed) adminCompleted += 1;
    }
  }

  const focusRate = focusTotal > 0 ? focusDone / focusTotal : null;
  const adminAvoidRate = adminTotal > 0 ? (adminTotal - adminCompleted) / adminTotal : null;

  return {
    fitnessDone,
    fitnessTotal,
    focusRate,
    adminAvoidRate,
  };
}

