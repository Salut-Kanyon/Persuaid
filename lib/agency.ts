import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSubscriptionPlanFromDb } from "@/lib/billing";
import { getPlanForUser, type Plan } from "@/lib/entitlements";

/**
 * Normalize raw invite token before hashing (URLs may change hex case; copy/paste may add spaces).
 * Must stay in sync between invite creation and redeem.
 */
export function normalizeInviteToken(rawToken: string): string {
  return rawToken.trim().replace(/\s+/g, "").toLowerCase();
}

export function hashInviteToken(rawToken: string): string {
  const normalized = normalizeInviteToken(rawToken);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export type AgencyMembership = {
  agencyId: string;
  role: "owner" | "member";
};

/**
 * Effective plan for API routes: bypass/subscription first, then agency membership → pro.
 */
export async function resolveEffectivePlan(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<{ plan: Plan; agency?: AgencyMembership }> {
  const base = getPlanForUser(userId, email ?? undefined);
  if (base === "pro" || base === "team") {
    return { plan: base };
  }

  const stripePlan = await getSubscriptionPlanFromDb(supabase, userId);
  if (stripePlan) {
    return { plan: stripePlan };
  }

  const { data, error } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { plan: base };
  }

  const role = data.role === "owner" ? "owner" : "member";
  return {
    plan: "pro",
    agency: { agencyId: data.agency_id, role },
  };
}
