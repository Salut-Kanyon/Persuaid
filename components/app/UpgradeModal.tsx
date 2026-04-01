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

/** Dark shell — no green wash on the modal frame (CTA stays brand green). */
const MODAL_SHELL = {
  shell: "border border-white/[0.08] bg-[color:var(--bg-near-black)] shadow-2xl",
  glow: "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04)_0%,transparent_65%)]",
  topLine: "from-transparent via-white/15 to-transparent",
};

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
        title: "You’ve used your included time",
        message:
          "Your free monthly minutes are used up for now. Upgrade for more live call time each month, or wait until next month to use the free tier again.",
        bullets: [
          "Unlimited AI suggestions on every call",
          "Real-time coaching & follow-up questions",
          "Generate analysis on saved calls",
        ],
        primaryLabel: "See pricing & upgrade →",
        footnote: "More live call time each month on Pro · Cancel anytime",
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-3xl",
          "animate-in fade-in zoom-in-95 duration-300",
          MODAL_SHELL.shell
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent",
            MODAL_SHELL.topLine
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-0 h-40 w-[28rem] -translate-x-1/2 blur-2xl",
            MODAL_SHELL.glow
          )}
        />

        <div className="relative p-8">
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-end gap-0">
              <img
                src={PERSUAID_MARK_PNG}
                alt="Persuaid"
                className="h-12 w-12 flex-shrink-0 object-contain"
              />
              <span className="-ml-1 translate-y-1 text-2xl font-bold tracking-tight text-text-primary">
                ersuaid
              </span>
            </div>
            {copy.badge ? (
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-text-secondary"
              >
                <svg className="h-3.5 w-3.5 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
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
            className="mb-2 text-center text-xl font-bold tracking-tight text-text-primary sm:text-2xl"
          >
            {copy.title}
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-center text-sm text-text-muted sm:text-base">
            {copy.message}
          </p>

          <ul className="mb-8 space-y-3">
            {copy.bullets.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-primary/20">
                  <svg
                    className="h-3 w-3 text-green-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handlePrimary}
            className={cn(
              "w-full rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-200",
              "bg-gradient-to-r from-green-primary to-emerald-500 text-black",
              "hover:from-green-accent hover:to-emerald-400 hover:shadow-lg hover:shadow-green-primary/25",
              "hover:scale-[1.02] active:scale-[0.98]",
              "border-0 focus:outline-none focus:ring-2 focus:ring-green-primary focus:ring-offset-2 focus:ring-offset-[color:var(--bg-near-black)]"
            )}
          >
            {copy.primaryLabel}
          </button>
          <p className="mt-3 text-center text-xs text-text-dim">{copy.footnote}</p>

          {copy.primaryOpensPricing && (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-2 text-xs font-medium text-text-dim transition-colors hover:text-text-muted"
            >
              Maybe later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
