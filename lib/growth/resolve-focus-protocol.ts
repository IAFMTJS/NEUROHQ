import type { ProtocolLibraryListRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import type { GrowthFocusState } from "@/app/actions/growth-focus";

export function progressKey(slug: string, locale: string) {
  return `${slug}::${locale}`;
}

/** Same resolution as Growth command center: saved focus → first with progress → first in library. */
export function resolveFocusProtocol(
  protocols: ProtocolLibraryListRow[],
  progressMap: Record<string, ProtocolProgressState>,
  focus: GrowthFocusState,
): ProtocolLibraryListRow | null {
  if (protocols.length === 0) return null;
  if (focus.slug) {
    const exact = protocols.find((p) => p.slug === focus.slug && p.locale === focus.locale);
    if (exact) return exact;
    const slugOnly = protocols.find((p) => p.slug === focus.slug);
    if (slugOnly) return slugOnly;
  }
  const withProgress = protocols.find((p) => progressMap[progressKey(p.slug, p.locale)]);
  return withProgress ?? protocols[0] ?? null;
}
