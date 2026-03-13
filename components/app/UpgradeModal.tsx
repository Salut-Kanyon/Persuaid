"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UpgradeModal({
  open,
  onClose,
  title = "Unlock your full potential",
  message = "You're one upgrade away from AI that never leaves your side.",
}: UpgradeModalProps) {
  const router = useRouter();

  const handleViewPricing = () => {
    onClose();
    router.push("/pricing");
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
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-3xl",
          "bg-gradient-to-b from-[#0d1117] via-[#111827] to-[#0a0a0a]",
          "border border-green-primary/30 shadow-2xl shadow-green-primary/10",
          "animate-in fade-in zoom-in-95 duration-300"
        )}
      >
        {/* Glow accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-primary/60 to-transparent" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-32 bg-green-primary/10 blur-3xl pointer-events-none" />

        <div className="relative p-8">
          {/* Logo + lock badge */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-end gap-0 mb-3">
              <img
                src="/PersuaidLogo.png"
                alt="Persuaid"
                className="w-12 h-12 flex-shrink-0 object-contain"
              />
              <span className="text-2xl font-bold text-text-primary tracking-tight -ml-1 translate-y-1">
                ersuaid
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Pro feature
            </span>
          </div>

          <h2 id="upgrade-modal-title" className="text-xl sm:text-2xl font-bold text-text-primary text-center mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-center text-text-muted text-sm sm:text-base mb-6 max-w-sm mx-auto">
            {message}
          </p>

          {/* Benefit bullets */}
          <ul className="space-y-3 mb-8">
            {[
              "Unlimited AI suggestions on every call",
              "Real-time coaching & follow-up questions",
              "Generate analysis on saved calls",
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-primary/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleViewPricing}
            className={cn(
              "w-full rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-200",
              "bg-gradient-to-r from-green-primary to-emerald-500 text-black",
              "hover:from-green-accent hover:to-emerald-400 hover:shadow-lg hover:shadow-green-primary/25 hover:scale-[1.02] active:scale-[0.98]",
              "border-0 focus:outline-none focus:ring-2 focus:ring-green-primary focus:ring-offset-2 focus:ring-offset-[#0d1117]"
            )}
          >
            See pricing & start free trial →
          </button>
          <p className="text-center text-xs text-text-dim mt-3">
            No card required for trial · Cancel anytime
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-2 text-xs font-medium text-text-dim hover:text-text-muted transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
