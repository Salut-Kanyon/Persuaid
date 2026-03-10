import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "default" | "large";
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function CTAButton({
  children,
  variant = "primary",
  size = "default",
  className,
  onClick,
  href,
}: CTAButtonProps) {
  const sizeStyles = {
    default: "px-8 py-4 text-base",
    large: "px-10 py-5 text-lg",
  };
  
  const baseStyles =
    `inline-flex items-center justify-center rounded-button font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transform hover:scale-[1.02] active:scale-[0.98] ${sizeStyles[size]}`;

  const variants = {
    primary:
      "bg-green-primary text-white hover:bg-green-dark focus:ring-green-primary shadow-button hover:shadow-button-hover hover:shadow-glow-button relative overflow-hidden group",
    secondary:
      "bg-transparent text-text-primary border-2 border-border hover:border-green-primary hover:text-green-accent focus:ring-green-primary hover:bg-green-primary/5",
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-green-accent/0 via-green-accent/20 to-green-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      )}
      <span className="relative z-10">{children}</span>
    </Component>
  );
}
