import { cn } from "@/lib/utils";

const STRIP_ITEMS = [
  "Real-time lines the moment you need them",
  "Nothing joins the call—coaching stays on your screen",
  "Answers shaped by your playbook, not generic AI",
] as const;

function StripCheckIcon({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br from-emerald-300/95 via-green-primary to-teal-700/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(6,95,70,0.45),0_4px_16px_rgba(16,185,129,0.28)]",
        compact ? "h-4 w-4" : "h-[22px] w-[22px]"
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 16 16"
        className={cn(
          "text-white [filter:drop-shadow(0_0.5px_0_rgba(0,0,0,0.25))]",
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
        "relative w-full overflow-hidden border border-white/[0.09]",
        "bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-transparent",
        "shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "backdrop-blur-xl backdrop-saturate-150",
        "ring-1 ring-inset ring-white/[0.05]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-green-primary/35 before:to-transparent",
        compact ? "rounded-xl" : "rounded-2xl",
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
              i > 0 && "sm:border-l sm:border-white/[0.08]"
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
