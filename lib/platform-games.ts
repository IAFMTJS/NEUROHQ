import type { Json } from "@/types/database.types";
import { isPlatformEventLive } from "@/lib/platform-events";

export type PlatformGamePublic = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  config: Json;
};

export function isPlatformGameLive(
  e: { active?: boolean; starts_at: string; ends_at: string | null },
  nowMs = Date.now()
): boolean {
  return isPlatformEventLive(e, nowMs);
}
