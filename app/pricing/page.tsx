"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Section } from "@/components/ui/Section";
import { PricingCard } from "@/components/ui/PricingCard";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";
import { cn } from "@/lib/utils";

type BillingInterval = "monthly" | "yearly";

const YEARLY_DISCOUNT = 0.2;

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "team" | null>(null);

  const startCheckout = async (plan: "pro" | "team") => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      const msg = data.error || "Checkout unavailable";
      alert(msg);
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const proMonthly = 20;
  const teamPerUserMonthly = 50;
  const proYearlyPerMonth = Math.round(proMonthly * (1 - YEARLY_DISCOUNT));
  const teamYearlyPerMonth = Math.round(teamPerUserMonthly * (1 - YEARLY_DISCOUNT));

  const proPrice = interval === "monthly" ? "$20" : `$${proYearlyPerMonth}`;
  const teamPrice = interval === "monthly" ? "$49" : `$${teamYearlyPerMonth}`;
  const proPeriod = interval === "monthly" ? "/month" : "/month";
  const teamPeriod = interval === "monthly" ? "/user/month" : "/user/month";
  const yearlySuffix = interval === "yearly" ? " (billed yearly)" : "";

  return (
    <main className="min-h-screen bg-background-near-black">
      <Navbar />

      <Section className="pt-28 pb-16 sm:pt-32 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
            Pricing
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mt-4 mb-5 leading-tight tracking-tight"
          >
            Close more deals with AI on every call
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto"
          >
            Persuaid listens to your sales calls, generates real-time responses, and helps you handle objections instantly.
          </motion.p>
        </motion.div>

        {/* Billing toggle — only affects paid plans */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex justify-center mb-16"
        >
          <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-background-surface/50 border border-border/50">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                interval === "monthly"
                  ? "bg-green-primary/20 text-green-accent border border-green-primary/30"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                interval === "yearly"
                  ? "bg-green-primary/20 text-green-accent border border-green-primary/30"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Yearly
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-primary/30 text-green-accent">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Three-tier grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-20 items-stretch"
        >
          {/* Free */}
          <div className="flex flex-col h-full min-h-0">
            <div
              className={cn(
                "flex-1 rounded-2xl border p-8 flex flex-col min-h-0",
                "bg-background-surface/40 border-border/50"
              )}
            >
              <h3 className="text-xl font-bold text-text-primary tracking-tight shrink-0">Free</h3>
              <p className="text-text-muted text-sm mt-1 mb-6 shrink-0">30 minutes free for the AI Sales Agent.</p>
              <div className="flex items-baseline mb-8 shrink-0">
                <span className="text-4xl font-bold text-text-primary">$0</span>
              </div>
              <div className="w-fit max-w-full self-start shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 shadow-sm backdrop-blur-md">
                <ul className="space-y-1.5 text-sm font-medium list-none">
                  <li>
                    <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                      30 minutes per month
                    </span>
                  </li>
                  <li>
                    <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                      Product knowledge integration
                    </span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 min-h-0" aria-hidden />
              <div className="w-full shrink-0 pt-8">
                <CTAButton variant="secondary" className="w-full" href="/dashboard">
                  Join now
                </CTAButton>
              </div>
            </div>
            {/* Reserve space so CTAs line up with Pro column (“Most popular” row) */}
            <div className="mt-2 min-h-[2rem] shrink-0" aria-hidden />
          </div>

          {/* Pro — highlighted, no star */}
          <div className="flex flex-col h-full min-h-0 md:-mt-2 md:mb-2">
            <PricingCard
              name="Persuaid Pro"
              price={proPrice}
              period={proPeriod + yearlySuffix}
              description="For reps who want live help on real sales calls."
              features={[
                "20 hours per month",
                "Meeting transcript analysis",
                "Product knowledge integration",
                "Customer support 24/7",
              ]}
              cta="Subscribe"
              highlighted={true}
              className="flex-1 w-full min-h-0"
              onCheckout={() => startCheckout("pro")}
              checkoutLoading={checkoutLoading === "pro"}
            />
            <p className="text-center text-xs text-text-dim mt-2 shrink-0">Most popular</p>
          </div>

          {/* Team */}
          <div className="flex flex-col h-full min-h-0">
            <div
              className={cn(
                "flex-1 rounded-2xl border p-8 flex flex-col min-h-0",
                "bg-background-surface border-border/50 hover:border-green-primary/30 transition-colors"
              )}
            >
              <h3 className="text-xl font-bold text-text-primary tracking-tight shrink-0">Persuaid Pro Plus</h3>
              <p className="text-text-muted text-sm mt-1 mb-6 shrink-0">For teams that need more live call coverage.</p>
              <div className="flex items-baseline mb-8 shrink-0">
                <span className="text-4xl font-bold text-text-primary">{teamPrice}</span>
                <span className="text-text-dim ml-2 text-base">{teamPeriod}{yearlySuffix && " "}{yearlySuffix}</span>
              </div>
              <div className="w-fit max-w-full self-start shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 shadow-sm backdrop-blur-md">
                <ul className="space-y-1.5 text-sm font-medium list-none">
                  <li>
                    <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                      50 hours per month
                    </span>
                  </li>
                  <li>
                    <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                      Meeting transcript analysis
                    </span>
                  </li>
                  <li>
                    <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                      Product knowledge integration
                    </span>
                  </li>
                  <li>
                    <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                      Customer support 24/7
                    </span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 min-h-0" aria-hidden />
              <div className="w-full shrink-0 pt-8">
                <CTAButton
                  variant="secondary"
                  className="w-full"
                  onClick={() => startCheckout("team")}
                  disabled={checkoutLoading === "team"}
                >
                  {checkoutLoading === "team" ? "Redirecting…" : "Subscribe"}
                </CTAButton>
              </div>
            </div>
            <div className="mt-2 min-h-[2rem] shrink-0" aria-hidden />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <div
            className={cn(
              "rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
              "bg-background-surface/40 border-border/50"
            )}
          >
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-text-primary tracking-tight">Agency</h3>
              <p className="text-text-muted text-sm mt-1 max-w-xl">
                Bundle Pro-level access for many reps at a discounted per-seat rate. You get invite links so agents can
                join your workspace—no shared logins.
              </p>
            </div>
            <a
              href="mailto:support@persuaid.ai?subject=Persuaid%20Agency%20plan"
              className={cn(
                "shrink-0 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold",
                "border border-white/[0.12] bg-white/[0.06] text-text-primary hover:bg-white/[0.09] transition-colors"
              )}
            >
              Contact us
            </a>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How does the free plan work?",
                a: "Sign up and get 30 minutes of transcription per month, limited AI suggestions, live transcript, and basic notes. No credit card required.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes. Upgrade or downgrade anytime. Changes take effect immediately.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee on paid plans. Contact us if you’re not satisfied.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-background-surface/60 border border-border/50 rounded-xl p-5"
              >
                <h3 className="text-sm font-semibold text-text-primary mb-1.5">{faq.q}</h3>
                <p className="text-sm text-text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA removed to keep pricing page minimal */}
      </Section>

      <Footer />
    </main>
  );
}
