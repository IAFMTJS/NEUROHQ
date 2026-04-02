/** Path segment only, no query or hash; trailing slash stripped except root. */
export function normalizeAppPath(path: string): string {
  const pathOnly = path.split("?")[0].split("#")[0] ?? path;
  const trimmed = pathOnly.replace(/\/$/, "") || "/";
  return trimmed;
}
