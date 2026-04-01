"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { PricingCard, PricingFeatureCheck } from "@/components/ui/PricingCard";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";
import {
  MarketingHeroHeadlineDivider,
  marketingHeroSubtitleClassName,
  marketingHeroTitleClassName,
} from "@/components/ui/marketing-landing-art";
import { cn } from "@/lib/utils";
import { FREE_PLAN_MONTHLY_MINUTES } from "@/lib/usage";

type BillingInterval = "monthly" | "yearly";

const YEARLY_DISCOUNT = 0.2;

const PRICING_FAQ_ITEMS = [
  {
    q: "What am I actually paying for?",
    a: "Listening time each month. While Persuaid is connected to a live call, you can ask for as many answers and rebuttals as you need—there’s no cap on how many times you tap for help.",
  },
  {
    q: "Why is Pro Plus more expensive?",
    a: "Same experience as Pro—just more monthly listening time for people who live on the phone. It’s not a “team” plan and it isn’t priced per seat.",
  },
  {
    q: "What if I blank mid-call?",
    a: "That’s the point. You stay in the conversation; Persuaid pulls from what you’ve taught it and suggests what to say next before the silence gets awkward.",
  },
  {
    q: "Can I change plans?",
    a: "Yes. When your workload shifts, move up or down—billing catches up on your next cycle where our checkout supports it.",
  },
] as const;

function PricingFaqChevron({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center text-text-muted transition-transform duration-200 ease-out",
        open && "rotate-180"
      )}
      aria-hidden
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function PlanBadge({ variant, children }: { variant: "popular" | "best"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[13px] font-bold uppercase tracking-[0.12em]",
        variant === "popular" &&
          "border border-green-primary/55 bg-green-primary/[0.22] text-green-accent shadow-[0_0_40px_-10px_rgba(26,157,120,0.65),inset_0_1px_0_rgba(255,255,255,0.14)]",
        variant === "best" &&
          "border border-green-accent/50 bg-gradient-to-b from-green-primary/40 via-green-primary/25 to-green-darker/55 text-white shadow-[0_0_48px_-8px_rgba(61,184,146,0.55),0_12px_32px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]"
      )}
    >
      {children}
    </span>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "team" | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const startCheckout = async (plan: "pro" | "team") => {
    setCheckoutLoading(plan);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push(`/sign-in?signin=1&next=${encodeURIComponent("/pricing")}`);
        return;
      }

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
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
  const proPlusMonthly = 50;
  const proYearlyPerMonth = Math.round(proMonthly * (1 - YEARLY_DISCOUNT));
  const proPlusYearlyPerMonth = Math.round(proPlusMonthly * (1 - YEARLY_DISCOUNT));

  const proPrice = interval === "monthly" ? "$20" : `$${proYearlyPerMonth}`;
  const proPlusPrice = interval === "monthly" ? "$50" : `$${proPlusYearlyPerMonth}`;
  const periodSuffix = interval === "yearly" ? " (billed yearly)" : "";

  const badgeSlotClass =
    "flex min-h-[3.75rem] shrink-0 flex-col items-center justify-end pb-3 pt-1 sm:min-h-[4rem]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-black">
      <Navbar landingLogo />

      <div className="relative z-10">
        {/* Hero — same inset, type scale, divider, and subtitle treatment as landing `Hero` */}
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-10 pb-10 pt-24 sm:pb-12 sm:pt-28 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-[42rem] text-center"
          >
            <h1 className={marketingHeroTitleClassName}>Never freeze on a call again.</h1>
            <MarketingHeroHeadlineDivider />
            <p className={cn(marketingHeroSubtitleClassName, "mb-8 text-white sm:mb-10")}>
              Real-time answers while you&apos;re still on the call.
            </p>
          </motion.div>
        </section>

        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background-surface/50 p-1.5">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                interval === "monthly"
                  ? "border border-green-primary/30 bg-green-primary/20 text-green-accent"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                interval === "yearly"
                  ? "border border-green-primary/30 bg-green-primary/20 text-green-accent"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Yearly
              <span className="rounded bg-green-primary/30 px-1.5 py-0.5 text-[10px] font-semibold text-green-accent">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="mx-auto mt-10 grid max-w-6xl grid-cols-1 items-stretch gap-7 px-4 sm:px-6 md:mt-12 md:grid-cols-3 md:gap-4 lg:gap-6 lg:px-8"
        >
          {/* Free — quieter, smaller feel */}
          <div className="flex min-h-0 w-full flex-col">
            <div className={badgeSlotClass} aria-hidden>
              <span className="invisible select-none rounded-full px-6 py-2.5 text-[13px] font-bold uppercase tracking-[0.12em]">
                Most popular
              </span>
            </div>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col rounded-3xl border border-white/[0.06] bg-background-surface/15 p-6 sm:p-7",
                "opacity-[0.92]"
              )}
            >
              <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">Free</h3>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-text-primary sm:text-[2.25rem]">$0</span>
              </div>
              <ul className="mt-6 space-y-2 text-[12px] font-medium leading-snug sm:text-[13px]">
                <li className="flex gap-2">
                  <PricingFeatureCheck className="!h-5 !w-5" />
                  <span className="text-text-primary/90">Live AI support during calls</span>
                </li>
                <li className="flex gap-2">
                  <PricingFeatureCheck className="!h-5 !w-5" />
                  <span className="text-text-primary/90">Unlimited responses while active</span>
                </li>
                <li className="flex gap-2">
                  <PricingFeatureCheck className="!h-5 !w-5" />
                  <span className="text-text-primary/90">Bring your own talk tracks & notes</span>
                </li>
                <li className="flex gap-2">
                  <PricingFeatureCheck className="!h-5 !w-5" />
                  <span className="text-text-primary/90">
                    {FREE_PLAN_MONTHLY_MINUTES} minutes of live listening per month
                  </span>
                </li>
              </ul>
              <div className="min-h-0 flex-1" aria-hidden />
              <div className="pt-6">
                <CTAButton variant="secondary" className="w-full" href="/download">
                  Download free app
                </CTAButton>
              </div>
            </div>
          </div>

          {/* Pro — most popular */}
          <div className="relative z-[2] flex min-h-0 w-full flex-col">
            <div className={badgeSlotClass}>
              <PlanBadge variant="popular">Most popular</PlanBadge>
            </div>
            <PricingCard
              name="Persuaid Pro"
              price={proPrice}
              period={`/month${periodSuffix}`}
              features={[
                "Generous monthly live call listening",
                "Instant answers, rebuttals, and follow-ups while you’re talking",
                "Uses your product knowledge, pricing, and notes in real time",
                "Saved transcripts with coaching insights after every call",
              ]}
              cta="Subscribe"
              tier="featured"
              className="min-h-0 flex-1 md:scale-[1.03] md:shadow-xl lg:scale-[1.04]"
              onCheckout={() => startCheckout("pro")}
              checkoutLoading={checkoutLoading === "pro"}
            />
          </div>

          {/* Pro Plus — best deal */}
          <div className="relative z-[2] flex min-h-0 w-full flex-col">
            <div className={badgeSlotClass}>
              <PlanBadge variant="best">Best deal</PlanBadge>
            </div>
            <PricingCard
              name="Persuaid Pro Plus"
              price={proPlusPrice}
              period={`/month${periodSuffix}`}
              features={[
                "Maximum monthly live call listening",
                "Instant answers, rebuttals, and follow-ups while you’re talking",
                "Uses your product knowledge, pricing, and notes in real time",
                "Saved transcripts with coaching insights after every call",
              ]}
              cta="Subscribe"
              tier="bestDeal"
              className="min-h-0 flex-1 md:scale-[1.03] md:shadow-xl lg:scale-[1.04]"
              onCheckout={() => startCheckout("team")}
              checkoutLoading={checkoutLoading === "team"}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-16 max-w-6xl rounded-2xl border border-border/50 bg-background-surface/35 p-6 px-4 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8 lg:px-8"
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">Partners</p>
            <h2 className="mt-3 font-display text-2xl font-normal tracking-[-0.02em] text-text-primary sm:text-3xl">
              Selling Persuaid to others?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-[15px]">
              If you need a custom arrangement—partners, resellers, or an unusual volume ask—email us and we&apos;ll work
              it out person to person.
            </p>
          </div>
          <a
            href="mailto:persuaidapp@gmail.com?subject=Persuaid%20pricing%20question"
            className={cn(
              "mt-5 inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors sm:mt-0",
              "border border-border bg-transparent text-text-primary hover:border-white/20 hover:bg-white/[0.04]"
            )}
          >
            Get in touch
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-16 max-w-3xl px-4 sm:px-6 lg:px-8"
        >
          <header className="text-center">
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-[2.6rem]">
              Common questions
            </h2>
            <p className="font-subtitle mx-auto mt-4 max-w-lg text-center text-base font-normal leading-relaxed text-white sm:text-lg">
              Straight answers—no spreadsheet required.
            </p>
          </header>
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_22px_60px_-34px_rgba(0,0,0,0.85)]">
            {PRICING_FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.q} className="border-b border-border/35 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors sm:px-5 sm:py-5",
                      "hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/40 focus-visible:ring-inset"
                    )}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-text-primary sm:text-[15px]">{faq.q}</span>
                    <PricingFaqChevron open={isOpen} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm leading-relaxed text-text-muted sm:px-5 sm:pb-5 sm:text-[15px]">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
