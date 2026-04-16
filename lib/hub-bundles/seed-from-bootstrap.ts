"use client";

import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";
import { createClient } from "@/lib/supabase/client";
import { setHubBundle } from "@/lib/hub-bundles/db";
import type { ProfileHomeBundle } from "@/lib/profile-home-types";

/**
 * Best-effort seeding of per-page bundles from the already-fetched `/api/bootstrap/today` payload.
 *
 * This runs on the client, after bootstrap init succeeds. It is intentionally tolerant:
 * if session/user is not ready yet (cold storage race), we just skip.
 */
export async function seedHubBundlesFromBootstrapToday(
  bootstrap: BootstrapTodayResponse | null | undefined
): Promise<void> {
  if (!bootstrap || typeof window === "undefined") return;
  const dateStr = typeof bootstrap.date === "string" ? bootstrap.date : null;
  if (!dateStr) return;

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const userId = session?.user?.id ?? null;
  if (!userId) return;

  // Tasks: bootstrap includes tasks and completedToday.
  if (bootstrap.tasks || bootstrap.completedToday) {
    await setHubBundle("tasks", userId, dateStr, {
      dateStr,
      payload: {
        tasks: bootstrap.tasks ?? null,
        completedToday: bootstrap.completedToday ?? null,
        missionsPipeline: bootstrap.missionsPipeline ?? null,
        dailyState: bootstrap.dailyState ?? null,
        energyBudget: bootstrap.energyBudget ?? null,
      },
    });
  }

  // Budget: bootstrap includes a budget snapshot (summary-level).
  if (bootstrap.budget) {
    await setHubBundle("budget", userId, dateStr, {
      dateStr,
      payload: bootstrap.budget,
    });
  }

  // Dashboard: not used yet (Dashboard has its own cache); seed for future symmetry.
  if (bootstrap.dashboard) {
    await setHubBundle("dashboard", userId, dateStr, {
      dateStr,
      payload: bootstrap.dashboard,
    });
  }

  // Profile home: bootstrap doesn't contain XP/forecast/etc today, so no seeding here.
  // Keep placeholder to make the behavior explicit.
  void (null as unknown as ProfileHomeBundle);
}

