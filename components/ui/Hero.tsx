"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingHeroVideo } from "@/components/landing/LandingHeroVideo";
import { LandingBenefitStrip } from "@/components/landing/LandingBenefitStrip";

const FADE_START = 0;
const FADE_END = 950;

const HERO_TITLE_LINE1 = "Sound like a top performer";
const HERO_TITLE_LINE2 = "from day one.";
const HERO_LINE1_WORDS = HERO_TITLE_LINE1.split(" ");
const HERO_LINE2_WORDS = HERO_TITLE_LINE2.split(" ");

const HERO_SUBTITLE_LINE1 = "Great sales reps sound prepared, not lucky.";
const HERO_SUBTITLE_LINE2_AFTER = " backs you with the right detail in real time when the conversation turns.";

function HeroTitleTwoLines() {
  const reduce = useReducedMotion();
  const words1 = HERO_LINE1_WORDS;
  const words2 = HERO_LINE2_WORDS;
  const lineClass =
    "block whitespace-nowrap text-[clamp(1.65rem,7.5vw,4.25rem)] leading-[1.05] font-bold text-text-primary tracking-[-0.035em]";

  const renderLine = (words: string[], baseIndex: number) =>
    words.map((word, i) => {
      const index = baseIndex + i;
      const stripped = word.replace(/[.,!?]/g, "");
      const isPersuaid = stripped === "Persuaid";
      const isAi = stripped === "AI";
      return (
        <span key={`${baseIndex}-${i}`} className="inline-block whitespace-pre">
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0.01 : 0.4,
              delay: reduce ? 0 : index * 0.09,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className={cn((isPersuaid || isAi) && "text-green-primary")}
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
};

export function Hero({ demoOpen = false, onDemoOpenChange, children }: HeroProps = {}) {
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
        "relative min-h-screen bg-background-near-black flex justify-center items-start pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20",
        "overflow-x-hidden overflow-y-visible"
      )}
    >
      {/* Landing background image — position nudged so the skyline sits higher in the frame */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url(/hero-skyline.png)",
          backgroundPosition: "center 22%",
          opacity: bgOpacity,
        }}
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
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.2] to-transparent" />
            </div>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
              animate={{
                opacity: showSubtitle ? 1 : 0,
                y: reduceMotion ? 0 : showSubtitle ? 0 : 6,
              }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-5 text-[15px] sm:mt-6 sm:text-[17px] text-text-secondary/95 mb-6 sm:mb-8 max-w-[26rem] sm:max-w-xl mx-auto leading-[1.5] font-normal text-balance"
            >
              <span className="block">
                {HERO_SUBTITLE_LINE1}{" "}
                <span className="font-medium text-green-primary">Persuaid</span>
                {HERO_SUBTITLE_LINE2_AFTER}
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
                <motion.a
                  href="/sign-in"
                  whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 520, damping: 32 }}
                  className={cn(
                    "group inline-flex min-h-[50px] flex-1 items-center justify-center rounded-full px-4 text-center text-[14px] leading-snug font-medium tracking-[-0.02em] sm:px-8 sm:text-[16px] sm:leading-tight",
                    "border border-white/15 bg-gradient-to-br from-[#20D3A6] via-[#1db896] to-[#0f766e] text-[#061210]",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.22)]",
                    "transition-[transform,box-shadow,border-color,filter] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                    "hover:border-cyan-300/40 hover:bg-gradient-to-br hover:from-[#5eead4] hover:via-[#2dd4bf] hover:to-[#0d9488]",
                    "hover:shadow-[0_4px_32px_rgba(45,212,191,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-[1.03]",
                    "active:brightness-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[transparent]",
                    "min-w-0 sm:min-h-[52px] sm:min-w-[10.75rem]"
                  )}
                >
                  Try it on your next call
                </motion.a>
                {onDemoOpenChange && (
                  <motion.button
                    type="button"
                    onClick={() => onDemoOpenChange(!demoOpen)}
                    aria-expanded={demoOpen}
                    aria-controls="hero-demo-panel"
                    whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 520, damping: 32 }}
                    className={cn(
                      "inline-flex min-h-[50px] flex-1 items-center justify-center rounded-full px-8 text-[17px] font-medium tracking-[-0.022em]",
                      "border border-white/20 bg-white/[0.08] text-white/[0.95] backdrop-blur-xl backdrop-saturate-150",
                      "bg-gradient-to-br from-white/[0.12] to-white/[0.05]",
                      "shadow-[inset_0_0.5px_0_rgba(255,255,255,0.35),0_1px_3px_rgba(0,0,0,0.12)]",
                      "transition-[transform,background,background-color,border-color,box-shadow,color] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                      "hover:border-fuchsia-400/35 hover:from-fuchsia-500/25 hover:via-violet-500/20 hover:to-cyan-500/15",
                      "hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_24px_rgba(192,132,252,0.2)]",
                      "active:from-white/10 active:to-white/5",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[transparent]",
                      "min-w-0 sm:min-h-[52px] sm:min-w-[10.75rem]"
                    )}
                  >
                    {demoOpen ? "Back" : "Free demo"}
                  </motion.button>
                )}
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
<<<<<<< Updated upstream
              "relative mt-4 sm:mt-5 lg:mt-6 w-full max-w-full self-stretch",
              demoOpen ? "min-h-0 max-h-none" : "min-h-[min(42vh,400px)] max-h-[min(72vh,720px)]"
=======
              "relative mt-6 scroll-mt-24 sm:mt-8 sm:scroll-mt-28 lg:mt-10 w-full max-w-full self-stretch",
              demoOpen ? "min-h-0 max-h-none" : "min-h-[min(58vh,560px)] max-h-[min(80vh,840px)]"
>>>>>>> Stashed changes
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
