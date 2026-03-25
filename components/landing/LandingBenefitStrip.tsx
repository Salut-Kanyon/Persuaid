import { cn } from "@/lib/utils";

const STRIP_ITEMS = [
  "What to say next, the moment you need it",
  "Nothing joins the call—only you see the coaching",
  "Lines from your playbook—not generic AI",
] as const;

function StripCheckIcon({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        /* Flat forest green — matches paper-cut hero palette */
        "bg-[color:var(--landing-forest)] border border-[color:var(--landing-sage)]/45 shadow-inner",
        compact ? "h-4 w-4" : "h-[22px] w-[22px]"
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 16 16"
        className={cn(
          "text-[color:var(--landing-accent-soft)]",
          compact ? "size-[9px]" : "size-[11px]"
        )}
        fill="none"
      >
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

/**
 * Benefit checklist for the landing hero.
 * `compact` — tighter for above-the-fold (e.g. between CTAs and video).
 */
export function LandingBenefitStrip({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-stone-500/20",
        "bg-stone-950/35",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
        compact ? "rounded-lg" : "rounded-xl",
        className
      )}
      role="region"
      aria-label="Key benefits"
    >
      <div
        className={cn(
          "relative flex flex-col sm:flex-row sm:items-center sm:gap-0",
          compact
            ? "gap-2 px-3 py-2.5 sm:gap-0 sm:px-4 sm:py-3 lg:px-5"
            : "gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4 lg:px-7"
        )}
      >
        {STRIP_ITEMS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex flex-1 items-center justify-center text-center sm:min-h-0 sm:justify-center sm:text-left",
              compact ? "gap-2 sm:gap-2 sm:px-1.5 lg:px-2" : "gap-3 sm:gap-2.5 sm:px-2 lg:px-3",
              i > 0 && "sm:border-l sm:border-stone-600/25"
            )}
          >
            <StripCheckIcon compact={compact} />
            <span
              className={cn(
                "max-w-[16rem] font-medium leading-snug tracking-tight text-text-primary/95 sm:max-w-none",
                compact ? "text-[12px] sm:text-[13px]" : "text-[13px] sm:text-sm"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
