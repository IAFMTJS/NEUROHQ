/**
 * Client-side feature flags. Use for gating UI and navigation.
 * NEXT_PUBLIC_* env vars are inlined at build time.
 */

export function isAssistantEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === "true";
}
