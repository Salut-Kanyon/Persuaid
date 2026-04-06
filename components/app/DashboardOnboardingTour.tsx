"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isElectronApp } from "@/lib/electron-client";
import { useSession } from "@/components/app/contexts/SessionContext";

const STORAGE_KEY = "persuaid-desktop-dashboard-tour-v2";

const STEPS = [
  {
    title: "Add your notes",
    body: "Put in your product knowledge—pricing, policies, talk tracks, anything Persuaid should know for calls.",
  },
  {
    title: "Connect with AI",
    body: "Then connect with AI so we can turn those notes into a clean layer the copilot uses live.",
  },
  {
    title: "Start Persuaid",
    body: "When you’re on a call, tap Start Persuaid in the header so Persuaid can listen and suggest what to say next.",
  },
] as const;

export function DashboardOnboardingTour() {
  const pathname = usePathname();
  const { isRecording } = useSession();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (!isElectronApp()) return;
    const normalized = (pathname || "").replace(/\/$/, "") || "/";
    if (normalized !== "/dashboard") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "done") return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setActive(true), 500);
    return () => window.clearTimeout(t);
  }, [mounted, pathname]);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* ignore */
    }
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active || !isRecording) return;
    finish();
  }, [active, isRecording, finish]);

  const onNext = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  }, [step, finish]);

  if (!mounted || !active || typeof document === "undefined") return null;

  const current = STEPS[step];
  if (!current) return null;

  /**
   * No full-screen scrim, no backdrop-blur, no anchor math (those broke positioning in Electron).
   * Single fixed card at the bottom so it’s always on-screen and the workspace stays sharp behind it.
   */
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[600] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
      style={{ isolation: "isolate" }}
    >
      <div
        className="pointer-events-auto w-full max-w-md rounded-xl border border-white/20 bg-[#0e0e10] p-4 text-left shadow-[0_-8px_40px_rgba(0,0,0,0.75)]"
        role="dialog"
        aria-modal="false"
        aria-labelledby="dashboard-tour-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 id="dashboard-tour-title" className="mt-1 text-base font-semibold tracking-tight text-white">
          {current.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{current.body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
          >
            Skip tour
          </button>
          <div className="ml-auto flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors",
                "bg-green-primary hover:bg-green-dark"
              )}
            >
              {step >= STEPS.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
