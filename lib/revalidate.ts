import { revalidateTag } from "next/cache";

/**
 * Next.js 16 requires revalidateTag(tag, profile).
 * Use this wrapper to avoid "Expected 2 arguments, but got 1" on strict builds.
 */
export function revalidateTagMax(tag: string): void {
  (revalidateTag as (tag: string, profile: string) => void)(tag, "max");
}
