/**
 * Mission tasks created by commitProtocolWeekToMissions carry protocol progress in task_tags.
 * Completing on the Missions board must mirror into user_protocol_progress.completed_task_ids.
 */

export type ProtocolTaskProgressMeta = {
  protocol_slug: string;
  locale: string;
  /** Definition id from protocol JSON (week task id), not the tasks row UUID. */
  protocol_task_id: string;
};

const PREFIX_TASK = "protocol_task:";
const PREFIX_SLUG = "protocol_slug:";
const PREFIX_LOCALE = "protocol_locale:";

function extractStringTags(taskTags: unknown): string[] {
  if (!Array.isArray(taskTags)) return [];
  return taskTags.filter((t): t is string => typeof t === "string");
}

function extractPrefixed(tags: string[], prefix: string): string | null {
  const hit = tags.find((t) => t.startsWith(prefix));
  if (!hit) return null;
  const v = hit.slice(prefix.length).trim();
  return v.length > 0 ? v : null;
}

/** Legacy layout: ["growth","protocol", "<slug>", "protocol_week:…", "protocol_task:…", …] */
function inferSlugLegacy(tags: string[]): string | null {
  const i = tags.indexOf("protocol");
  if (i < 0 || i >= tags.length - 1) return null;
  const candidate = tags[i + 1];
  if (!candidate || candidate.includes(":")) return null;
  if (candidate === "growth") return null;
  return candidate;
}

export function parseProtocolProgressMetaFromTaskTags(taskTags: unknown): ProtocolTaskProgressMeta | null {
  const tags = extractStringTags(taskTags);
  const protocol_task_id = extractPrefixed(tags, PREFIX_TASK);
  if (!protocol_task_id) return null;

  const protocol_slug = extractPrefixed(tags, PREFIX_SLUG) ?? inferSlugLegacy(tags);
  if (!protocol_slug) return null;

  const locale = extractPrefixed(tags, PREFIX_LOCALE) ?? "nl";

  return { protocol_slug, locale, protocol_task_id };
}
