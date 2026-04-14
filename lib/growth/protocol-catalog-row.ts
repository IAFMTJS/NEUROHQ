/**
 * Row shape that used to live in `public.protocol_library`.
 * Content is bundled from `lib/protocols-seed-*.json`; this type remains for UI/actions.
 */
export type ProtocolCatalogRow = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  summary: string | null;
  body_md: string;
  definition_json: unknown;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
