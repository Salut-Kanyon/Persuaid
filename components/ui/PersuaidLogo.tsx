/**
 * Persuaid logo mark – refined "P" in a rounded container.
 * Use className to control size (e.g. w-8 h-8, w-12 h-12).
 * `neutral` — monochrome for Apple-style chrome (no brand green).
 * `onAccent` — light mark for sitting on green / saturated buttons.
 */
export function PersuaidLogo({
  className = "w-10 h-10",
  variant = "brand",
  onAccent = false,
}: {
  className?: string;
  variant?: "brand" | "neutral";
  /** White / frosted mark for green pill buttons */
  onAccent?: boolean;
}) {
  const neutral = variant === "neutral";
  const rectClass = onAccent
    ? "fill-white/25 stroke-white/40"
    : neutral
      ? "fill-white/[0.07] stroke-white/[0.14]"
      : "fill-green-primary/15 stroke-green-primary/30";
  const pathClass = onAccent ? "text-white" : neutral ? "text-white/[0.88]" : "text-green-primary";
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" className={rectClass} strokeWidth="1.25" />
      <path
        d="M15 11v18M15 11h5.5a5.5 5.5 0 1 1 0 11H15"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pathClass}
      />
    </svg>
  );
}
