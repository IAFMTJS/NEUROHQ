"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UIState } from "@/lib/ui-state";
import { REWARD_DISPLAY_MS, ERROR_DISPLAY_MS } from "@/lib/ui-state";

type AppStateContextValue = {
  uiState: UIState;
  setUIState: (s: UIState) => void;
  triggerReward: () => void;
  triggerError: () => void;
  triggerFocus: () => void;
  triggerIdle: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) return null;
  return ctx;
}

export function useAppStateRequired() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

type AppStateProviderProps = { children: React.ReactNode };

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [uiState, setUIState] = useState<UIState>("idle");

  const triggerReward = useCallback(() => {
    setUIState("reward");
  }, []);

  const triggerError = useCallback(() => {
    setUIState("error");
  }, []);

  const triggerFocus = useCallback(() => {
    setUIState("focus");
  }, []);

  const triggerIdle = useCallback(() => {
    setUIState("idle");
  }, []);

  useEffect(() => {
    if (uiState !== "reward" && uiState !== "error") return;
    const ms = uiState === "reward" ? REWARD_DISPLAY_MS : ERROR_DISPLAY_MS;
    const t = setTimeout(() => setUIState("idle"), ms);
    return () => clearTimeout(t);
  }, [uiState]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      uiState,
      setUIState,
      triggerReward,
      triggerError,
      triggerFocus,
      triggerIdle,
    }),
    [uiState, triggerReward, triggerError, triggerFocus, triggerIdle]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
