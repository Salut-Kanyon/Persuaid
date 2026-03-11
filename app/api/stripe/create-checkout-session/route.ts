/**
 * Creates a Stripe Checkout Session for Pro or Team subscriptions.
 *
 * Required env (in addition to STRIPE_SECRET_KEY):
 * - STRIPE_PRICE_PRO_MONTHLY
 * - STRIPE_PRICE_PRO_YEARLY
 * - STRIPE_PRICE_TEAM_MONTHLY
 * - STRIPE_PRICE_TEAM_YEARLY
 *
 * Create these in Stripe Dashboard: Products → Pro / Team → add recurring Prices → copy Price IDs.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const priceIdKey = (plan: string, interval: string) => {
  if (plan === "pro" && interval === "monthly") return "STRIPE_PRICE_PRO_MONTHLY";
  if (plan === "pro" && interval === "yearly") return "STRIPE_PRICE_PRO_YEARLY";
  if (plan === "team" && interval === "monthly") return "STRIPE_PRICE_TEAM_MONTHLY";
  if (plan === "team" && interval === "yearly") return "STRIPE_PRICE_TEAM_YEARLY";
  return null;
};

/** Create a Stripe Checkout Session for a subscription (Pro or Team, monthly or yearly). */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret?.trim()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://persuaid.app";
  const successUrl = `${baseUrl}/dashboard?checkout=success`;
  const cancelUrl = `${baseUrl}/pricing`;

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe] create-checkout-session error:", e);
    const message = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
