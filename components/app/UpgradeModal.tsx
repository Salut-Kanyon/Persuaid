"use client";

import { useRouter } from "next/navigation";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { openMarketingPricing } from "@/lib/electron-client";
import type { Plan } from "@/lib/entitlements";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Drives copy and styling when the user hit their monthly live-listening limit. */
  plan: Plan;
}

function copyForPlan(plan: Plan) {
  switch (plan) {
    case "pro":
      return {
        badge: "Pro limit reached",
        title: "You’ve used this month’s Pro time",
        message:
          "Your Pro plan includes 20 hours of live listening per month. You’ve hit that cap—upgrade to Team for more airtime each month, or wait until your allowance resets.",
        bullets: [
          "50 hours of live listening per month on Team",
          "Same AI coaching—built for heavy call volume",
          "Change or cancel anytime",
        ],
        primaryLabel: "See Team pricing →",
        footnote: "Team is for power users who need more monthly airtime.",
        primaryOpensPricing: true,
      };
    case "team":
      return {
        badge: "Monthly limit reached",
        title: "You’ve used this month’s Team time",
        message:
          "Your Team plan includes 50 hours of live listening per month. You’ve reached that cap for now—your allowance resets on the first day of next month.",
        bullets: [
          "Saved calls and history stay in your workspace",
          "Same features resume automatically after reset",
          "Questions? We’re happy to help",
        ],
        primaryLabel: "Got it",
        footnote: "Need a higher limit? Email us and we’ll work with you.",
        primaryOpensPricing: false,
      };
    default:
      return {
        badge: "",
        title: "Unlock Pro",
        message:
          "Get full access to live guidance, call analysis, and the complete Persuaid experience.",
        bullets: [
          "Live guidance during calls",
          "Analysis for saved conversations",
          "Full access to Pro features",
        ],
        primaryLabel: "Upgrade to Pro",
        footnote: "Cancel anytime",
        primaryOpensPricing: true,
      };
  }
}

export function UpgradeModal({ open, onClose, plan }: UpgradeModalProps) {
  const router = useRouter();
  const copy = copyForPlan(plan);

  const handlePrimary = () => {
    if (copy.primaryOpensPricing) {
      onClose();
      void openMarketingPricing(router);
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[14px] transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-[400px] overflow-hidden rounded-[20px]",
          "border border-white/[0.07]",
          "bg-[#0e0e0f]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_32px_100px_-24px_rgba(0,0,0,0.85),0_0_1px_rgba(0,0,0,0.5)]",
          "backdrop-blur-2xl",
          "animate-in fade-in zoom-in-[0.985] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[min(100%,28rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.045)_0%,transparent_72%)]"
          aria-hidden
        />

        <div className="relative px-8 pb-9 pt-11 sm:px-10 sm:pb-10 sm:pt-12">
          <div className="mb-10 flex flex-col items-center">
            <div className="flex items-end justify-center gap-0 opacity-[0.92]">
              <img
                src={PERSUAID_MARK_PNG}
                alt=""
                className="h-8 w-8 flex-shrink-0 object-contain translate-y-0.5"
                width={32}
                height={32}
              />
              <span className="-ml-0.5 translate-y-1 text-[1.125rem] font-semibold tracking-[-0.02em] text-text-primary/90">
                ersuaid
              </span>
            </div>
            {copy.badge ? (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium tracking-wide text-text-muted">
                <svg className="h-3 w-3 text-text-dim/80" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {copy.badge}
              </span>
            ) : null}
          </div>

          <h2
            id="upgrade-modal-title"
            className="text-center text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.035em] text-text-primary sm:text-[1.5rem]"
          >
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[19rem] text-center text-[15px] leading-relaxed text-text-muted/95">
            {copy.message}
          </p>

          <ul className="mb-10 mt-9 space-y-2.5">
            {copy.bullets.map((benefit, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[13px] leading-snug text-text-secondary/95"
              >
                <span
                  className="mt-[3px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]"
                  aria-hidden
                >
                  <svg
                    className="h-2.5 w-2.5 text-text-dim/90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.25}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="min-w-0 pt-px">{benefit}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handlePrimary}
            className={cn(
              "w-full rounded-[13px] px-5 py-3.5 text-[15px] font-semibold tracking-[-0.015em] text-white",
              "bg-[#1a9d78] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
              "transition-[background-color,box-shadow,filter] duration-200 ease-out",
              "hover:brightness-[1.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_28px_-12px_rgba(26,157,120,0.45)]",
              "active:brightness-[0.96] active:scale-[0.995]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e0f]"
            )}
          >
            {copy.primaryLabel}
          </button>

          <p className="mt-5 text-center text-[11px] font-normal tracking-[0.02em] text-text-dim/55">
            {copy.footnote}
          </p>

          {copy.primaryOpensPricing && (
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full py-1.5 text-[13px] font-normal text-text-dim/65 transition-colors duration-200 hover:text-text-muted/90 focus:outline-none focus-visible:underline"
            >
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
