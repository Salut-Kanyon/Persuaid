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
        "bg-background-surface border border-border rounded-card p-8 transition-all duration-500 hover:border-green-primary/40 hover:shadow-card-elevated hover:-translate-y-2 group relative overflow-hidden",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-primary/0 via-green-primary/0 to-green-primary/0 group-hover:from-green-primary/5 group-hover:via-green-primary/0 group-hover:to-green-primary/0 transition-all duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        {icon && (
          <div className="mb-6 text-green-primary text-3xl transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-bold mb-3 text-text-primary tracking-tight">{title}</h3>
        <p className="text-text-muted leading-relaxed text-[15px]">{description}</p>
      </div>
    </div>
  );
}
