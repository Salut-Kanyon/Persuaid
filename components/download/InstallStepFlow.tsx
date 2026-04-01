"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type InstallPlatform = "mac" | "windows";

const MAC_LINES = ["Download the .dmg", "Move the app to Applications", "Open it from Applications"] as const;

const WIN_LINES = ["Download the installer", "Run it — add to Programs", "Open from the Start menu"] as const;

const BADGE: [string, string][] = [
  ["from-white/90 via-zinc-200/80 to-zinc-400/45", "text-neutral-900"],
  ["from-zinc-300/55 via-zinc-500/40 to-zinc-700/55", "text-white"],
  ["from-zinc-700/70 via-neutral-800/85 to-black", "text-white/95"],
];

function ListGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

export function InstallStepFlow({ platform }: { platform: InstallPlatform }) {
  const reduce = useReducedMotion();
  const lines = platform === "mac" ? MAC_LINES : WIN_LINES;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="relative flex w-full flex-col items-center">
      {/* Compact pill trigger — not full-width */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        id={`${panelId}-trigger`}
        className={cn(
          "group relative mx-auto flex max-w-full items-center gap-2 rounded-full border border-white/[0.12] px-1.5 py-1.5 pl-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)]",
          "bg-gradient-to-b from-white/[0.09] to-white/[0.02] backdrop-blur-md",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_40px_-12px_rgba(0,0,0,0.5)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/[0.04] text-white/80">
          <ListGlyph className="h-3.5 w-3.5" />
        </span>
        <span className="pr-1 text-[0.8125rem] font-medium tracking-[-0.02em] text-white/90 sm:text-[0.875rem]">
          How To Download?
        </span>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/55 transition-transform duration-200 ease-out",
            open && "rotate-180"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={`${panelId}-trigger`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full overflow-hidden"
          >
            <div className="mx-auto w-full max-w-sm pt-4 sm:pt-5">
                  <div
                className={cn(
                  "rounded-2xl border border-white/[0.09] bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                  "backdrop-blur-md"
                )}
              >
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-[0.8125rem] top-3 bottom-3 w-px bg-gradient-to-b from-white/25 via-white/10 to-white/20"
                    aria-hidden
                  />
                  <ol className="relative space-y-0">
                  {lines.map((text, i) => {
                    const [bg, numClass] = BADGE[i]!;
                    return (
                      <li key={`step-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
                        <span
                          className={cn(
                            "relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[0.6875rem] font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                            bg,
                            numClass
                          )}
                        >
                          {i + 1}
                        </span>
                        <p className="min-w-0 flex-1 pt-0.5 text-[0.875rem] font-medium leading-snug tracking-[-0.02em] text-zinc-100/95 sm:text-[0.9rem]">
                          {text}
                        </p>
                      </li>
                    );
                  })}
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
