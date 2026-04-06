"use client";

import Link from "next/link";

/**
 * Slim strip above the marketing navbar (home). Research note + link — neutral “system” styling.
 */
export function LandingResearchBanner() {
  return (
    <div
      role="region"
      aria-label="Research"
      className="relative z-[100] w-full bg-black/35 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-2.5 sm:px-6 sm:py-2.5 lg:px-8">
        <p className="max-w-[min(100%,40rem)] text-center text-[12px] leading-snug text-white/[0.74] sm:text-[13px] sm:leading-[1.45]">
          Over 1,000 cold call interviews done to figure this out.{" "}
          <Link
            href="/what-we-found-out"
            className="inline-flex items-center gap-0.5 font-medium text-white/[0.58] transition-colors hover:text-white/[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-near-black)]"
          >
            Read more
            <span className="text-white/[0.45]" aria-hidden>
              →
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
