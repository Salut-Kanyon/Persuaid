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
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "bg-background-surface border rounded-card p-8 transition-all duration-300",
        highlighted
          ? "border-green-primary shadow-glow-sm scale-105"
          : "border-border hover:border-green-border hover:shadow-card-hover",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-text-primary mb-2">{name}</h3>
        <p className="text-text-muted text-sm mb-4">{description}</p>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-text-primary">{price}</span>
          {period && (
            <span className="text-text-dim ml-2 text-lg">{period}</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-primary mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-text-secondary text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <CTAButton
        variant={highlighted ? "primary" : "secondary"}
        className="w-full"
        href="#"
      >
        {cta}
      </CTAButton>
    </div>
  );
}
