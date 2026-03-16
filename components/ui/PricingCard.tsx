import { ReactNode } from "react";
import { CTAButton } from "./CTAButton";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
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
  cta,
  highlighted = false,
  className,
  onCheckout,
  checkoutLoading = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "bg-background-surface border rounded-card p-10 transition-all duration-500 relative overflow-hidden group",
        highlighted
          ? "border-green-primary/50 shadow-glow-sm scale-105 lg:scale-110"
          : "border-border/50 hover:border-green-primary/40 hover:shadow-card-elevated hover:-translate-y-1",
        className
      )}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-primary via-green-accent to-green-primary"></div>
      )}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">{name}</h3>
        <p className="text-text-muted text-sm mb-6 leading-relaxed">{description}</p>
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-text-primary tracking-tight">{price}</span>
          {period && (
            <span className="text-text-dim ml-2 text-lg font-medium">{period}</span>
          )}
        </div>
      </div>

      <ul className="space-y-2.5 mb-10 text-sm font-medium leading-relaxed">
        {features.map((feature, index) => (
          <li
            key={index}
            className="inline-flex bg-gradient-to-r from-green-primary/60 via-green-accent/70 to-emerald-300 bg-clip-text text-transparent"
          >
            {feature}
          </li>
        ))}
      </ul>

      <CTAButton
        variant={highlighted ? "primary" : "secondary"}
        className="w-full"
        href={onCheckout ? undefined : "/dashboard"}
        onClick={onCheckout}
        disabled={checkoutLoading}
      >
        {checkoutLoading ? "Redirecting…" : cta}
      </CTAButton>
    </div>
  );
}
