import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  children: ReactNode;
  /** workspace = same refined gradient as dashboard “Start PersuAId” (minimal, no neon glow). */
  variant?: "primary" | "secondary" | "workspace";
  size?: "default" | "large" | "compact";
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
    compact: "px-6 py-3 text-sm",
  };

  const roundedForVariant =
    variant === "workspace" ? "rounded-full" : "rounded-button";

  const baseStyles = cn(
    "inline-flex items-center justify-center font-medium ease-out focus:outline-none",
    size === "compact" || variant === "workspace" ? "duration-200" : "duration-300 transition-colors",
    roundedForVariant,
    variant === "workspace"
      ? "focus-visible:ring-2 focus-visible:ring-green-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      : "focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
    sizeStyles[size]
  );

  const variants = {
    primary: cn(
      "bg-green-primary text-white hover:bg-green-dark focus:ring-green-primary/40"
    ),
    secondary:
      "border border-border bg-transparent text-text-primary hover:border-white/20 hover:bg-white/[0.04] focus:ring-white/20",
    workspace: cn(
      "relative overflow-hidden text-white",
      "bg-gradient-to-b from-[#2bbf96] via-[#1a9d78] to-[#136b55]",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-full",
      "before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-[0.55]",
      "border border-white/15",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_12px_rgba(0,0,0,0.35)]",
      "hover:brightness-[1.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_18px_rgba(0,0,0,0.42)]",
      "active:scale-[0.98] active:brightness-[0.97]",
      "disabled:hover:brightness-100 disabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_12px_rgba(0,0,0,0.35)] disabled:active:scale-100"
    ),
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], disabled && "opacity-60 cursor-not-allowed", className)}
    >
      {variant === "workspace" ? <span className="relative z-10">{children}</span> : children}
    </Component>
  );
}
