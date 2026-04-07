import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readEnvFileValue(key: string): string | null {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    const abs = join(process.cwd(), file);
    if (!existsSync(abs)) continue;
    try {
      const raw = readFileSync(abs, "utf8");
      const line = raw
        .split(/\r?\n/)
        .find((entry) => entry.startsWith(`${key}=`) && !entry.trimStart().startsWith("#"));
      if (!line) continue;
      const value = line.slice(line.indexOf("=") + 1).trim();
      if (!value) continue;
      return value.replace(/^["']|["']$/g, "");
    } catch {
      // continue to next file
    }
  }
  return null;
}

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

const remoteUrl =
  normalizeUrl(process.env.CAPACITOR_SERVER_URL ?? null) ||
  normalizeUrl(readEnvFileValue("CAPACITOR_SERVER_URL")) ||
  normalizeUrl(process.env.NEXT_PUBLIC_APP_URL ?? null) ||
  normalizeUrl(readEnvFileValue("NEXT_PUBLIC_APP_URL")) ||
  "https://neurohq.vercel.app";

const config: CapacitorConfig = {
  appId: "com.neurohq.app",
  appName: "NEUROHQ",
  webDir: "public",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#03060c",
    },
  },
  server: {
    /**
     * Supabase-first rollout starts as a thin shell over the existing Next deployment.
     * Native clients load the hosted app URL; local SQLite/outbox adds resilience.
     */
    url: remoteUrl,
    cleartext: remoteUrl.startsWith("http://"),
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;

