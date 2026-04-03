import { createHash } from "crypto";
import type { MissionsPipelinePayload } from "@/lib/missions/derive-mission-capacity";

export function computeBootstrapWeakEtag(
  userId: string,
  dateStr: string,
  tasksForDate: unknown[] | null | undefined,
  missionsPipeline: MissionsPipelinePayload
): string {
  const rows = (tasksForDate ?? [])
    .map((t) => {
      const r = t as { id?: string; updated_at?: string | null; completed?: boolean };
      return `${r.id ?? ""}:${String(r.updated_at ?? "")}:${r.completed ? 1 : 0}`;
    })
    .sort();
  const umsKey = missionsPipeline.rankedTaskIds.join(",");
  const raw = [userId, dateStr, rows.join("|"), umsKey].join("##");
  const h = createHash("sha1").update(raw).digest("base64url").slice(0, 28);
  return `W/"${h}"`;
}

export function bootstrapEtagsMatch(ifNoneMatch: string | null | undefined, etag: string): boolean {
  if (!ifNoneMatch?.trim() || !etag) return false;
  const want = etag.trim();
  return ifNoneMatch.split(",").some((raw) => {
    const c = raw.trim();
    return c === want || c === `"${want}"` || `"${c}"` === want;
  });
}
