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
        "bg-background-surface border rounded-card p-10 transition-all duration-500 relative overflow-hidden group flex flex-col min-h-0",
        highlighted
          ? "border-green-primary/50 shadow-glow-sm scale-105 lg:scale-110"
          : "border-border/50 hover:border-green-primary/40 hover:shadow-card-elevated hover:-translate-y-1",
        className
      )}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-primary via-green-accent to-green-primary"></div>
      )}
      <div className="mb-8 shrink-0">
        <h3 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">{name}</h3>
        <p className="text-text-muted text-sm mb-6 leading-relaxed">{description}</p>
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-text-primary tracking-tight">{price}</span>
          {period && (
            <span className="text-text-dim ml-2 text-lg font-medium">{period}</span>
          )}
        </div>
      </div>

      <div className="w-fit max-w-full self-start shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 shadow-sm backdrop-blur-md">
        <ul className="space-y-1.5 text-sm font-medium leading-snug list-none">
          {features.map((feature, index) => (
            <li key={index}>
              <span className="block bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent leading-snug">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 min-h-0" aria-hidden />

      <div className="w-full shrink-0 pt-8">
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
    </div>
  );
}
