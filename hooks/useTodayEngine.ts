"use client";

import { useState, useEffect, useCallback } from "react";
import { getTodayEngineData } from "@/app/actions/dcic/today-engine";
import { runTodayEngine, type ClientTodayEngineResult, type TodayEngineData } from "@/lib/client-today-engine";

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Client-side today engine: one fetch for raw data, then bucketing + suggestion run locally.
 * Use this in dashboard/tasks for instant shell + single data load.
 */
export function useTodayEngine(dateStr?: string) {
  const date = dateStr ?? todayDateStr();
  const [data, setData] = useState<TodayEngineData | null>(null);
  const [result, setResult] = useState<ClientTodayEngineResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await getTodayEngineData(date);
      setData(raw);
      setResult(runTodayEngine(raw));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load today engine"));
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    /** Raw data from server (tasks, streak, xp, dailyState). */
    data,
    /** Engine result: bucketed tasks, suggestion, suggestedTaskCount. Runs locally. */
    result,
    isLoading,
    error,
    refetch,
    date,
  };
}
