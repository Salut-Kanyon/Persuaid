"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type NavbarLiveDemoProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Scroll target when opening (default: hero demo slot) */
  scrollTargetId?: string;
};

type NavbarProps = {
  /** When set, floating CTA opens the in-page live demo instead of linking to sign-in */
  liveDemo?: NavbarLiveDemoProps;
};

export function Navbar({ liveDemo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCtaButton, setShowCtaButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA when scrolled past 400px (hero section)
      setShowCtaButton(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Home", href: "/" },
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
        <div className="fixed top-4 right-4 z-50 hidden w-[min(calc(100vw-2rem),320px)] flex-col items-stretch md:flex animate-in fade-in slide-in-from-top-2">
          {liveDemo ? (
            <div
              className={cn(
                "overflow-hidden rounded-2xl border border-green-primary/50 bg-black/95 shadow-xl shadow-black/40 backdrop-blur-md",
                liveDemo.isOpen ? "ring-1 ring-green-primary/30" : ""
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
                    src="/PersuaidLogo.png"
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
                  className="text-green-primary/90 shrink-0"
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
                        className="mt-2.5 text-xs font-semibold text-emerald-400/95 hover:text-emerald-300 transition-colors"
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
              href="/sign-in"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 border border-green-primary/60 bg-black text-white hover:bg-gray-900 hover:border-green-primary/80 hover:shadow-xl shadow-lg"
            >
              <img
                src="/PersuaidLogo.png"
                alt="Persuaid"
                className="w-4 h-4 flex-shrink-0 object-contain"
              />
              <span>Try Free</span>
            </a>
          )}
        </div>
      )}

      {/* Regular Navbar - scrolls with page */}
      <nav className="bg-background-near-black/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 lg:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-end gap-0 group">
                <img
                  src="/PersuaidLogo.png"
                  alt="Persuaid"
                  className="w-8 h-8 flex-shrink-0 object-contain translate-y-0.5 group-hover:opacity-90 transition-opacity duration-300"
                />
                <span className="text-xl font-bold text-text-primary tracking-tight -ml-1 translate-y-2 group-hover:text-green-accent transition-colors duration-300">
                  ersuaid
                </span>
              </a>
            </div>

            {/* Desktop Navigation - links + CTA */}
            <div className="hidden md:flex md:items-center md:gap-8 md:ml-auto">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-text-secondary hover:text-green-accent transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-primary group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300",
              mobileMenuOpen ? "max-h-64 pb-4" : "max-h-0"
            )}
          >
            <div className="flex flex-col space-y-4 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-text-secondary hover:text-green-accent transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
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
