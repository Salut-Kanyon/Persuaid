/**
 * Creates a Stripe Checkout Session for Pro or Team subscriptions.
 * Requires a signed-in Supabase user (Bearer access token).
 *
 * Required env (in addition to STRIPE_SECRET_KEY):
 * - STRIPE_PRICE_PRO_MONTHLY
 * - STRIPE_PRICE_PRO_YEARLY
 * - STRIPE_PRICE_TEAM_MONTHLY
 * - STRIPE_PRICE_TEAM_YEARLY
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const priceIdKey = (plan: string, interval: string) => {
  if (plan === "pro" && interval === "monthly") return "STRIPE_PRICE_PRO_MONTHLY";
  if (plan === "pro" && interval === "yearly") return "STRIPE_PRICE_PRO_YEARLY";
  if (plan === "team" && interval === "monthly") return "STRIPE_PRICE_TEAM_MONTHLY";
  if (plan === "team" && interval === "yearly") return "STRIPE_PRICE_TEAM_YEARLY";
  return null;
};

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret?.trim()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(token);

  if (userErr || !user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { plan?: string; interval?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = (body.plan ?? "pro") === "team" ? "team" : "pro";
  const interval = (body.interval ?? "monthly") === "yearly" ? "yearly" : "monthly";
  const key = priceIdKey(plan, interval);
  const priceId = key ? process.env[key]?.trim() : null;

  if (!priceId) {
    return NextResponse.json(
      { error: `Price not configured for ${plan} ${interval}. Add ${key} to your environment.` },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const successUrl = `${baseUrl}/download?checkout=success`;
  const cancelUrl = `${baseUrl}/pricing`;

  const stripe = new Stripe(secret);

  try {
    // English UI; `adaptive_pricing.enabled: false` keeps amounts in the Price currency (USD) instead of converting to local currency (e.g. CRC) when Adaptive Pricing is on in the Stripe account.
    const session = await stripe.checkout.sessions.create(
      Object.assign(
        {
          mode: "subscription" as const,
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: successUrl,
          cancel_url: cancelUrl,
          allow_promotion_codes: true,
          client_reference_id: user.id,
          customer_email: user.email ?? undefined,
          locale: "en",
          metadata: {
            supabase_user_id: user.id,
          },
          subscription_data: {
            metadata: {
              supabase_user_id: user.id,
            },
          },
        },
        { adaptive_pricing: { enabled: false } }
      ) as Stripe.Checkout.SessionCreateParams
    );

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe] create-checkout-session error:", e);
    const message = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
