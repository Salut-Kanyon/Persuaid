import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { planFromStripePriceId } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Stripe → Supabase: sync `billing_subscriptions`.
 * Configure in Stripe Dashboard: Developers → Webhooks → endpoint URL …/api/stripe/webhook
 * Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 *
 * Env: STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
 */
export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!stripeSecret?.trim() || !whSecret || !serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (e) {
    console.error("[stripe webhook] signature:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.client_reference_id || session.metadata?.supabase_user_id;
        if (!userId || typeof userId !== "string") {
          console.error("[stripe webhook] checkout.session.completed: missing user id");
          break;
        }
        const subRef = session.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (!subId) break;
        const custRef = session.customer;
        const customerId = typeof custRef === "string" ? custRef : custRef?.id ?? null;

        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price"],
        });
        const priceId = sub.items.data[0]?.price?.id;
        const plan = planFromStripePriceId(priceId);
        if (!plan) {
          console.error("[stripe webhook] unknown price id", priceId);
          break;
        }

        const { error } = await supabaseAdmin.from("billing_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        if (error) console.error("[stripe webhook] upsert checkout:", error.message);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) {
          console.warn("[stripe webhook] subscription.updated: missing metadata.supabase_user_id");
          break;
        }
        const priceId = sub.items.data[0]?.price?.id;
        const plan = planFromStripePriceId(priceId);
        if (!plan) {
          console.error("[stripe webhook] subscription.updated: unknown price", priceId);
          break;
        }
        const custRef = sub.customer;
        const customerId = typeof custRef === "string" ? custRef : custRef?.id ?? null;

        const { error } = await supabaseAdmin.from("billing_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        if (error) console.error("[stripe webhook] upsert updated:", error.message);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { error } = await supabaseAdmin
          .from("billing_subscriptions")
          .delete()
          .eq("stripe_subscription_id", sub.id);
        if (error) console.error("[stripe webhook] delete:", error.message);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] handler:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
