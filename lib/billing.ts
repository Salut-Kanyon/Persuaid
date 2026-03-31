import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/entitlements";

/** Subscription statuses that unlock paid plan features in the app. */
const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** Map Stripe Price ID (from env) to Pro / Team. */
export function planFromStripePriceId(priceId: string | undefined | null): Plan | null {
  if (!priceId) return null;
  const pro = [
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_YEARLY,
  ].filter(Boolean) as string[];
  const team = [
    process.env.STRIPE_PRICE_TEAM_MONTHLY,
    process.env.STRIPE_PRICE_TEAM_YEARLY,
  ].filter(Boolean) as string[];
  if (pro.includes(priceId)) return "pro";
  if (team.includes(priceId)) return "team";
  return null;
}

/**
 * Paid plan from `billing_subscriptions` (Stripe webhook). RLS: user can read own row.
 */
export async function getSubscriptionPlanFromDb(
  supabase: SupabaseClient,
  userId: string
): Promise<Plan | null> {
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  if (!data) return null;
  const row = data as { plan?: string; status?: string };
  if (!ACTIVE.has(String(row.status))) return null;
  return row.plan === "team" ? "team" : row.plan === "pro" ? "pro" : null;
}
