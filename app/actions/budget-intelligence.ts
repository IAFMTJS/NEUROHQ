"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addXP } from "@/app/actions/xp";

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function getUserIdOrThrow(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function autoTuneBudgetPolicyFromSurveys(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: surveys } = await (supabase as any)
    .from("payday_reflection_surveys")
    .select("answers, survey_date")
    .eq("user_id", userId)
    .gte("survey_date", isoDate(-120))
    .order("survey_date", { ascending: false })
    .limit(12);
  const reasonCounts = new Map<string, number>();
  for (const survey of (surveys ?? []) as { answers?: { primary_reason?: string } | null }[]) {
    const reason = survey?.answers?.primary_reason;
    if (!reason) continue;
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const topReason = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!topReason || topReason[1] < 2) return;
  const [reason] = topReason;
  const { data: userRow } = await supabase
    .from("users")
    .select("impulse_threshold_pct, impulse_quick_add_minutes, impulse_risk_categories")
    .eq("id", userId)
    .single();
  if (!userRow) return;
  const currentThreshold = (userRow.impulse_threshold_pct as number | null) ?? 40;
  const currentQuickAdd = (userRow.impulse_quick_add_minutes as number | null) ?? 5;
  const currentRisk = Array.isArray(userRow.impulse_risk_categories)
    ? (userRow.impulse_risk_categories as string[])
    : [];
  let nextThreshold = currentThreshold;
  let nextQuickAdd = currentQuickAdd;
  const nextRisk = new Set(currentRisk);
  if (reason === "impulse") {
    nextThreshold = Math.max(20, currentThreshold - 5);
    nextQuickAdd = Math.min(20, currentQuickAdd + 2);
    nextRisk.add("Uit eten");
    nextRisk.add("Overig");
  } else if (reason === "social") {
    nextRisk.add("Uit eten");
    nextRisk.add("Vervoer");
  } else if (reason === "unexpected") {
    nextThreshold = Math.max(25, currentThreshold - 2);
    nextRisk.add("Gezondheid");
  } else if (reason === "underestimated") {
    nextThreshold = Math.min(55, currentThreshold + 3);
  }
  const riskCategories = Array.from(nextRisk);
  await supabase
    .from("users")
    .update({
      impulse_threshold_pct: nextThreshold,
      impulse_quick_add_minutes: nextQuickAdd,
      impulse_risk_categories: riskCategories,
    })
    .eq("id", userId);
  await (supabase as any).from("budget_training_logs").insert({
    user_id: userId,
    log_type: "budget_policy_auto_tuned",
    payload: {
      reason,
      nextThreshold,
      nextQuickAdd,
      riskCategories,
    },
  });
}

export async function getBudgetControlState(): Promise<{
  lockActive: boolean;
  lockUntil: string | null;
  needsPaydaySurvey: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { lockActive: false, lockUntil: null, needsPaydaySurvey: false };

  const today = isoDate();
  const [{ data: lock }, { data: settings }, { data: survey }] = await Promise.all([
    (supabase as any)
      .from("budget_control_locks")
      .select("id, lock_until")
      .eq("user_id", user.id)
      .eq("active", true)
      .gte("lock_until", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("users")
      .select("last_payday_date, payday_day_of_month")
      .eq("id", user.id)
      .single(),
    (supabase as any)
      .from("payday_reflection_surveys")
      .select("id, survey_date")
      .eq("user_id", user.id)
      .gte("survey_date", isoDate(-31))
      .order("survey_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lockUntil = (lock as { lock_until?: string | null } | null)?.lock_until ?? null;
  const lockActive = !!lockUntil;

  const todayDate = new Date(today + "T12:00:00Z");
  const paydayDay = Math.max(1, Math.min(28, (settings?.payday_day_of_month as number | null) ?? 25));
  const nextPayday = new Date(todayDate);
  nextPayday.setUTCDate(paydayDay);
  if (nextPayday < todayDate) nextPayday.setUTCMonth(nextPayday.getUTCMonth() + 1);
  const daysToPayday = Math.ceil((nextPayday.getTime() - todayDate.getTime()) / 86400000);
  const hasRecentSurvey = !!survey;
  const needsPaydaySurvey = daysToPayday <= 4 && !hasRecentSurvey;

  return { lockActive, lockUntil, needsPaydaySurvey };
}

export async function setBudgetNoSpendLock(params: {
  days: number;
  reason: string;
}): Promise<void> {
  const userId = await getUserIdOrThrow();
  const supabase = await createClient();
  const days = Math.max(1, Math.min(7, Math.floor(params.days)));
  const lockUntil = isoDate(days);
  await (supabase as any).from("budget_control_locks").insert({
    user_id: userId,
    lock_from: isoDate(),
    lock_until: lockUntil,
    reason: params.reason.slice(0, 240),
    active: true,
  });
  await (supabase as any).from("budget_training_logs").insert({
    user_id: userId,
    log_type: "budget_lock_created",
    payload: { days, reason: params.reason.slice(0, 240), lockUntil },
  });
  revalidatePath("/budget");
}

export async function submitEmergencyExpenseReason(params: {
  amountCents: number;
  category: string;
  reason: string;
}): Promise<void> {
  const userId = await getUserIdOrThrow();
  const supabase = await createClient();
  await (supabase as any).from("budget_emergency_expense_logs").insert({
    user_id: userId,
    date: isoDate(),
    amount_cents: Math.max(0, Math.floor(params.amountCents)),
    category: params.category.slice(0, 60),
    reason: params.reason.slice(0, 500),
  });
  await (supabase as any).from("budget_training_logs").insert({
    user_id: userId,
    log_type: "emergency_expense_reason",
    payload: {
      amountCents: Math.max(0, Math.floor(params.amountCents)),
      category: params.category.slice(0, 60),
      reason: params.reason.slice(0, 500),
    },
  });
}

export async function submitPaydayReflectionSurvey(params: {
  primaryReason: string;
  trigger: string;
  confidence: number;
  note?: string;
}): Promise<void> {
  const userId = await getUserIdOrThrow();
  const supabase = await createClient();
  const payload = {
    primary_reason: params.primaryReason.slice(0, 120),
    trigger: params.trigger.slice(0, 120),
    confidence: Math.max(1, Math.min(5, Math.floor(params.confidence))),
    note: (params.note ?? "").slice(0, 600),
  };
  await (supabase as any).from("payday_reflection_surveys").insert({
    user_id: userId,
    survey_date: isoDate(),
    answers: payload,
  });
  await (supabase as any).from("budget_training_logs").insert({
    user_id: userId,
    log_type: "payday_reflection_survey",
    payload,
  });
  await autoTuneBudgetPolicyFromSurveys(userId);
  revalidatePath("/budget");
}

export async function getBudgetOptimizationSuggestions(): Promise<{
  summary: string;
  suggestions: string[];
  challenges: Array<{ key: string; label: string; xp: number; description: string }>;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      summary: "Log eerst uitgaven om optimalisaties te berekenen.",
      suggestions: [],
      challenges: [
        {
          key: "grocery_minus_10",
          label: "Boodschappen -10% volgende periode",
          xp: 400,
          description: "Vergelijk laatste 30 dagen met de 30 dagen ervoor.",
        },
        {
          key: "unplanned_under_20pct",
          label: "Ongepland < 20% (laatste 14 dagen)",
          xp: 250,
          description: "Houd ongeplande uitgaven laag voor meer voorspelbaarheid.",
        },
      ],
    };
  }
  const [{ data: entries }, { data: surveys }] = await Promise.all([
    supabase
    .from("budget_entries")
    .select("amount_cents, category, date")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", isoDate(-30)),
    (supabase as any)
      .from("payday_reflection_surveys")
      .select("answers, survey_date")
      .eq("user_id", user.id)
      .gte("survey_date", isoDate(-120))
      .order("survey_date", { ascending: false })
      .limit(12),
  ]);
  const rows = (entries ?? []) as { amount_cents: number; category: string | null }[];
  const byCat = rows.reduce((acc, row) => {
    const key = (row.category ?? "Other").trim() || "Other";
    acc[key] = (acc[key] ?? 0) + Math.abs(row.amount_cents);
    return acc;
  }, {} as Record<string, number>);
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const suggestions = topCats.map(([cat, amount]) => {
    const monthly = (amount / 100).toFixed(2);
    return `${cat}: heralloceer ~10% (${monthly}) naar buffer/sparen of strakker dagbudget.`;
  });
  const reasonCounts = new Map<string, number>();
  for (const survey of (surveys ?? []) as { answers?: { primary_reason?: string } | null }[]) {
    const reason = survey?.answers?.primary_reason;
    if (!reason) continue;
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const topReason = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topReason) {
    const [reason, count] = topReason;
    if (reason === "impulse") {
      suggestions.push(`Patroon uit surveys: impulsaankopen (${count}x). Activeer standaard 24u no-spend lock op risicodagen.`);
    } else if (reason === "unexpected") {
      suggestions.push(`Patroon uit surveys: onverwachte kosten (${count}x). Heralloceer 5-10% naar noodbuffer categorie.`);
    } else if (reason === "underestimated") {
      suggestions.push(`Patroon uit surveys: budget onderschat (${count}x). Verhoog relevante categoriecaps met 8-12%.`);
    } else if (reason === "social") {
      suggestions.push(`Patroon uit surveys: sociale druk (${count}x). Zet limiet + reminder op sociale uitgaven in weekenden.`);
    }
  }
  await autoTuneBudgetPolicyFromSurveys(user.id);
  return {
    summary:
      topCats.length > 0
        ? "Topcategorieen van de laatste 30 dagen + surveypatronen geanalyseerd."
        : "Nog te weinig uitgaven voor sterke optimalisaties.",
    suggestions,
    challenges: [
      {
        key: "grocery_minus_10",
        label: "Boodschappen -10% volgende periode",
        xp: 400,
        description: "Vergelijk laatste 30 dagen met de 30 dagen ervoor.",
      },
      {
        key: "unplanned_under_20pct",
        label: "Ongepland < 20% (laatste 14 dagen)",
        xp: 250,
        description: "Houd ongeplande uitgaven laag voor meer voorspelbaarheid.",
      },
    ],
  };
}

export async function completeBudgetOptimizationChallenge(challengeKey: string): Promise<{ awardedXp: number }> {
  const userId = await getUserIdOrThrow();
  const supabase = await createClient();
  const today = isoDate();
  const { data: existing } = await (supabase as any)
    .from("budget_optimization_challenges")
    .select("id")
    .eq("user_id", userId)
    .eq("challenge_key", challengeKey)
    .eq("status", "completed")
    .gte("completed_at", today + "T00:00:00Z")
    .limit(1)
    .maybeSingle();
  if (existing) return { awardedXp: 0 };
  const awardedXp = challengeKey === "grocery_minus_10" ? 400 : 250;
  await (supabase as any).from("budget_optimization_challenges").insert({
    user_id: userId,
    challenge_key: challengeKey,
    status: "completed",
    completed_at: new Date().toISOString(),
    reward_xp: awardedXp,
  });
  await addXP(awardedXp, { source_type: `budget_optimization:${challengeKey}` });
  await (supabase as any).from("budget_training_logs").insert({
    user_id: userId,
    log_type: "budget_optimization_completed",
    payload: { challengeKey, awardedXp },
  });
  revalidatePath("/budget");
  return { awardedXp };
}

export async function autoAwardBudgetOptimizationForCurrentUser(): Promise<{
  awarded: Array<{ challengeKey: string; awardedXp: number }>;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { awarded: [] };
  const awarded: Array<{ challengeKey: string; awardedXp: number }> = [];
  const grocery = await validateAndCompleteBudgetOptimizationChallenge("grocery_minus_10");
  if (grocery.awardedXp > 0) {
    awarded.push({ challengeKey: "grocery_minus_10", awardedXp: grocery.awardedXp });
  }
  const unplanned = await validateAndCompleteBudgetOptimizationChallenge("unplanned_under_20pct");
  if (unplanned.awardedXp > 0) {
    awarded.push({ challengeKey: "unplanned_under_20pct", awardedXp: unplanned.awardedXp });
  }
  return { awarded };
}

export async function validateAndCompleteBudgetOptimizationChallenge(
  challengeKey: string
): Promise<{ awardedXp: number; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { awardedXp: 0, message: "Niet ingelogd." };

  if (challengeKey !== "grocery_minus_10") {
    if (challengeKey === "unplanned_under_20pct") {
      const from = isoDate(-14);
      const to = isoDate();
      const { data: entries } = await supabase
        .from("budget_entries")
        .select("is_planned, amount_cents, date")
        .eq("user_id", user.id)
        .lt("amount_cents", 0)
        .gte("date", from)
        .lte("date", to);
      const rows = (entries ?? []) as Array<{ is_planned?: boolean | null; amount_cents: number }>;
      if (rows.length === 0) {
        return {
          awardedXp: 0,
          message:
            "Nog geen uitgaven gelogd in de laatste 14 dagen. Blijf loggen — dan kunnen we deze challenge valideren.",
        };
      }
      if (rows.length < 8) {
        return {
          awardedXp: 0,
          message:
            "Nog weinig transacties voor een harde meting — log een paar dagen door, dan wordt dit betrouwbaar.",
        };
      }
      const total = rows.reduce((sum, r) => sum + Math.abs(r.amount_cents), 0);
      const unplanned = rows
        .filter((r) => r.is_planned === false)
        .reduce((sum, r) => sum + Math.abs(r.amount_cents), 0);
      const ratio = total > 0 ? unplanned / total : 1;
      if (ratio > 0.2) {
        return {
          awardedXp: 0,
          message: `Nog niet behaald: ongepland aandeel is ${Math.round(ratio * 100)}% (doel < 20%).`,
        };
      }
      const result = await completeBudgetOptimizationChallenge(challengeKey);
      return {
        awardedXp: result.awardedXp,
        message:
          result.awardedXp > 0
            ? `Challenge behaald: ongepland aandeel ${Math.round(ratio * 100)}%. XP toegekend.`
            : "Challenge al verwerkt.",
      };
    }
    const result = await completeBudgetOptimizationChallenge(challengeKey);
    return {
      awardedXp: result.awardedXp,
      message: result.awardedXp > 0 ? "Challenge gevalideerd en XP toegekend." : "Challenge al verwerkt.",
    };
  }

  const now = new Date();
  const currentFrom = new Date(now);
  currentFrom.setUTCDate(currentFrom.getUTCDate() - 30);
  const prevFrom = new Date(now);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - 60);
  const currentFromStr = currentFrom.toISOString().slice(0, 10);
  const prevFromStr = prevFrom.toISOString().slice(0, 10);
  const nowStr = now.toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("budget_entries")
    .select("amount_cents, category, date")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .eq("category", "Boodschappen")
    .gte("date", prevFromStr)
    .lte("date", nowStr);

  const rows = (entries ?? []) as { amount_cents: number; date: string }[];
  const currentTotal = rows
    .filter((r) => r.date >= currentFromStr)
    .reduce((sum, r) => sum + Math.abs(r.amount_cents), 0);
  const prevTotal = rows
    .filter((r) => r.date < currentFromStr)
    .reduce((sum, r) => sum + Math.abs(r.amount_cents), 0);

  if (prevTotal <= 0) {
    return { awardedXp: 0, message: "Nog onvoldoende historische data om 10% reductie te valideren." };
  }
  const ratio = currentTotal / prevTotal;
  if (ratio > 0.9) {
    return {
      awardedXp: 0,
      message: `Challenge nog niet behaald: huidige periode zit op ${Math.round(ratio * 100)}% van vorige periode.`,
    };
  }
  const result = await completeBudgetOptimizationChallenge(challengeKey);
  return {
    awardedXp: result.awardedXp,
    message:
      result.awardedXp > 0
        ? `Challenge behaald (${Math.round(ratio * 100)}% vs vorige periode). XP toegekend.`
        : "Challenge al verwerkt.",
  };
}

export async function applyBudgetOptimizationLock(days: number): Promise<{ lockUntil: string }> {
  const safeDays = Math.max(1, Math.min(7, Math.floor(days)));
  await setBudgetNoSpendLock({
    days: safeDays,
    reason: safeDays >= 3 ? "Optimization reset window" : "Optimization focus window",
  });
  return { lockUntil: isoDate(safeDays) };
}

