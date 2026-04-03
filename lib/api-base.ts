/**
 * Production desktop + web: when `NEXT_PUBLIC_API_BASE_URL` is set (e.g. https://persuaid.app),
 * all `/api/*` requests use that origin so the Electron static bundle talks to Vercel instead of 127.0.0.1:2999.
 * When unset, use same-origin relative paths (Next dev / Vercel web).
 */

let didLogApiBase = false;

export function getApiBaseUrl(): string {
  if (typeof process === "undefined") return "";
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

/** Absolute URL for an API path, or relative `/api/...` when no base is configured. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    if (typeof window !== "undefined" && !didLogApiBase) {
      didLogApiBase = true;
      // eslint-disable-next-line no-console
      console.log("[Persuaid] API requests: same-origin (NEXT_PUBLIC_API_BASE_URL not set)");
    }
    return p;
  }
  if (typeof window !== "undefined" && !didLogApiBase) {
    didLogApiBase = true;
    // eslint-disable-next-line no-console
    console.log("[Persuaid] API requests: base =", base);
  }
  return `${base}${p}`;
}
