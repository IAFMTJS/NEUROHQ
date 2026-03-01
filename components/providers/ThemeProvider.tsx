"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemeId, ColorMode } from "@/lib/theme-tokens";
import type { EmotionKey } from "@/lib/emotions";
import type { UserPreferences } from "@/types/preferences.types";
import { getUserPreferencesOrDefaults, updateUserPreferences } from "@/app/actions/preferences";

const STORAGE_KEYS = {
  theme: "neurohq-theme",
  colorMode: "neurohq-color-mode",
  emotion: "neurohq-emotion",
} as const;

/** Commander v2 is de enige stijl – theme/colorMode genegeerd, altijd normal + dark. */
function readStorageTheme(): ThemeId {
  return "normal";
}

function readStorageColorMode(): ColorMode {
  return "dark";
}

function readStorageEmotion(): EmotionKey | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEYS.emotion);
  const valid: EmotionKey[] = [
    "drained", "sleepy", "questioning", "motivated", "excited",
    "angry", "neon", "hyped", "evil",
  ];
  if (v && valid.includes(v as EmotionKey)) return v as EmotionKey;
  return null;
}

type ThemeContextValue = {
  theme: ThemeId;
  colorMode: ColorMode;
  emotion: EmotionKey | null;
  setTheme: (t: ThemeId) => void;
  setColorMode: (c: ColorMode) => void;
  setEmotion: (e: EmotionKey | null) => void;
  hydrate: (prefs: UserPreferences) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  /** Initial prefs from server (e.g. dashboard/settings layout). */
  initialPrefs?: UserPreferences | null;
};

export function ThemeProvider({ children, initialPrefs }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>("normal");
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [emotion, setEmotionState] = useState<EmotionKey | null>(() =>
    initialPrefs?.selected_emotion ?? readStorageEmotion()
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-color-mode", colorMode);
  }, [theme, colorMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    window.localStorage.setItem(STORAGE_KEYS.colorMode, colorMode);
    if (emotion) window.localStorage.setItem(STORAGE_KEYS.emotion, emotion);
    else window.localStorage.removeItem(STORAGE_KEYS.emotion);
  }, [theme, colorMode, emotion]);

  const hydrate = useCallback((prefs: UserPreferences) => {
    setThemeState("normal");
    setColorModeState("dark");
    setEmotionState(prefs.selected_emotion);
  }, []);

  const setTheme = useCallback(async (_t: ThemeId) => {
    setThemeState("normal");
    try {
      await updateUserPreferences({ theme: "normal" });
    } catch {
      /* Commander v2 only */
    }
  }, []);

  const setColorMode = useCallback(async (_c: ColorMode) => {
    setColorModeState("dark");
    try {
      await updateUserPreferences({ color_mode: "dark" });
    } catch {
      /* Commander v2 only */
    }
  }, []);

  const setEmotion = useCallback(async (e: EmotionKey | null) => {
    setEmotionState(e);
    try {
      await updateUserPreferences({ selected_emotion: e });
    } catch {
      // persist in localStorage only
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorMode,
      emotion,
      setTheme,
      setColorMode,
      setEmotion,
      hydrate,
    }),
    [theme, colorMode, emotion, setTheme, setColorMode, setEmotion, hydrate]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
