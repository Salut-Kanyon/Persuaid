"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingHeroVideo } from "@/components/landing/LandingHeroVideo";
import { LandingBenefitStrip } from "@/components/landing/LandingBenefitStrip";
import { MarketingHeroHeadlineDivider } from "@/components/ui/marketing-landing-art";

const FADE_START = 0;
const FADE_END = 950;

const HERO_TITLE_LINE1 = "Have the right information,";
const HERO_TITLE_LINE2 = "when you need it.";
const HERO_LINE1_WORDS = HERO_TITLE_LINE1.split(" ");
const HERO_LINE2_WORDS = HERO_TITLE_LINE2.split(" ");

/** Same gradient as “Train faster. / Perform better.” on the home revenue section. */
const HERO_TITLE_GRADIENT =
  "bg-gradient-to-r from-emerald-200/[0.92] via-[#e8e4dc]/90 to-violet-200/[0.88] bg-clip-text text-transparent";

function HeroTitleTwoLines() {
  const reduce = useReducedMotion();
  const words1 = HERO_LINE1_WORDS;
  const words2 = HERO_LINE2_WORDS;
  const lineBase =
    "font-sans text-4xl sm:text-5xl lg:text-[3.15rem] xl:text-[3.45rem] font-semibold tracking-[-0.025em] leading-[1.06]";

  const renderLine = (words: string[], baseIndex: number, gradient: boolean) =>
    words.map((word, i) => {
      const index = baseIndex + i;
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
            className={cn(lineBase, gradient ? HERO_TITLE_GRADIENT : "text-text-primary")}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      );
    });

  return (
    <span className="flex flex-col items-center gap-0.5 sm:gap-1">
      <span className="block whitespace-nowrap">{renderLine(words1, 0, false)}</span>
      <span className="mt-0.5 block whitespace-nowrap sm:mt-1">{renderLine(words2, words1.length, true)}</span>
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
  const hasInlineDemo = Boolean(children && onDemoOpenChange);

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

  const bgOpacity = hasInlineDemo && demoOpen ? 0 : scrollFade;

  return (
    <div
      className={cn(
        "relative min-h-[100dvh] bg-background-near-black flex justify-center items-start pb-20 sm:pb-24",
        "overflow-x-hidden overflow-y-visible",
        landing ? "pt-24 sm:pt-28 lg:pt-28" : "pt-8 sm:pt-10 lg:pt-12"
      )}
    >
      {/* Full-bleed art — landing: slight zoom + clip so wide screens don’t look stretched thin */}
      {landing ? (
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[var(--bg-near-black)]"
          style={{ opacity: bgOpacity }}
          aria-hidden
        >
          <div
            className="absolute bg-no-repeat bg-cover"
            style={{
              backgroundImage: "url(/landing-forest-hero.png?v=1)",
              top: "-6%",
              left: "-10%",
              right: "-10%",
              bottom: "-4%",
              /* Art has solid black top — anchor to top so headline sits on dark sky */
              backgroundPosition: "50% 0%",
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: "url(/hero-landing-bg.png?v=9)",
            opacity: bgOpacity,
          }}
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-[var(--bg-near-black)] via-[var(--bg-near-black)]/70 to-transparent"
        style={{ opacity: bgOpacity }}
        aria-hidden
      />

      <div
        className={cn(
          "mx-auto w-full px-5 sm:px-8 lg:px-10 relative z-10",
          hasInlineDemo && demoOpen ? "max-w-[min(92rem,calc(100vw-2rem))]" : "max-w-5xl"
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

            <MarketingHeroHeadlineDivider />

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
              animate={{
                opacity: showSubtitle ? 1 : 0,
                y: reduceMotion ? 0 : showSubtitle ? 0 : 6,
              }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-sans mt-4 text-[17px] leading-snug sm:mt-5 sm:text-[18px] sm:leading-relaxed lg:text-[19px] text-text-secondary mb-12 max-w-md sm:mb-14 lg:mb-16 sm:max-w-2xl mx-auto font-normal text-balance tracking-[-0.01em]"
            >
              <span className="block">
                <span className="font-semibold text-green-accent">Persuaid</span> listens, understands the moment, and
                surfaces the right answers based on your knowledge.
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
              className="mx-auto flex w-full max-w-2xl flex-col items-center pt-2 sm:pt-3"
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
                className="flex w-full justify-center"
              >
                <motion.a
                  href="/download"
                  transition={{ type: "spring", stiffness: 520, damping: 32 }}
                  className={cn(
                    "relative isolate inline-flex h-12 min-h-12 items-center justify-center overflow-hidden rounded-full px-10 sm:h-14 sm:min-h-14 sm:px-12",
                    "bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] text-base font-semibold tracking-[-0.02em] text-white antialiased sm:text-[17px]",
                    "border border-[#4dc49a]/50 shadow-[0_0_0_1px_rgba(26,157,120,0.35),0_4px_20px_rgba(26,157,120,0.45),0_12px_40px_-8px_rgba(0,0,0,0.55)]",
                    "before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-px before:rounded-full before:bg-white/35",
                    "transition-[transform,box-shadow,filter] duration-200 ease-out",
                    "hover:border-[#6ad4b0]/55 hover:shadow-[0_0_0_1px_rgba(61,184,146,0.45),0_6px_28px_rgba(26,157,120,0.55),0_16px_48px_-10px_rgba(0,0,0,0.5)] hover:brightness-[1.04]",
                    "active:scale-[0.98] active:brightness-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-near-black)]"
                  )}
                >
                  Download Now
                </motion.a>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Video (optional in-hero demo swap when children + onDemoOpenChange are passed) */}
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
              "relative mt-14 scroll-mt-24 sm:mt-16 sm:scroll-mt-28 lg:mt-20 w-full max-w-full self-stretch",
              hasInlineDemo && demoOpen ? "min-h-0 max-h-none" : "min-h-[min(42vh,400px)] max-h-[min(72vh,720px)]"
            )}
            id={hasInlineDemo ? "hero-demo-panel" : "hero-media"}
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
