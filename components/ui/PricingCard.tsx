"use client";

import { motion } from "framer-motion";
import { CTAButton } from "./CTAButton";
import { cn } from "@/lib/utils";

/** Simple green stroke check — no circle (pricing feature rows). */
export function PricingFeatureCheck({ className }: { className?: string }) {
  return (
    <span className={cn("mt-[0.2rem] inline-flex shrink-0 text-green-primary", className)} aria-hidden>
      <svg viewBox="0 0 16 16" className="size-[12px] sm:size-[13px]" fill="none">
        <path
          d="M3.4 8.1 6.7 11.3 12.6 4.4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export type PricingTier = "default" | "featured" | "bestDeal";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  /** Small line above the CTA — conviction, not fine print. */
  footnote?: string;
  cta: string;
  /** featured = most popular glow; bestDeal = strongest glow + value framing */
  tier?: PricingTier;
  className?: string;
  /** When set, CTA runs this instead of navigating to href (e.g. Stripe checkout). */
  onCheckout?: () => void;
  checkoutLoading?: boolean;
  /** Drives a short price transition when billing interval changes (e.g. monthly vs yearly). */
  priceAnimationKey?: string;
}

export function PricingCard({
  name,
  price,
  period = "/month",
  description,
  features,
  footnote,
  cta,
  tier = "default",
  className,
  onCheckout,
  checkoutLoading = false,
  priceAnimationKey = "",
}: PricingCardProps) {
  const isPaid = tier === "featured" || tier === "bestDeal";

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-2xl border p-6 transition-[border-color,box-shadow] duration-300 sm:p-7",
        "bg-gradient-to-b from-white/[0.045] to-transparent backdrop-blur-sm",
        tier === "default" &&
          "border-white/[0.1] hover:border-white/[0.14] hover:shadow-[0_12px_36px_-24px_rgba(0,0,0,0.55)]",
        tier === "featured" &&
          cn(
            "z-[1] border-white/[0.16]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_48px_-28px_rgba(0,0,0,0.65)]"
          ),
        tier === "bestDeal" &&
          cn(
            "z-[1] border-white/[0.18]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_20px_52px_-26px_rgba(0,0,0,0.7)]"
          ),
        className
      )}
    >
      <div className="mb-6 shrink-0">
        <h3
          className={cn(
            "font-semibold tracking-tight text-text-primary text-[1.12rem] sm:text-xl",
            description ? "mb-1.5" : "mb-4"
          )}
        >
          {name}
        </h3>
        {description ? (
          <p className={cn("mb-4 leading-snug text-text-muted text-[12px] sm:text-[13px]")}>{description}</p>
        ) : null}
        <motion.div
          key={priceAnimationKey ? `${priceAnimationKey}-${price}` : price}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl border border-green-primary/40 bg-transparent px-3 py-2 sm:gap-x-2.5 sm:px-3.5 sm:py-2.5"
        >
          <span className="text-[1.95rem] font-bold tracking-tight text-text-primary sm:text-[2.25rem]">{price}</span>
          {period && (
            <span className="text-sm font-medium text-text-dim sm:text-[0.95rem]">{period}</span>
          )}
        </motion.div>
      </div>

      <ul className="shrink-0 space-y-2 text-[12px] font-medium leading-snug text-white/[0.88] sm:text-[13px]">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-2.5">
            <PricingFeatureCheck />
            <span className="min-w-0">{feature}</span>
          </li>
        ))}
      </ul>

      {footnote ? (
        <p className="mt-5 text-xs leading-relaxed text-text-dim">{footnote}</p>
      ) : null}

      <div className="min-h-0 flex-1" aria-hidden />

      <div className="w-full shrink-0 pt-6">
        <CTAButton
          variant={isPaid ? "workspace" : "secondary"}
          size={isPaid ? "default" : "compact"}
          className="w-full"
          href={onCheckout ? undefined : "/dashboard"}
          onClick={onCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? "Redirecting…" : cta}
        </CTAButton>
      </div>
    </div>
  );
}
