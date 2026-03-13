/**
 * Plan / entitlement helpers. Used by API routes and (via /api/me/entitlements) the client.
 *
 * Bypass (treated as Pro): set any of these in .env.local
 * - PAYWALL_BYPASS_USER_IDS — comma-separated Supabase user UUIDs
 * - PAYWALL_BYPASS_EMAILS — comma-separated emails
 * - PAYWALL_BYPASS_EMAIL — single email (legacy)
 *
 * Free is the default: no subscription in DB = free. No activation required.
 */

export type Plan = "free" | "pro" | "team";

/** Read bypass config at request time so env is always current (avoids stale module load). */
function getBypassConfig(): { emails: string[]; userIds: string[] } {
  const splitTrimLower = (s: string) =>
    s
      .trim()
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  const singleEmail = process.env.PAYWALL_BYPASS_EMAIL?.trim().toLowerCase();
  const emailsFromList = (process.env.PAYWALL_BYPASS_EMAILS ?? "").trim()
    ? splitTrimLower(process.env.PAYWALL_BYPASS_EMAILS!)
    : [];
  const emails = singleEmail ? [singleEmail, ...emailsFromList] : emailsFromList;
  const userIds = splitTrimLower(process.env.PAYWALL_BYPASS_USER_IDS ?? "");
  return { emails, userIds };
}

export function getPlanForUser(userId: string, email?: string | null): Plan {
  const { emails: bypassEmails, userIds: bypassUserIds } = getBypassConfig();
  if (bypassUserIds.length && userId?.toLowerCase()) {
    if (bypassUserIds.includes(userId.toLowerCase())) return "pro";
  }
  if (bypassEmails.length && email?.toLowerCase()) {
    if (bypassEmails.includes(email.toLowerCase())) return "pro";
  }
  // TODO: read from subscriptions table when Stripe webhooks are in place
  return "free";
}

export function canUseFeature(plan: Plan, feature: "ai_coach" | "live_transcript"): boolean {
  switch (feature) {
    case "ai_coach":
      return plan === "pro" || plan === "team";
    case "live_transcript":
      return true; // All plans get transcript; usage limits enforced separately by minutes
    default:
      return false;
  }
}
