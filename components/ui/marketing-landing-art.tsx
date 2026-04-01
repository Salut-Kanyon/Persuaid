"use client";

import { cn } from "@/lib/utils";

/** Full-bleed forest hero art — same asset and crop as `Hero` (landing). */
export function MarketingLandingBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[var(--bg-near-black)]" aria-hidden>
        <div
          className="absolute bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url(/LandingPageBack.jpeg?v=3)",
            top: "-6%",
            left: "-10%",
            right: "-10%",
            bottom: "-4%",
            backgroundPosition: "50% 8%",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-[var(--bg-near-black)] via-[var(--bg-near-black)]/70 to-transparent"
        aria-hidden
      />
    </>
  );
}

/** Hairline between headline and subtitle — matches `Hero`. */
export function MarketingHeroHeadlineDivider() {
  return (
    <div
      className="mx-auto mt-5 w-[min(18rem,88%)] max-w-full px-2 sm:mt-6 sm:w-[min(20rem,82%)]"
      aria-hidden
    >
      <div
        className="h-px w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, transparent 10%, rgba(244, 241, 234, 0.2) 22%, rgba(244, 241, 234, 0.52) 42%, rgba(244, 241, 234, 0.52) 58%, rgba(244, 241, 234, 0.2) 78%, transparent 90%, transparent 100%)",
          boxShadow: "0 0 12px rgba(244, 241, 234, 0.12)",
        }}
      />
    </div>
  );
}

/** Same classes as the landing `Hero` title lines. */
export const marketingHeroTitleClassName =
  "font-display text-[clamp(1.9rem,7.2vw,4.15rem)] leading-[1.05] font-normal tracking-[-0.02em] text-text-primary";

/** Same classes as the landing `Hero` subtitle paragraph. */
export const marketingHeroSubtitleClassName =
  "font-subtitle mt-4 text-[17px] leading-snug sm:mt-5 sm:text-[18px] sm:leading-relaxed lg:text-[19px] text-text-secondary max-w-md sm:max-w-2xl mx-auto font-normal text-balance tracking-[-0.01em]";
