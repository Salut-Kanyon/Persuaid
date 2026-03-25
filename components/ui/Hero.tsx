"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingHeroVideo } from "@/components/landing/LandingHeroVideo";
import { LandingBenefitStrip } from "@/components/landing/LandingBenefitStrip";

const FADE_START = 0;
const FADE_END = 950;

const HERO_TITLE_LINE1 = "Never freeze on a";
const HERO_TITLE_LINE2 = "sales call again.";
const HERO_LINE1_WORDS = HERO_TITLE_LINE1.split(" ");
const HERO_LINE2_WORDS = HERO_TITLE_LINE2.split(" ");

const HERO_SUBTITLE_AFTER_PERSUAID =
  "shows you what to say next—in real time, grounded in your playbook. No guesswork. You stay in control.";

function HeroTitleTwoLines() {
  const reduce = useReducedMotion();
  const words1 = HERO_LINE1_WORDS;
  const words2 = HERO_LINE2_WORDS;
  /* Tighter display type: confident, not shouty — reads editorial, not “growth hack” */
  const lineClass =
    "block whitespace-nowrap text-[clamp(1.5rem,6.25vw,3.5rem)] leading-[1.08] font-semibold text-text-primary tracking-[-0.03em]";

  const renderLine = (words: string[], baseIndex: number) =>
    words.map((word, i) => {
      const index = baseIndex + i;
      const stripped = word.replace(/[.,!?]/g, "");
      const isPersuaid = stripped === "Persuaid";
      const isAi = stripped === "AI";
      return (
        <span key={`${baseIndex}-${i}`} className="inline-block whitespace-pre">
          <motion.span
            initial={{ opacity: 0, y: reduce ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0.01 : 0.35,
              delay: reduce ? 0 : index * 0.06,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className={cn((isPersuaid || isAi) && "text-[color:var(--landing-accent)]")}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      );
    });

  return (
    <span className="flex flex-col items-center gap-1.5 sm:gap-2">
      <span className={lineClass}>{renderLine(words1, 0)}</span>
      <span className={lineClass}>{renderLine(words2, words1.length)}</span>
    </span>
  );
}

type HeroProps = {
  demoOpen?: boolean;
  onDemoOpenChange?: (open: boolean) => void;
  /** Interactive demo panel — swaps into the video slot when open */
  children?: ReactNode;
  /** Home + fixed glass navbar: extra top padding; full-bleed cover bg anchored to top */
  landing?: boolean;
};

export function Hero({ demoOpen = false, onDemoOpenChange, children, landing = false }: HeroProps = {}) {
  const reduceMotion = useReducedMotion();
  const [scrollFade, setScrollFade] = useState(1);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      const opacity = Math.max(0, 1 - (y - FADE_START) / FADE_END);
      setScrollFade(opacity);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stagger subtitle and CTA after word-by-word title finishes
  useEffect(() => {
    const t1 = setTimeout(() => setShowSubtitle(true), 1200);
    const t2 = setTimeout(() => setShowCTA(true), 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const bgOpacity = demoOpen ? 0 : scrollFade;

  return (
    <div
      className={cn(
        "relative min-h-[100dvh] bg-background-near-black flex justify-center items-start pb-20 sm:pb-24",
        "overflow-x-hidden overflow-y-visible",
        landing ? "pt-24 sm:pt-28 lg:pt-28" : "pt-8 sm:pt-10 lg:pt-12"
      )}
    >
      {/* Full-bleed art: cover fills viewport; top anchor keeps charcoal “sky” visible under the nav */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: "url(/hero-landing-bg.png?v=9)",
          opacity: bgOpacity,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-[var(--bg-near-black)] via-[var(--bg-near-black)]/70 to-transparent"
        style={{ opacity: bgOpacity }}
        aria-hidden
      />

      <div
        className={cn(
          "mx-auto w-full px-5 sm:px-8 lg:px-10 relative z-10",
          demoOpen ? "max-w-[min(92rem,calc(100vw-2rem))]" : "max-w-5xl"
        )}
      >
        <div className="flex flex-col items-center w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center w-full max-w-[42rem] mx-auto"
          >
            <h1 className="text-center">
              <HeroTitleTwoLines />
            </h1>

            <div
              className="mx-auto mt-4 max-w-[min(24rem,90vw)] px-2 sm:mt-5 sm:max-w-xl"
              aria-hidden
            >
              <div className="h-px w-full max-w-xs mx-auto bg-[color:var(--landing-sand)]/30" />
            </div>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
              animate={{
                opacity: showSubtitle ? 1 : 0,
                y: reduceMotion ? 0 : showSubtitle ? 0 : 6,
              }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-6 text-[15px] sm:mt-8 sm:text-[16px] text-text-secondary mb-8 sm:mb-10 max-w-md sm:max-w-lg mx-auto leading-relaxed font-normal text-balance"
            >
              <span className="block">
                <span className="font-medium text-[color:var(--landing-accent-soft)]">Persuaid</span>{" "}
                {HERO_SUBTITLE_AFTER_PERSUAID}
              </span>
            </motion.p>

            <motion.div
              initial="hidden"
              animate={showCTA ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: reduceMotion
                    ? { duration: 0.01 }
                    : { staggerChildren: 0.06, delayChildren: 0.04 },
                },
              }}
              className="mx-auto flex w-full max-w-2xl flex-col items-center"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: reduceMotion ? 0.01 : 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  },
                }}
                className="flex w-full max-w-xl flex-row flex-nowrap items-stretch justify-center gap-3 sm:mx-auto sm:gap-4"
              >
                {onDemoOpenChange && (
                  <motion.button
                    type="button"
                    onClick={() => onDemoOpenChange(!demoOpen)}
                    aria-expanded={demoOpen}
                    aria-controls="hero-demo-panel"
                    transition={{ type: "spring", stiffness: 520, damping: 32 }}
                    className={cn(
                      "inline-flex min-h-[48px] flex-1 items-center justify-center rounded-lg px-6 text-[15px] font-medium tracking-tight",
                      "border border-stone-500/40 bg-stone-950/40 text-stone-200",
                      "hover:bg-stone-900/60 hover:border-stone-500/55 transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-near-black)]",
                      "min-w-0 sm:min-h-[48px] sm:min-w-[11rem]"
                    )}
                  >
                    {demoOpen ? "Back" : "Free demo"}
                  </motion.button>
                )}
                <motion.a
                  href="/sign-in"
                  transition={{ type: "spring", stiffness: 520, damping: 32 }}
                  className={cn(
                    "group inline-flex min-h-[48px] flex-1 items-center justify-center rounded-lg px-5 text-center text-[15px] font-medium tracking-tight sm:px-7 sm:text-[15px]",
                    "bg-[color:var(--landing-moss)] text-stone-100 border border-white/10",
                    "shadow-sm hover:bg-[color:var(--landing-moss-hover)] transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--landing-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-near-black)]",
                    "min-w-0 sm:min-h-[48px] sm:min-w-[11rem]"
                  )}
                >
                  Try it on your next call
                </motion.a>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Video ↔ demo: full width of hero row (not constrained by headline max-width) */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={
              reduceMotion
                ? { opacity: showCTA ? 1 : 0 }
                : { opacity: showCTA ? 1 : 0, y: showCTA ? 0 : 16 }
            }
            transition={{
              duration: reduceMotion ? 0.01 : 0.55,
              delay: reduceMotion ? 0 : 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "relative mt-4 scroll-mt-24 sm:mt-5 sm:scroll-mt-28 lg:mt-6 w-full max-w-full self-stretch",
              demoOpen ? "min-h-0 max-h-none" : "min-h-[min(42vh,400px)] max-h-[min(72vh,720px)]"
            )}
            id="hero-demo-panel"
          >
            {children && (
              <div
                className={cn(
                  "flex w-full flex-col transition-opacity duration-300 ease-out",
                  demoOpen
                    ? "relative z-10 min-h-0 opacity-100"
                    : "absolute inset-0 z-0 h-full min-h-[220px] overflow-hidden opacity-0 pointer-events-none"
                )}
                aria-hidden={!demoOpen}
              >
                {children}
              </div>
            )}
            <div
              className={cn(
                "flex flex-col transition-opacity duration-300 ease-out",
                !demoOpen
                  ? "relative z-10 h-full min-h-[min(42vh,260px)] max-h-[min(72vh,720px)] opacity-100"
                  : "absolute inset-0 z-0 h-full min-h-[260px] max-h-[min(72vh,720px)] opacity-0 pointer-events-none overflow-hidden"
              )}
              aria-hidden={demoOpen}
            >
              <LandingHeroVideo show={showCTA} />
            </div>
          </motion.div>

          {/* Benefit checklist — below video/demo */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={
              reduceMotion
                ? { opacity: showCTA ? 1 : 0 }
                : { opacity: showCTA ? 1 : 0, y: showCTA ? 0 : 10 }
            }
            transition={{
              duration: reduceMotion ? 0.01 : 0.45,
              delay: reduceMotion ? 0 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full max-w-full self-stretch mt-4 sm:mt-5 lg:mt-6"
          >
            <LandingBenefitStrip />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
