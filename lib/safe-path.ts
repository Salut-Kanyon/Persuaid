/**
 * Prevent open redirects: only same-origin relative paths (optionally with query).
 * @param next - raw `next` query value (e.g. /pricing)
 */
export function getSafeInternalPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || typeof next !== "string") return fallback;
  let t = next.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    return fallback;
  }
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://")) return fallback;
  return t;
}
