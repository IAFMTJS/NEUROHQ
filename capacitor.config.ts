import type { CapacitorConfig } from "@capacitor/cli";

const remoteUrl = process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "com.neurohq.app",
  appName: "NEUROHQ",
  webDir: "public",
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

