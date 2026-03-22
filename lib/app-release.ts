/**
 * Configure a release summary push by setting env on deploy:
 * - NEUROHQ_APP_RELEASE_VERSION — bump when you ship user-visible changes (any string, e.g. 2025.03.22 or 1.4.0).
 * - NEUROHQ_APP_RELEASE_NOTES_JSON — JSON array of short bullet strings, e.g. ["Budget lock", "Strategy tab"].
 * Users with push enabled get one notification per version; ack is stored in user_preferences.last_release_push_version.
 */

export function getConfiguredReleaseVersion(): string | null {
  const v = process.env.NEUROHQ_APP_RELEASE_VERSION?.trim();
  return v && v.length > 0 ? v : null;
}

export function getReleaseNotesLines(): string[] {
  const raw = process.env.NEUROHQ_APP_RELEASE_NOTES_JSON;
  if (raw) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        return p
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return [];
}

/** Notification body: bullet list, length-capped for lock-screen preview. */
export function formatReleaseNotesForPushBody(lines: string[], maxLen = 280): string {
  if (!lines.length) return "";
  const bullet = lines.map((l) => `• ${l}`).join(" ");
  if (bullet.length <= maxLen) return bullet;
  let out = "";
  for (const l of lines) {
    const part = `• ${l}`;
    if (out.length + part.length + 1 > maxLen) break;
    out = out ? `${out} ${part}` : part;
  }
  if (!out) return `${bullet.slice(0, Math.max(0, maxLen - 1))}…`;
  return out.length < bullet.length ? `${out}…` : out;
}
