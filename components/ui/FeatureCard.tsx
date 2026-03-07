import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "bg-background-surface border border-border rounded-card p-6 transition-all duration-300 hover:border-green-border hover:shadow-card-hover hover:-translate-y-1",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-green-primary text-2xl">{icon}</div>
      )}
      <h3 className="text-xl font-semibold mb-2 text-text-primary">{title}</h3>
      <p className="text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}
