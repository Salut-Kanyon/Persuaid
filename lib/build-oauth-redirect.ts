import { getSafeInternalPath } from "@/lib/safe-path";

/**
 * `redirectTo` for `supabase.auth.signInWithOAuth` (Google, Apple, etc.).
 *
 * Uses `window.location.origin` so production at https://persuaid.app yields
 * `https://persuaid.app/auth/callback` — match this (and localhost) in Supabase
 * Dashboard → Authentication → URL Configuration → Redirect URLs.
 *
 * Optional: set `NEXT_PUBLIC_SITE_URL` (no trailing slash) only if the page’s
 * origin can differ from the public site URL users must return to.
 */
export function buildOAuthRedirectTo(nextParam: string | null): string {
  if (typeof window === "undefined") return "";
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  const origin = fromEnv || window.location.origin;
  const base = `${origin}/auth/callback`;
  if (!nextParam) return base;
  return `${base}?next=${encodeURIComponent(getSafeInternalPath(nextParam, "/dashboard"))}`;
}
