"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { PricingCard, PricingFeatureCheck } from "@/components/ui/PricingCard";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";
import { PricingCluelyStyleHero } from "@/components/ui/marketing-landing-art";
import { cn } from "@/lib/utils";
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
        "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-5 sm:py-2 sm:text-[11px]",
        variant === "popular" &&
          "border border-white/18 bg-white/[0.06] text-text-primary/95",
        variant === "best" &&
          "border border-white/[0.22] bg-white/[0.08] text-text-primary"
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
    "flex min-h-[2.85rem] shrink-0 flex-col items-center justify-end pb-2 pt-1 sm:min-h-[3.1rem]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-black">
      <Navbar landingLogo />

      <div className="relative z-10">
        {/* Hero — split headline + mark; inherits page bg */}
        <section className="relative w-full border-b border-white/[0.06] pb-10 pt-24 sm:pb-12 sm:pt-28 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-10"
          >
            <PricingCluelyStyleHero />
          </motion.div>
        </section>

        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 sm:px-6 lg:px-8">
          <div className="relative isolate inline-flex w-full max-w-[292px] rounded-lg border border-white/[0.1] bg-white/[0.04] p-1 sm:max-w-[304px]">
            <motion.span
              aria-hidden
              className="pointer-events-none absolute bottom-1 top-1 z-0 w-[calc(50%-6px)] rounded-md border border-green-primary/35 bg-green-primary/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
              initial={false}
              animate={{ left: interval === "monthly" ? 4 : "calc(50% + 2px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
            <motion.button
              type="button"
              onClick={() => setInterval("monthly")}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative z-10 flex-1 rounded-md px-4 py-2 text-[13px] font-medium transition-colors sm:py-2.5",
                interval === "monthly" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
              )}
            >
              Monthly
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setInterval("yearly")}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors sm:py-2.5",
                interval === "yearly" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
              )}
            >
              Yearly
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors",
                  interval === "yearly"
                    ? "border-green-primary/30 bg-green-primary/[0.12] text-emerald-200/90"
                    : "border-white/[0.08] bg-white/[0.06] text-text-secondary"
                )}
              >
                −20%
              </span>
            </motion.button>
          </div>
        </div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="mx-auto mt-8 grid max-w-6xl grid-cols-1 items-stretch gap-6 px-4 sm:px-6 md:mt-10 md:grid-cols-3 md:gap-5 lg:px-8"
        >
          {/* Free — readable surface (was easy to miss on dark bg) */}
          <div className="flex h-full min-h-0 w-full flex-col">
            <div className={badgeSlotClass} aria-hidden>
              <span className="invisible select-none rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                Most popular
              </span>
            </div>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col rounded-2xl border border-white/[0.14] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:p-7"
              )}
            >
              <div className="mb-6 shrink-0">
                <h3 className="mb-4 text-[1.12rem] font-semibold tracking-tight text-text-primary sm:text-xl">
                  Trial
                </h3>
                <motion.div
                  key={interval}
                  initial={{ opacity: 0.88, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                  className="inline-flex max-w-full items-baseline rounded-xl border border-green-primary/40 bg-transparent px-3 py-2 sm:px-3.5 sm:py-2.5"
                >
                  <span className="text-[1.95rem] font-bold tracking-tight text-text-primary sm:text-[2.25rem]">
                    Free
                  </span>
                </motion.div>
              </div>
              <ul className="mt-0 space-y-2 text-[12px] font-medium leading-snug text-white/[0.88] sm:text-[13px]">
                <li className="flex gap-2.5">
                  <PricingFeatureCheck />
                  <span className="min-w-0">Limited amount of time</span>
                </li>
                <li className="flex gap-2.5">
                  <PricingFeatureCheck />
                  <span className="min-w-0">Limited Amount of Responses</span>
                </li>
                <li className="flex gap-2.5">
                  <PricingFeatureCheck />
                  <span className="min-w-0">Starter Workspace</span>
                </li>
                <li className="flex gap-2.5">
                  <PricingFeatureCheck />
                  <span className="min-w-0">Free Trial</span>
                </li>
              </ul>
              <div className="min-h-0 flex-1" aria-hidden />
              <div className="pt-6">
                <CTAButton variant="workspace" size="default" className="w-full" href="/download">
                  Download Now
                </CTAButton>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="relative z-[2] flex h-full min-h-0 w-full flex-col">
            <div className={badgeSlotClass}>
              <PlanBadge variant="popular">Most popular</PlanBadge>
            </div>
            <PricingCard
              name="Pro"
              price={proPrice}
              period={`/month${periodSuffix}`}
              priceAnimationKey={interval}
              features={[
                "Unlimited Amount of Responses",
                "Uses your product knowledge",
                "Saved transcripts with coaching insights after every call",
                "20 hours of call time a month",
              ]}
              cta="Subscribe"
              tier="featured"
              className="min-h-0 flex-1"
              onCheckout={() => startCheckout("pro")}
              checkoutLoading={checkoutLoading === "pro"}
            />
          </div>

          {/* Pro Plus */}
          <div className="relative z-[2] flex h-full min-h-0 w-full flex-col">
            <div className={badgeSlotClass}>
              <PlanBadge variant="best">Best deal</PlanBadge>
            </div>
            <PricingCard
              name="Pro Plus"
              price={proPlusPrice}
              period={`/month${periodSuffix}`}
              priceAnimationKey={interval}
              features={[
                "Like All Pro features, plus additional features",
                "50 hours a month of live calls",
              ]}
              cta="Subscribe"
              tier="bestDeal"
              className="min-h-0 flex-1"
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
          className="mx-auto mt-14 max-w-5xl rounded-2xl border border-border/50 bg-background-surface/35 p-5 px-4 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7 lg:px-7"
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
                      "hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-inset"
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
