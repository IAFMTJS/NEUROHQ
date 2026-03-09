"use client";

import { useState, useEffect, useCallback } from "react";
import { getTodayEngineData } from "@/app/actions/dcic/today-engine";
import { runTodayEngine, type ClientTodayEngineResult, type TodayEngineData } from "@/lib/client-today-engine";

type TodayEngineCacheEntry = {
  data: TodayEngineData;
  result: ClientTodayEngineResult;
};

const todayEngineCache = new Map<string, TodayEngineCacheEntry>();
const todayEngineInflight = new Map<string, Promise<TodayEngineCacheEntry>>();

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadTodayEngine(date: string): Promise<TodayEngineCacheEntry> {
  const cached = todayEngineCache.get(date);
  if (cached) return cached;

  const existingRequest = todayEngineInflight.get(date);
  if (existingRequest) return existingRequest;

  const request = getTodayEngineData(date)
    .then((raw) => {
      const entry = {
        data: raw,
        result: runTodayEngine(raw),
      };
      todayEngineCache.set(date, entry);
      return entry;
    })
    .finally(() => {
      todayEngineInflight.delete(date);
    });

  todayEngineInflight.set(date, request);
  return request;
}

/**
 * Client-side today engine: one fetch for raw data, then bucketing + suggestion run locally.
 * Use this in dashboard/tasks for instant shell + single data load.
 */
export function useTodayEngine(dateStr?: string) {
  const date = dateStr ?? todayDateStr();
  const cached = todayEngineCache.get(date) ?? null;
  const [data, setData] = useState<TodayEngineData | null>(cached?.data ?? null);
  const [result, setResult] = useState<ClientTodayEngineResult | null>(cached?.result ?? null);
  const [isLoading, setIsLoading] = useState(cached == null);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    todayEngineCache.delete(date);
    todayEngineInflight.delete(date);
    setIsLoading(true);
    setError(null);
    try {
      const next = await loadTodayEngine(date);
      setData(next.data);
      setResult(next.result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load today engine"));
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    const cachedEntry = todayEngineCache.get(date);
    if (cachedEntry) {
      setData(cachedEntry.data);
      setResult(cachedEntry.result);
      setError(null);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError(null);
    loadTodayEngine(date)
      .then((next) => {
        if (cancelled) return;
        setData(next.data);
        setResult(next.result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error("Failed to load today engine"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

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
