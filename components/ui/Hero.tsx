"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
const HERO_CAROUSEL_VIDEOS = ["/otherid3.mp4", "/VideoAI.mp4"] as const;

const FADE_START = 0;
const FADE_END = 950;

/** After hero copy settles, image eases toward this opacity (× scroll factor). */
const INTRO_BG_DELAY_MS = 2200;
const INTRO_BG_DURATION_MS = 5200;
const INTRO_BG_END = 0.34;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

const HERO_TITLE =
  "Never lose a deal because you didn't know what to say.";
const HERO_SUBTITLE =
  "Persuaid listens to your sales calls and feeds you winning responses, objection handling, and next moves live, while you're talking.";

const HERO_WORDS = HERO_TITLE.split(" ");

const TRANSCRIPT_LINES = [
  { who: "Rep", whoClass: "text-emerald-300/95", text: "Thanks for your time. I'll keep this focused on how we can help your team sell better." },
  { who: "Prospect", whoClass: "text-sky-200/95", text: "We've tried a few tools—they ended up adding more work for reps." },
  { who: "AI", whoClass: "text-green-primary", text: "Suggested: \"That's exactly what we're built to fix. Real-time help, no extra steps.\"" },
  { who: "Rep", whoClass: "text-emerald-300/95", text: "You talk, Persuaid listens and suggests the next line. Press Enter when you need it." },
];

const DRAFTING_LINE = { who: "AI", whoClass: "text-green-primary", text: "Drafting next line…" };

const LIVE_EXTRA_LINES = [
  { who: "AI", whoClass: "text-green-primary", text: "Try this: \"Teams like yours want the right line in the moment—and a clear recap after. Persuaid helps during the call and when it's over.\"" },
  { who: "AI", whoClass: "text-green-primary", text: "Follow-up: \"What would need to be true for a tool like this to actually get used by your reps every day?\"" },
  { who: "AI", whoClass: "text-green-primary", text: "Objection handled. Suggest: \"We sit next to your dialer and listen. No new meeting links, no bots on the call—just the next line when you need it.\"" },
  { who: "AI", whoClass: "text-green-primary", text: "Strong close: \"Want to run one real call with Persuaid on and see what it suggests? Takes two minutes to try.\"" },
];

const DRAFTING_MS = 2800;
const SUGGESTION_MS = 7200;
const PAUSE_BETWEEN_MS = 4200;

/** Transcript mock — remount with key when carousel returns to slide 2 so the animation restarts. */
function HeroTranscriptOverlay({ show }: { show: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [liveLine, setLiveLine] = useState<(typeof LIVE_EXTRA_LINES)[0] | typeof DRAFTING_LINE | null>(null);
  const [liveKey, setLiveKey] = useState(0);
  const [isDraftingPhase, setIsDraftingPhase] = useState(false);

  useEffect(() => {
    if (!show) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    TRANSCRIPT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount((c) => c + 1), 500 + i * 1200));
    });
    return () => timers.forEach(clearTimeout);
  }, [show]);

  useEffect(() => {
    if (visibleCount < TRANSCRIPT_LINES.length) return;
    const t = setTimeout(() => {
      setIsDraftingPhase(true);
      setLiveLine(DRAFTING_LINE);
    }, 3200);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (!liveLine || !isDraftingPhase) return;
    const t = setTimeout(() => {
      setIsDraftingPhase(false);
      setLiveLine(LIVE_EXTRA_LINES[liveKey % LIVE_EXTRA_LINES.length]);
      setLiveKey((k) => k + 1);
    }, DRAFTING_MS);
    return () => clearTimeout(t);
  }, [liveLine, isDraftingPhase, liveKey]);

  useEffect(() => {
    if (!liveLine || isDraftingPhase) return;
    const t = setTimeout(() => setLiveLine(null), SUGGESTION_MS);
    return () => clearTimeout(t);
  }, [liveLine, isDraftingPhase]);

  useEffect(() => {
    if (liveLine !== null || visibleCount < TRANSCRIPT_LINES.length || liveKey === 0) return;
    const t = setTimeout(() => {
      setIsDraftingPhase(true);
      setLiveLine(DRAFTING_LINE);
    }, PAUSE_BETWEEN_MS);
    return () => clearTimeout(t);
  }, [liveLine, visibleCount, liveKey]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/50 shadow-2xl overflow-hidden flex flex-col backdrop-blur-sm">
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-semibold text-text-primary tracking-tight">Live AI transcript</span>
          </div>
          <span className="text-xs text-text-dim font-mono tabular-nums">00:18:42</span>
        </div>
        <div className="p-4 space-y-3 text-left h-[220px] sm:h-[260px] overflow-y-auto overflow-x-hidden flex flex-col bg-black/35">
          <div className="space-y-4 flex-1 min-h-0">
            {TRANSCRIPT_LINES.slice(0, visibleCount).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex gap-3 shrink-0"
              >
                <span className={`text-[10px] font-semibold shrink-0 ${line.whoClass}`}>{line.who}</span>
                <p className="text-xs sm:text-sm text-text-primary leading-relaxed">{line.text}</p>
              </motion.div>
            ))}
            <div className="min-h-[56px] flex flex-col justify-end">
              <AnimatePresence mode="wait">
                {liveLine ? (
                  <motion.div
                    key={`live-${liveKey}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.35 }}
                    className="flex gap-2 rounded-lg bg-black/45 border border-green-primary/30 pl-2 py-1.5 pr-2 shrink-0 min-h-[56px] border-white/10"
                  >
                    <span className={`text-[10px] font-semibold shrink-0 ${liveLine.whoClass}`}>{liveLine.who}</span>
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed">{liveLine.text}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="live-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-[56px]"
                    aria-hidden
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Two hero clips in one frame: when the active video fires `ended`, advance to the other (no loop).
 * Second clip shows the transcript overlay; first is full-bleed.
 */
function LiveTranscriptVideo({ show }: { show: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transcriptCycle, setTranscriptCycle] = useState(0);
  const prevIndex = useRef(0);
  const video0 = useRef<HTMLVideoElement>(null);
  const video1 = useRef<HTMLVideoElement>(null);

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % HERO_CAROUSEL_VIDEOS.length);
  }, []);

  useEffect(() => {
    if (!show) {
      video0.current?.pause();
      video1.current?.pause();
      return;
    }
    if (prevIndex.current !== 1 && activeIndex === 1) {
      setTranscriptCycle((c) => c + 1);
    }
    prevIndex.current = activeIndex;

    const refs = [video0, video1];
    refs.forEach((r, i) => {
      const el = r.current;
      if (!el) return;
      if (i === activeIndex) {
        el.currentTime = 0;
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [show, activeIndex]);

  useEffect(() => {
    if (show) setActiveIndex(0);
  }, [show]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 24 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex h-full w-full max-w-4xl flex-1 flex-col xl:max-w-5xl mx-auto px-3 sm:px-4"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_40px_100px_rgba(0,0,0,0.65)] shadow-green-950/20 ring-1 ring-white/5">
        {/*
          Fixed max height + contain keeps both clips readable without heavy cropping.
          Letterboxing is black to match the frame.
        */}
        <div className="relative w-full aspect-[16/10] max-h-[min(58vh,520px)] min-h-[220px] sm:min-h-[260px] sm:max-h-[min(56vh,560px)]">
          <video
            ref={video0}
            src={HERO_CAROUSEL_VIDEOS[0]}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-out ${
              activeIndex === 0 ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
            }`}
            muted
            playsInline
            preload="metadata"
            onEnded={advance}
            aria-hidden
          />
          <video
            ref={video1}
            src={HERO_CAROUSEL_VIDEOS[1]}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-out ${
              activeIndex === 1 ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
            }`}
            muted
            playsInline
            preload="metadata"
            onEnded={advance}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/40 z-[2]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl z-[2]"
            style={{
              background:
                "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 40%, rgba(5,7,8,0.5) 75%, rgba(5,7,8,0.95) 100%)",
              boxShadow: "inset 0 0 80px 20px rgba(5,7,8,0.3)",
            }}
            aria-hidden
          />
          {activeIndex === 1 && (
            <div className="absolute inset-0 z-[3]">
              <HeroTranscriptOverlay key={transcriptCycle} show={show} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HeroTitleWords() {
  const reduce = useReducedMotion();
  return (
    <>
      {HERO_WORDS.map((word, index) => {
        const isPersuaid = word.replace(/[.,!?]/g, "") === "Persuaid";
        return (
          <span key={index} className="inline-block whitespace-pre">
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduce ? 0.01 : 0.4,
                delay: reduce ? 0 : index * 0.09,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={isPersuaid ? "text-green-primary" : ""}
            >
              {word}
            </motion.span>
            {index < HERO_WORDS.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
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
  const [introFade, setIntroFade] = useState(1);
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

  // Slow background dim once hero content has started appearing (multiplies with scroll fade)
  useEffect(() => {
    if (reduceMotion) {
      setIntroFade(INTRO_BG_END);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + INTRO_BG_DELAY_MS;
    const tick = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const u = Math.min(1, (now - t0) / INTRO_BG_DURATION_MS);
      setIntroFade(1 + (INTRO_BG_END - 1) * easeOutCubic(u));
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  // Stagger subtitle and CTA after word-by-word title finishes
  useEffect(() => {
    const t1 = setTimeout(() => setShowSubtitle(true), 1200);
    const t2 = setTimeout(() => setShowCTA(true), 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative min-h-screen flex justify-center items-start pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20",
        demoOpen ? "overflow-x-hidden overflow-y-visible" : "overflow-hidden"
      )}
    >
      {/* Landing background image — dims in after load, then fades further on scroll */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url(/MGBack.png)",
          backgroundPosition: "center 125%",
          opacity: introFade * scrollFade,
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
            <h1 className="text-3xl sm:text-[2.125rem] sm:leading-[1.12] lg:text-[2.75rem] lg:leading-[1.08] font-semibold text-text-primary tracking-[-0.03em] mb-4 sm:mb-5">
              <HeroTitleWords />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
              animate={{
                opacity: showSubtitle ? 1 : 0,
                y: reduceMotion ? 0 : showSubtitle ? 0 : 6,
              }}
              transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[15px] sm:text-[17px] text-text-secondary/95 mb-6 sm:mb-8 max-w-[26rem] sm:max-w-xl mx-auto leading-[1.5] font-normal"
            >
              {HERO_SUBTITLE}
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
              className="flex flex-col items-center w-full max-w-md sm:max-w-lg mx-auto"
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
                className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
              >
                <motion.a
                  href="/sign-in"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 520, damping: 28 }}
                  className="inline-flex min-h-[52px] sm:min-h-[56px] flex-1 items-center justify-center rounded-full border border-transparent bg-[#20D3A6] px-8 sm:px-10 text-[16px] sm:text-[17px] font-semibold tracking-[-0.01em] text-[#04110D] shadow-[0_4px_24px_rgba(32,211,166,0.35)] transition-[box-shadow,filter] duration-200 hover:bg-[#19BE95] hover:shadow-[0_6px_28px_rgba(32,211,166,0.42)] active:brightness-[0.97] sm:min-w-[11rem]"
                >
                  Join Now
                </motion.a>
                {onDemoOpenChange && (
                  <motion.button
                    type="button"
                    onClick={() => onDemoOpenChange(!demoOpen)}
                    aria-expanded={demoOpen}
                    aria-controls="hero-demo-panel"
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 520, damping: 28 }}
                    className="inline-flex min-h-[52px] sm:min-h-[56px] flex-1 items-center justify-center rounded-full border border-white/20 bg-white px-8 sm:px-10 text-[16px] sm:text-[17px] font-medium tracking-[-0.01em] text-neutral-950 shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-white/25 transition-[box-shadow] duration-200 hover:shadow-[0_4px_20px_rgba(255,255,255,0.14)] hover:brightness-[1.02] active:brightness-[0.98] sm:min-w-[11rem]"
                  >
                    {demoOpen ? "Back" : "Try free"}
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
              delay: reduceMotion ? 0 : 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "relative mt-10 sm:mt-12 lg:mt-14 w-full max-w-full self-stretch",
              demoOpen ? "min-h-0 max-h-none" : "min-h-[min(52vh,480px)] max-h-[min(70vh,640px)]"
            )}
            id="hero-demo-panel"
          >
            {children && (
              <div
                className={cn(
                  "flex w-full flex-col transition-opacity duration-300 ease-out",
                  demoOpen
                    ? "relative z-10 min-h-0 opacity-100"
                    : "absolute inset-0 z-0 h-full min-h-[280px] overflow-hidden opacity-0 pointer-events-none"
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
                  ? "relative z-10 h-full min-h-[min(52vh,280px)] max-h-[min(70vh,640px)] opacity-100"
                  : "absolute inset-0 z-0 h-full min-h-[280px] max-h-[min(70vh,640px)] opacity-0 pointer-events-none overflow-hidden"
              )}
              aria-hidden={demoOpen}
            >
              <LiveTranscriptVideo show={showCTA} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: demoOpen ? 0 : 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
        aria-hidden={demoOpen}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-text-dim rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-text-dim rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
