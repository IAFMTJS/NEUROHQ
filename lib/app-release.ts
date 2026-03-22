/**
 * Release "what's new" push: version + bullet lines.
 *
 * **Default (no Vercel edits):** bump `version` and `notes` in `lib/release-notes.json`, commit, deploy.
 *
 * **Optional overrides** (e.g. hotfix text without redeploy): set on the server
 * - `NEUROHQ_APP_RELEASE_VERSION` — replaces file version when set
 * - `NEUROHQ_APP_RELEASE_NOTES_JSON` — JSON array; when set, replaces file notes
 *
 * Users get at most one push per version; ack in `user_preferences.last_release_push_version`.
 */

import releaseNotesFile from "./release-notes.json";

type ReleaseNotesFile = { version?: string; notes?: string[] };

function fileData(): ReleaseNotesFile {
  return releaseNotesFile as ReleaseNotesFile;
}

export function getConfiguredReleaseVersion(): string | null {
  const env = process.env.NEUROHQ_APP_RELEASE_VERSION?.trim();
  if (env) return env;
  const v = fileData().version?.trim();
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
  const notes = fileData().notes;
  if (Array.isArray(notes)) {
    return notes.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
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
