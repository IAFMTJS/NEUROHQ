/**
 * Dark Commander Intelligence Core - Finance XP Integration
 * Links financial discipline to XP and achievements
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { addXP } from "@/app/actions/xp";
import { checkAndUnlockAchievements } from "./achievements";
import type { FinanceState } from "@/lib/dcic/types";
import { calculateDisciplineScore } from "@/lib/dcic/finance-engine";

/**
 * Awards XP based on financial discipline score
 */
export async function awardFinanceXP(financeState: FinanceState): Promise<void> {
  const score = financeState.disciplineScore;

  // Award XP based on discipline score
  // 80-100: 20 XP
  // 60-79: 10 XP
  // 40-59: 5 XP
  // Below 40: 0 XP

  if (score >= 80) {
    await addXP(20);
  } else if (score >= 60) {
    await addXP(10);
  } else if (score >= 40) {
    await addXP(5);
  }

  // Check for financial achievements
  const { getGameState } = await import("./game-state");
  const gameState = await getGameState();
  if (!gameState) return;

  // Financial discipline achievements
  if (score >= 90 && !gameState.achievements.financialMaster) {
    await checkAndUnlockAchievements({
      level: gameState.level,
      streak: gameState.streak.current,
      missionsCompleted: gameState.missions.filter((m) => m.completed).length,
    });
  }
}

/**
 * Updates financial discipline score and awards XP
 */
export async function updateFinancialDiscipline(financeState: FinanceState): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const score = calculateDisciplineScore(financeState);
  const today = new Date().toISOString().split("T")[0];

  // Save score history
  await supabase.from("financial_discipline_score").upsert({
    user_id: user.id,
    score,
    date: today,
  }, {
    onConflict: "user_id,date",
  });

  // Award XP
  await awardFinanceXP(financeState);
}
