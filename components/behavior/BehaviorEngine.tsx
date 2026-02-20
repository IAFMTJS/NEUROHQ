"use client";

import { useEffect, useState } from "react";
import { 
  getBehaviorState, 
  getStudyPlan, 
  checkInactivity,
  updateBookSelectionStatus 
} from "@/app/actions/behavior";
import { InactivityWarning } from "./InactivityWarning";
import { LearningPathLock } from "./LearningPathLock";
import { FailureIntervention } from "./FailureIntervention";
import { WeeklyReport } from "./WeeklyReport";
import { AICoach } from "./AICoach";
import { getWeeklyMinutes, getWeeklyLearningTarget } from "@/app/actions/learning";
import { getXP } from "@/app/actions/xp";
import { getWeekBounds } from "@/lib/utils/learning";

interface BehaviorEngineProps {
  hasMonthlyBook: boolean;
  /** When true, user has at least one education option (path) – lock hides too */
  hasEducationOptions?: boolean;
  /** When true, user has set a study plan (daily goal etc.) – lock hides too */
  hasStudyPlan?: boolean;
  currentStreak: number;
  previousStreak?: number;
}

export function BehaviorEngine({ 
  hasMonthlyBook, 
  hasEducationOptions = false,
  hasStudyPlan = false,
  currentStreak,
  previousStreak 
}: BehaviorEngineProps) {
  const [showFailureIntervention, setShowFailureIntervention] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyData, setWeeklyData] = useState<{
    weekStart: string;
    weekEnd: string;
    totalMinutes: number;
    missionsCompleted: number;
    streakStatus: number;
    rankProgress?: number;
  } | null>(null);

  useEffect(() => {
    // Check for streak break
    if (previousStreak !== undefined && previousStreak > 0 && currentStreak === 0) {
      setShowFailureIntervention(true);
    }

    // Check if it's Sunday (weekly report day)
    const today = new Date();
    const isSunday = today.getDay() === 0;
    
    if (isSunday) {
      loadWeeklyReport();
    }
  }, [currentStreak, previousStreak]);

  useEffect(() => {
    // Update book selection status
    updateBookSelectionStatus(hasMonthlyBook).catch((err) => {
      console.error("Failed to update book selection status:", err);
    });
  }, [hasMonthlyBook]);

  const loadWeeklyReport = async () => {
    try {
      const today = new Date();
      const { start, end } = getWeekBounds(today);
      const [minutes, target, streak, xp] = await Promise.all([
        getWeeklyMinutes(start, end),
        getWeeklyLearningTarget(),
        Promise.resolve(currentStreak),
        getXP(),
      ]);

      setWeeklyData({
        weekStart: start,
        weekEnd: end,
        totalMinutes: minutes,
        missionsCompleted: 0, // TODO: Get from tasks
        streakStatus: streak,
        rankProgress: xp.level,
      });
      setShowWeeklyReport(true);
    } catch (err) {
      console.error("Failed to load weekly report:", err);
      // Silently fail - don't show report if data can't be loaded
    }
  };

  return (
    <>
      <InactivityWarning />
      <LearningPathLock hasBook={hasMonthlyBook || hasEducationOptions || hasStudyPlan} />
      <AICoach />
      {showFailureIntervention && (
        <FailureIntervention onClose={() => setShowFailureIntervention(false)} />
      )}
      {showWeeklyReport && weeklyData && (
        <WeeklyReport
          {...weeklyData}
          onClose={() => setShowWeeklyReport(false)}
        />
      )}
    </>
  );
}
