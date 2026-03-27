import { CTAButton } from "./CTAButton";
import { cn } from "@/lib/utils";

/** Landing-style checkmark for plan feature rows (reusable on pricing page free tier, etc.). */
export function PricingFeatureCheck({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full",
        "bg-[color:var(--landing-forest)]/90 border border-[color:var(--landing-sage)]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="size-[11px] text-[color:var(--landing-accent-soft)]" fill="none">
        <path
          d="M3.6 8.05 6.85 11.3 12.75 4.4"
          stroke="currentColor"
          strokeWidth="2.15"
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
  description: string;
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
}: PricingCardProps) {
  const isPaid = tier === "featured" || tier === "bestDeal";

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-3xl border p-8 transition-all duration-300 sm:p-9",
        "bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm",
        tier === "default" &&
          "border-white/[0.08] hover:border-[color:var(--landing-sage)]/35 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.45)]",
        tier === "featured" &&
          cn(
            "z-[1] border-green-primary/55",
            "shadow-[0_0_0_1px_rgba(26,157,120,0.4),0_24px_56px_-22px_rgba(26,157,120,0.42),0_0_80px_-36px_rgba(26,157,120,0.32)]",
            "ring-1 ring-green-primary/35"
          ),
        tier === "bestDeal" &&
          cn(
            "z-[1] border-green-accent/45",
            "shadow-[0_0_0_1px_rgba(61,184,146,0.45),0_28px_64px_-20px_rgba(26,157,120,0.48),0_0_100px_-32px_rgba(61,184,146,0.35)]",
            "ring-2 ring-green-accent/30"
          ),
        className
      )}
    >
      <div className="mb-6 shrink-0">
        <h3
          className={cn(
            "mb-1.5 font-bold tracking-tight text-text-primary",
            tier === "default" ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          )}
        >
          {name}
        </h3>
        <p className={cn("mb-5 leading-snug text-text-muted", tier === "default" ? "text-[13px]" : "text-sm")}>
          {description}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className={cn(
              "font-bold tracking-tight text-text-primary",
              tier === "default" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
            )}
          >
            {price}
          </span>
          {period && <span className="text-base font-medium text-text-dim">{period}</span>}
        </div>
      </div>

      <ul className="shrink-0 space-y-2.5 text-sm font-medium leading-snug">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-2.5">
            <PricingFeatureCheck className="mt-0.5" />
            <span className="min-w-0 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {footnote ? (
        <p className="mt-5 text-xs leading-relaxed text-text-dim">{footnote}</p>
      ) : null}

      <div className="min-h-0 flex-1" aria-hidden />

      <div className="w-full shrink-0 pt-6">
        <CTAButton
          variant={isPaid ? "primary" : "secondary"}
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
