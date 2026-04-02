import { getSafeInternalPath } from "@/lib/safe-path";

/**
 * Full Supabase OAuth `redirectTo` URL (must exactly match Redirect URLs in the dashboard).
 *
 * **Electron (`window.persuaid`):** uses `persuaid://auth/callback` so the return URL is
 * stable and allow-listed independently of localhost port. `electron/main.js` rewrites this
 * to `http://localhost:<port>/auth/callback` (dev) or `http://127.0.0.1:<bundle>/auth/callback`
 * (packaged). Add **`persuaid://auth/callback`** to Supabase Redirect URLs.
 *
 * **Browser:** uses `getOAuthRedirectOrigin()` + `/auth/callback` as before.
 */
export function getOAuthCallbackRedirectUrl(nextParam: string | null): string {
  const isElectron =
    typeof window !== "undefined" &&
    typeof (window as unknown as { persuaid?: unknown }).persuaid !== "undefined";
  if (isElectron) {
    return nextParam
      ? `persuaid://auth/callback?next=${encodeURIComponent(getSafeInternalPath(nextParam, "/dashboard"))}`
      : "persuaid://auth/callback";
  }
  const origin = getOAuthRedirectOrigin();
  if (!origin) return "";
  return nextParam
    ? `${origin}/auth/callback?next=${encodeURIComponent(getSafeInternalPath(nextParam, "/dashboard"))}`
    : `${origin}/auth/callback`;
}

/**
 * Base URL for Supabase OAuth when not using {@link getOAuthCallbackRedirectUrl} (browser only).
 *
 * - Prefer `NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN` when set (e.g. http://localhost:3000).
 * - Otherwise use the current page origin, with 127.0.0.1 → localhost so it matches
 *   typical allow-list entries ("localhost" but not "127.0.0.1").
 *
 * We intentionally do not use `NEXT_PUBLIC_APP_URL` here: it often points at the
 * public marketing domain, which would send Electron users to the live site after Google.
 */
export function getOAuthRedirectOrigin(): string {
  const fromEnv =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN
      ? process.env.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN.replace(/\/$/, "").trim()
      : "";

  // If env points at production/staging but the app is open on localhost (e.g. desktop:dev),
  // still use the current dev origin so Supabase redirect_to matches Redirect URLs for localhost.
  if (typeof window !== "undefined" && fromEnv) {
    try {
      const cur = new URL(window.location.href);
      const onLocal = cur.hostname === "localhost" || cur.hostname === "127.0.0.1";
      if (onLocal) {
        const o = new URL(fromEnv);
        const envHost = o.hostname.replace(/^www\./, "").toLowerCase();
        const envIsLocal = envHost === "localhost" || envHost === "127.0.0.1";
        if (!envIsLocal) {
          if (cur.hostname === "127.0.0.1") cur.hostname = "localhost";
          return cur.origin;
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (fromEnv) return fromEnv;

  if (typeof window === "undefined") return "";
  try {
    const u = new URL(window.location.href);
    if (u.hostname === "127.0.0.1") u.hostname = "localhost";
    return u.origin;
  } catch {
    return window.location.origin;
  }
}
