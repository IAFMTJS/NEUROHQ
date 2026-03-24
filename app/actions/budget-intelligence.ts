"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addXP } from "@/app/actions/xp";
import { calendarQuarterBounds, normalizeStrategyEngineParams } from "@/lib/strategy/engine-params";
import { getFinancialInsightsSafe } from "@/app/actions/dcic/finance-state";

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

/** Budget lock events this calendar quarter (for strategy engine cap). */
export async function countBudgetLocksThisQuarter(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const today = isoDate();
  const { start, end } = calendarQuarterBounds(today);
  const { count } = await (supabase as any)
    .from("budget_control_locks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("lock_from", start)
    .lte("lock_from", end);
  return count ?? 0;
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
  /** ISO instant when lock ends; use for countdown. */
  lockUntilAt: string | null;
  needsPaydaySurvey: boolean;
  /** Days until next expected payday (cycle marker for urgency UX). */
  daysToPayday: number | null;
  /** Recent pre-payday survey found in the last 31 days. */
  hasRecentSurvey: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      lockActive: false,
      lockUntil: null,
      lockUntilAt: null,
      needsPaydaySurvey: false,
      daysToPayday: null,
      hasRecentSurvey: false,
    };
  }

  const today = isoDate();
  const nowIso = new Date().toISOString();
  const [{ data: lock }, { data: settings }, { data: survey }] = await Promise.all([
    (supabase as any)
      .from("budget_control_locks")
      .select("id, lock_until, lock_until_at")
      .eq("user_id", user.id)
      .eq("active", true)
      .gt("lock_until_at", nowIso)
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

  const lockRow = lock as { lock_until?: string | null; lock_until_at?: string | null } | null;
  const lockUntil = lockRow?.lock_until ?? null;
  const lockUntilAt = lockRow?.lock_until_at ?? null;
  const lockActive = !!lockUntilAt;

  const todayDate = new Date(today + "T12:00:00Z");
  const paydayDay = Math.max(1, Math.min(28, (settings?.payday_day_of_month as number | null) ?? 25));
  const nextPayday = new Date(todayDate);
  nextPayday.setUTCDate(paydayDay);
  if (nextPayday < todayDate) nextPayday.setUTCMonth(nextPayday.getUTCMonth() + 1);
  const daysToPayday = Math.ceil((nextPayday.getTime() - todayDate.getTime()) / 86400000);
  const hasRecentSurvey = !!survey;
  const needsPaydaySurvey = daysToPayday <= 4 && !hasRecentSurvey;

  return {
    lockActive,
    lockUntil,
    lockUntilAt,
    needsPaydaySurvey,
    daysToPayday,
    hasRecentSurvey,
  };
}

export async function setBudgetNoSpendLock(params: {
  days: number;
  reason: string;
  /** Exact unlock instant (ISO). When set, overrides end-of-day from `days`. */
  lockUntilAtIso?: string;
  /** Auto safety-locks may bypass strategy quota limits. */
  bypassStrategyCap?: boolean;
}): Promise<void> {
  const userId = await getUserIdOrThrow();
  const supabase = await createClient();

  if (!params.bypassStrategyCap) {
    const { data: sfRow } = await supabase
      .from("strategy_focus")
      .select("engine_params")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    const maxLocks = normalizeStrategyEngineParams(
      (sfRow as { engine_params?: unknown } | null)?.engine_params
    ).budget.maxLocksPerQuarter;
    const used = await countBudgetLocksThisQuarter();
    if (maxLocks > 0 && used >= maxLocks) {
      throw new Error(
        `Strategie-limiet: max ${maxLocks} budget-lock(s) dit kwartaal (${used} gebruikt). Pas aan op Strategy of wacht tot het volgende kwartaal.`
      );
    }
  }

  const days = Math.max(1, Math.min(7, Math.floor(params.days)));
  let lockUntilAt: Date;
  let lockUntilYmd: string;

  if (params.lockUntilAtIso) {
    lockUntilAt = new Date(params.lockUntilAtIso);
    if (Number.isNaN(lockUntilAt.getTime())) {
      throw new Error("Ongeldige eindtijd.");
    }
    if (lockUntilAt.getTime() <= Date.now()) {
      throw new Error("Eindtijd moet in de toekomst liggen.");
    }
    const maxEnd = new Date();
    maxEnd.setDate(maxEnd.getDate() + 8);
    if (lockUntilAt.getTime() > maxEnd.getTime()) {
      throw new Error("Lock maximaal ongeveer 7 dagen.");
    }
    lockUntilYmd = lockUntilAt.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  } else {
    lockUntilYmd = isoDate(days);
    lockUntilAt = new Date(`${lockUntilYmd}T23:59:59.999Z`);
  }

  await (supabase as any).from("budget_control_locks").insert({
    user_id: userId,
    lock_from: isoDate(),
    lock_until: lockUntilYmd,
    lock_until_at: lockUntilAt.toISOString(),
    reason: params.reason.slice(0, 240),
    active: true,
  });
  await (supabase as any).from("budget_training_logs").insert({
    user_id: userId,
    log_type: "budget_lock_created",
    payload: {
      days,
      reason: params.reason.slice(0, 240),
      lockUntil: lockUntilYmd,
      lockUntilAt: lockUntilAt.toISOString(),
    },
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
  function toMonthKey(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function monthKeyOffset(base: Date, offsetMonths: number): string {
    return toMonthKey(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offsetMonths, 1, 12)));
  }

  function pctLabel(value: number): string {
    return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
  }

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
  const now = new Date();
  const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4, 1, 12));
  const historyStartStr = historyStart.toISOString().slice(0, 10);
  const [{ data: entries }, { data: surveys }, financialInsights] = await Promise.all([
    supabase
    .from("budget_entries")
    .select("amount_cents, category, date")
    .eq("user_id", user.id)
    .lt("amount_cents", 0)
    .gte("date", historyStartStr),
    (supabase as any)
      .from("payday_reflection_surveys")
      .select("answers, survey_date")
      .eq("user_id", user.id)
      .gte("survey_date", isoDate(-120))
      .order("survey_date", { ascending: false })
      .limit(12),
    getFinancialInsightsSafe(),
  ]);
  const rows = (entries ?? []) as { amount_cents: number; category: string | null; date: string }[];
  const currentMonthKey = monthKeyOffset(now, 0);
  const prevMonthKey = monthKeyOffset(now, -1);
  const prev2MonthKey = monthKeyOffset(now, -2);
  const prev3MonthKey = monthKeyOffset(now, -3);

  const rowsLast30 = rows.filter((r) => r.date >= isoDate(-30));
  const byCat = rowsLast30.reduce((acc, row) => {
    const key = (row.category ?? "Other").trim() || "Other";
    acc[key] = (acc[key] ?? 0) + Math.abs(row.amount_cents);
    return acc;
  }, {} as Record<string, number>);
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const suggestions = topCats.map(([cat, amount]) => {
    const monthly = (amount / 100).toFixed(2);
    return `${cat}: heralloceer ~10% (${monthly}) naar buffer/sparen of strakker dagbudget.`;
  });

  const byMonthTotals = new Map<string, number>();
  const byMonthCategory = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const monthKey = row.date.slice(0, 7);
    const amount = Math.abs(row.amount_cents);
    const category = (row.category ?? "Other").trim() || "Other";
    byMonthTotals.set(monthKey, (byMonthTotals.get(monthKey) ?? 0) + amount);
    const categoryMap = byMonthCategory.get(monthKey) ?? {};
    categoryMap[category] = (categoryMap[category] ?? 0) + amount;
    byMonthCategory.set(monthKey, categoryMap);
  }

  const currentMonthTotal = byMonthTotals.get(currentMonthKey) ?? 0;
  const prevMonthTotal = byMonthTotals.get(prevMonthKey) ?? 0;
  const prev2MonthTotal = byMonthTotals.get(prev2MonthKey) ?? 0;
  const prev3MonthTotal = byMonthTotals.get(prev3MonthKey) ?? 0;
  const baselineCandidates = [prevMonthTotal, prev2MonthTotal, prev3MonthTotal].filter((v) => v > 0);
  const baselineAvg =
    baselineCandidates.length > 0
      ? Math.round(baselineCandidates.reduce((sum, v) => sum + v, 0) / baselineCandidates.length)
      : 0;

  if (prevMonthTotal > 0) {
    const monthTrend = (currentMonthTotal - prevMonthTotal) / prevMonthTotal;
    if (monthTrend >= 0.12) {
      suggestions.push(
        `Maandtrend: totale uitgaven ${pctLabel(monthTrend)} t.o.v. vorige maand. Plan nu 2 low-spend dagen om de trend te breken.`
      );
    } else if (monthTrend <= -0.1) {
      suggestions.push(
        `Sterke verbetering: uitgaven ${pctLabel(monthTrend)} t.o.v. vorige maand. Behoud dit ritme en schuif het verschil naar je buffer.`
      );
    }
  }

  if (baselineAvg > 0 && currentMonthTotal > baselineAvg * 1.15) {
    const overshootPct = (currentMonthTotal - baselineAvg) / baselineAvg;
    suggestions.push(
      `Je zit ${pctLabel(overshootPct)} boven je 3-maands baseline. Verlaag caps in je topcategorieen met 8-12% voor de rest van de cyclus.`
    );
  }

  const currentMonthCategories = byMonthCategory.get(currentMonthKey) ?? {};
  const prevMonthCategories = byMonthCategory.get(prevMonthKey) ?? {};
  let risingCategory: { category: string; pct: number; current: number; previous: number } | null = null;
  for (const [category, currentValue] of Object.entries(currentMonthCategories)) {
    const previousValue = prevMonthCategories[category] ?? 0;
    if (previousValue <= 0 || currentValue < 2000) continue;
    const pct = (currentValue - previousValue) / previousValue;
    if (pct < 0.18) continue;
    if (!risingCategory || pct > risingCategory.pct) {
      risingCategory = { category, pct, current: currentValue, previous: previousValue };
    }
  }
  if (risingCategory) {
    suggestions.push(
      `${risingCategory.category} stijgt ${pctLabel(risingCategory.pct)} vs vorige maand. Zet hier een tijdelijke cap + reminder op piekdagen.`
    );
  }

  const forecast = financialInsights?.forecast;
  if (forecast && forecast.projectedBalance < 0) {
    suggestions.push(
      `Forecast: als je tempo gelijk blijft, eindig je met ongeveer EUR ${(Math.abs(forecast.projectedBalance) / 100).toFixed(0)} tekort. Verlaag je burn-rate vandaag met 10-15%.`
    );
  } else if (forecast && forecast.projectedBalance > 0) {
    suggestions.push(
      `Forecast: je ligt op koers voor een positief cyclussaldo van ~EUR ${(forecast.projectedBalance / 100).toFixed(0)}. Plan dit direct als buffer/savings-transfer.`
    );
  }

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
  const monthCoverage = [currentMonthTotal, prevMonthTotal, prev2MonthTotal, prev3MonthTotal].filter((v) => v > 0).length;
  const summaryParts: string[] = [];
  if (topCats.length > 0) summaryParts.push("Topcategorieen laatste 30 dagen");
  if (monthCoverage >= 2) summaryParts.push("maand-op-maand trendanalyse");
  if (forecast) summaryParts.push("cyclus-forecast");
  return {
    summary: summaryParts.length > 0
      ? `${summaryParts.join(" + ")} geanalyseerd.`
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

export async function applyBudgetOptimizationLock(days: number): Promise<{ lockUntil: string; lockUntilAt: string }> {
  const safeDays = Math.max(1, Math.min(7, Math.floor(days)));
  const lockUntilYmd = isoDate(safeDays);
  const lockUntilAtIso = new Date(`${lockUntilYmd}T23:59:59.999Z`).toISOString();
  await setBudgetNoSpendLock({
    days: safeDays,
    reason: safeDays >= 3 ? "Optimization reset window" : "Optimization focus window",
    lockUntilAtIso,
  });
  return { lockUntil: lockUntilYmd, lockUntilAt: lockUntilAtIso };
}

