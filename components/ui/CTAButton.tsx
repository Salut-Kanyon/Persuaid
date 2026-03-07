import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function CTAButton({
  children,
  variant = "primary",
  className,
  onClick,
  href,
}: CTAButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center px-6 py-3 rounded-button font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background";

  const variants = {
    primary:
      "bg-green-primary text-white hover:bg-green-dark focus:ring-green-primary shadow-lg hover:shadow-glow-sm",
    secondary:
      "bg-transparent text-text-primary border-2 border-border hover:border-green-primary hover:text-green-accent focus:ring-green-primary",
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </Component>
  );
}
