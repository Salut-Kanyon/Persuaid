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
  const teamPerUserMonthly = 49;
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
          <div className="flex flex-col">
            <div
              className={cn(
                "flex-1 rounded-2xl border p-8 flex flex-col",
                "bg-background-surface/40 border-border/50"
              )}
            >
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Free</h3>
              <p className="text-text-muted text-sm mt-1 mb-6">Try the copilot, no card required.</p>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-text-primary">$0</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "3 hours transcription",
                  "Limited AI suggestions",
                  "Save & export transcripts",
                  "Basic notes",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="text-green-primary mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <CTAButton variant="secondary" className="w-full" href="/sign-in">
                Get started
              </CTAButton>
            </div>
          </div>

          {/* Pro — highlighted, no star */}
          <div className="flex flex-col md:-mt-2 md:mb-2">
            <PricingCard
              name="Pro"
              price={proPrice}
              period={proPeriod + yearlySuffix}
              description="For reps who live on calls. Full AI coaching and analytics."
              features={[
                "30 hours transcription",
                "Unlimited AI suggestions",
                "Follow-up question generation",
                "Scripts + notes as context",
                "Analytics dashboard",
              ]}
              cta="Start free trial"
              highlighted={true}
              className="flex-1 flex flex-col h-full"
              onCheckout={() => startCheckout("pro")}
              checkoutLoading={checkoutLoading === "pro"}
            />
            <p className="text-center text-xs text-text-dim mt-2">Most popular</p>
          </div>

          {/* Team */}
          <div className="flex flex-col">
            <div
              className={cn(
                "flex-1 rounded-2xl border p-8 flex flex-col",
                "bg-background-surface border-border/50 hover:border-green-primary/30 transition-colors"
              )}
            >
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Team</h3>
              <p className="text-text-muted text-sm mt-1 mb-6">For teams that coach together.</p>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-text-primary">{teamPrice}</span>
                <span className="text-text-dim ml-2 text-base">{teamPeriod}{yearlySuffix && " "}{yearlySuffix}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "100 hours transcription",
                  "Team analytics",
                  "Shared scripts",
                  "Coaching insights",
                  "Priority AI responses",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="text-green-primary mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <CTAButton
                variant="secondary"
                className="w-full"
                onClick={() => startCheckout("team")}
                disabled={checkoutLoading === "team"}
              >
                {checkoutLoading === "team" ? "Redirecting…" : "Start free trial"}
              </CTAButton>
            </div>
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
                a: "Sign up and get 3 hours of transcription per month, limited AI suggestions, transcripts, and basic notes. No credit card required.",
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
            Ready to coach on every call?
          </h2>
          <p className="text-text-muted mb-6">Sign in or create an account to start your free trial.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton href="/sign-in" variant="primary" size="large">
              Start free trial
            </CTAButton>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl border border-border/50 text-text-secondary hover:bg-background-surface hover:text-text-primary transition-colors"
            >
              Back to home
            </a>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}
