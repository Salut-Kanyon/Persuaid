"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { MARKETING_SITE_ORIGIN, isElectronApp, openMarketingUrl } from "@/lib/electron-client";

export type NavbarLiveDemoProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Scroll target when opening (default: hero demo slot) */
  scrollTargetId?: string;
};

type NavbarProps = {
  /** When set, floating CTA opens the in-page live demo instead of linking to sign-in */
  liveDemo?: NavbarLiveDemoProps;
  /** Home marketing: fixed bar, translucent — hero art shows through the top */
  landing?: boolean;
};

export function Navbar({ liveDemo, landing = false }: NavbarProps) {
  const [showCtaButton, setShowCtaButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA when scrolled past 400px (hero section)
      setShowCtaButton(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: Array<{ label: string; href: string; marketingOnly?: boolean }> = [
    { label: "Pricing", href: "/pricing", marketingOnly: true },
    { label: "Tutorial", href: "/tutorial" },
  ];

  const scrollToDemo = useCallback(() => {
    const id = liveDemo?.scrollTargetId ?? "hero-demo-panel";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [liveDemo?.scrollTargetId]);

  const handleFloatingDemoClick = () => {
    if (!liveDemo) return;
    if (liveDemo.isOpen) {
      liveDemo.onOpenChange(false);
      return;
    }
    liveDemo.onOpenChange(true);
    requestAnimationFrame(() => {
      scrollToDemo();
    });
  };

  return (
    <>
      {/* Fixed CTA — Try Free (default) or Live demo (home) */}
      {showCtaButton && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 hidden w-[min(calc(100vw-2rem),320px)] flex-col items-stretch md:flex animate-in fade-in slide-in-from-top-2",
            landing && "landing-floating-cta"
          )}
        >
          {liveDemo ? (
            <div
              className={cn(
                "w-[min(calc(100vw-2rem),320px)] overflow-hidden rounded-xl border border-stone-600/40 bg-[color:var(--bg-near-black)]/95 shadow-lg shadow-black/35 backdrop-blur-md",
                liveDemo.isOpen ? "ring-1 ring-stone-500/25" : ""
              )}
            >
              <button
                type="button"
                onClick={handleFloatingDemoClick}
                aria-expanded={liveDemo.isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <img
                    src={PERSUAID_MARK_PNG}
                    alt=""
                    className="h-4 w-4 shrink-0 object-contain"
                    width={16}
                    height={16}
                  />
                  <span className="truncate">{liveDemo.isOpen ? "Close demo" : "Demo"}</span>
                </span>
                <motion.span
                  animate={{ rotate: liveDemo.isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-stone-400 shrink-0"
                  aria-hidden
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {liveDemo.isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="px-4 py-3 text-left">
                      <p className="text-[11px] leading-relaxed text-zinc-400">
                        The interactive workspace is open in the hero below. Scroll to try talking and AI responses, or
                        jump there now.
                      </p>
                      <button
                        type="button"
                        onClick={scrollToDemo}
                        className="mt-2.5 text-xs font-semibold text-[color:var(--landing-accent)] hover:text-text-primary transition-colors"
                      >
                        Jump to workspace ↓
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <a
              href="/download"
              className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] px-3.5 text-[12px] font-semibold tracking-[-0.02em] text-white shadow-[0_0_0_1px_rgba(26,157,120,0.4),0_3px_12px_rgba(26,157,120,0.35)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.05] hover:shadow-[0_0_0_1px_rgba(61,184,146,0.5),0_4px_16px_rgba(26,157,120,0.45)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-near-black)] border border-[#4dc49a]/45 sm:px-4 sm:text-[13px]"
            >
              Download Now
            </a>
          )}
        </div>
      )}

      {/* Landing: sits over hero in page flow (scrolls away); app: normal sticky chrome */}
      <nav
        data-landing-navbar={landing ? "1" : "0"}
        className={cn(
          "w-full border-b",
          landing
            ? "absolute top-0 left-0 right-0 z-30 border-white/10 bg-black/45 backdrop-blur-md"
            : "relative z-50 bg-background-near-black/80 backdrop-blur-xl border-border/50"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-end gap-10 pb-3 sm:gap-16 lg:h-20 lg:gap-[4.5rem] lg:pb-4">
            <a
              href="/"
              className="group inline-flex min-w-0 shrink-0 items-end gap-0 py-1"
              aria-label="Persuaid home"
            >
              <>
                <img
                  src={PERSUAID_MARK_PNG}
                  alt=""
                  width={40}
                  height={40}
                  aria-hidden
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 shrink-0 object-contain translate-y-0.5 group-hover:opacity-90 transition-opacity duration-300"
                />
                <span
                  className={cn(
                    "text-base sm:text-lg md:text-lg font-bold tracking-[-0.02em] -ml-1 translate-y-1 group-hover:opacity-90 transition-opacity duration-300",
                    landing ? "text-stone-100" : "text-text-primary"
                  )}
                  aria-hidden
                >
                  ersuaid
                </span>
              </>
            </a>

            <div className="flex items-end gap-5 sm:gap-6 lg:gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={
                    link.marketingOnly && isElectronApp()
                      ? `${MARKETING_SITE_ORIGIN}${link.href}`
                      : link.href
                  }
                  onClick={
                    link.marketingOnly
                      ? (e) => {
                          if (!isElectronApp()) return;
                          e.preventDefault();
                          void openMarketingUrl(`${MARKETING_SITE_ORIGIN}${link.href}`);
                        }
                      : undefined
                  }
                  className={cn(
                    "shrink-0 leading-none transition-colors",
                    landing
                      ? "-translate-y-1.5 pb-0 text-[0.8125rem] font-semibold tracking-[-0.02em] text-stone-200/95 hover:text-stone-100 sm:text-[0.9375rem]"
                      : "-translate-y-1.5 pb-0.5 text-sm font-semibold tracking-tight text-text-secondary hover:text-text-primary"
                  )}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
