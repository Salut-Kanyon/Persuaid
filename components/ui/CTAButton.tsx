import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "default" | "large";
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

export function CTAButton({
  children,
  variant = "primary",
  size = "default",
  className,
  onClick,
  href,
  disabled = false,
}: CTAButtonProps) {
  const sizeStyles = {
    default: "px-8 py-4 text-base",
    large: "px-10 py-5 text-lg",
  };
  
  const baseStyles =
    `inline-flex items-center justify-center rounded-button font-medium transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${sizeStyles[size]}`;

  const variants = {
    primary:
      "bg-green-primary text-white hover:bg-green-dark focus:ring-green-primary/40",
    secondary:
      "border border-border bg-transparent text-text-primary hover:border-white/20 hover:bg-white/[0.04] focus:ring-white/20",
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], disabled && "opacity-60 cursor-not-allowed", className)}
    >
      {children}
    </Component>
  );
}
