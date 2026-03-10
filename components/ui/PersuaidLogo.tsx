/**
 * Persuaid logo mark – refined "P" in a rounded container.
 * Use className to control size (e.g. w-8 h-8, w-12 h-12).
 */
export function PersuaidLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Rounded square background */}
      <rect
        width="40"
        height="40"
        rx="10"
        className="fill-green-primary/15 stroke-green-primary/30"
        strokeWidth="1.25"
      />
      {/* Refined P: vertical stem + curved bowl */}
      <path
        d="M15 11v18M15 11h5.5a5.5 5.5 0 1 1 0 11H15"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-primary"
      />
    </svg>
  );
}
