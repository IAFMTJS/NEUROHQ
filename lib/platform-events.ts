export type PlatformEventRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  active?: boolean;
};

export function isPlatformEventLive(
  e: Pick<PlatformEventRow, "active" | "starts_at" | "ends_at">,
  nowMs = Date.now()
): boolean {
  if (e.active === false) return false;
  if (new Date(e.starts_at).getTime() > nowMs) return false;
  if (e.ends_at != null && e.ends_at !== "" && new Date(e.ends_at).getTime() < nowMs) return false;
  return true;
}
