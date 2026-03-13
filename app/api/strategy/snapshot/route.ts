import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { getQuarterlyStrategy, getStrategyCompletion } from "@/app/actions/strategy";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [strategy, completion] = await Promise.all([
      getQuarterlyStrategy(),
      getStrategyCompletion(),
    ]);

    const today = todayDateString();

    return NextResponse.json(
      {
        today,
        // Keep payload generic so StrategySnapshot can evolve without changing the API contract.
        payload: {
          strategy,
          completion,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[API strategy/snapshot]", err);
    return NextResponse.json(
      { error: "Failed to load strategy snapshot" },
      { status: 500 },
    );
  }
}

