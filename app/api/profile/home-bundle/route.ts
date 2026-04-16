import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getXPFullContext } from "@/app/actions/xp-context";
import { getDailyState } from "@/app/actions/daily-state";
import { getProfileDailyChallengeContext } from "@/app/actions/profile-daily-challenges";
import { todayDateString } from "@/lib/utils/timezone";
import type { ProfileHomeBundle } from "@/lib/profile-home-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = todayDateString();
    const [xpCtx, todayDaily, dailyChallengeContext] = await Promise.all([
      getXPFullContext(undefined, user.id),
      getDailyState(today),
      getProfileDailyChallengeContext(today),
    ]);
    const moodLabel = (todayDaily as { mood_label?: string | null } | null)?.mood_label ?? null;

    const out: ProfileHomeBundle = {
      userId: user.id,
      dateStr: today,
      moodLabel,
      identity: xpCtx.identity,
      insightState: xpCtx.insightState,
      forecast: xpCtx.forecast,
      dailyChallengeContext,
    };

    return NextResponse.json(out);
  } catch (err) {
    console.error("[API profile/home-bundle]", err);
    return NextResponse.json({ error: "Failed to load profile bundle" }, { status: 500 });
  }
}

