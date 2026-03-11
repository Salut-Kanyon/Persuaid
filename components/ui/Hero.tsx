"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CTAButton } from "./CTAButton";

const FADE_START = 0;
const FADE_END = 950;

const HERO_TITLE =
  "Sales calls are hard. Persuaid guides you on what to say.";
const HERO_SUBTITLE =
  "AI listens to your call and suggests what to say next—and questions to ask—in real time.";

const HERO_WORDS = HERO_TITLE.split(" ");

const TRANSCRIPT_LINES = [
  { who: "Rep", whoClass: "text-emerald-300/95", text: "Thanks for your time. I'll keep this focused on how we can help your team sell better." },
  { who: "Prospect", whoClass: "text-sky-200/95", text: "We've tried a few tools—they ended up adding more work for reps." },
  { who: "AI", whoClass: "text-green-primary", text: "Suggested: \"That's exactly what we're built to fix. Real-time help, no extra steps.\"" },
  { who: "Rep", whoClass: "text-emerald-300/95", text: "You talk, Persuaid listens and suggests the next line. Press Enter when you need it." },
];

const DRAFTING_LINE = { who: "AI", whoClass: "text-green-primary", text: "Drafting next line…" };

const LIVE_EXTRA_LINES = [
  { who: "AI", whoClass: "text-green-primary", text: "Try this: \"Teams like yours usually want help in the moment—not another recap after the call. Persuaid only speaks up when it can make your next sentence sharper.\"" },
  { who: "AI", whoClass: "text-green-primary", text: "Follow-up: \"What would need to be true for a tool like this to actually get used by your reps every day?\"" },
  { who: "AI", whoClass: "text-green-primary", text: "Objection handled. Suggest: \"We sit next to your dialer and listen. No new meeting links, no bots on the call—just the next line when you need it.\"" },
  { who: "AI", whoClass: "text-green-primary", text: "Strong close: \"Want to run one real call with Persuaid on and see what it suggests? Takes two minutes to try.\"" },
];

const DRAFTING_MS = 2800;
const SUGGESTION_MS = 7200;
const PAUSE_BETWEEN_MS = 4200;

function LiveTranscriptVideo({ show }: { show: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [liveLine, setLiveLine] = useState<typeof LIVE_EXTRA_LINES[0] | typeof DRAFTING_LINE | null>(null);
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 24 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-4"
    >
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] shadow-green-950/20 aspect-[16/10] min-h-[320px] sm:min-h-[380px]">
        <video
          src="/VideoAI.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/45"
          aria-hidden
        />
        {/* Edge vignette: soft blur/fade into page background */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 40%, rgba(5,7,8,0.5) 75%, rgba(5,7,8,0.95) 100%)",
            boxShadow: "inset 0 0 80px 20px rgba(5,7,8,0.3)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black/50 shadow-2xl overflow-hidden flex flex-col backdrop-blur-sm">
            <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-primary animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                <span className="text-base font-semibold text-text-primary tracking-tight">Live AI transcript</span>
              </div>
              <span className="text-sm text-text-dim font-mono tabular-nums">00:18:42</span>
            </div>
            <div className="p-6 space-y-4 text-left h-[300px] sm:h-[340px] overflow-y-auto overflow-x-hidden flex flex-col bg-black/35">
              <div className="space-y-4 flex-1 min-h-0">
                {TRANSCRIPT_LINES.slice(0, visibleCount).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex gap-3 shrink-0"
                  >
                    <span className={`text-xs font-semibold shrink-0 ${line.whoClass}`}>{line.who}</span>
                    <p className="text-sm sm:text-base text-text-primary leading-relaxed">{line.text}</p>
                  </motion.div>
                ))}
                <div className="min-h-[80px] flex flex-col justify-end">
                  <AnimatePresence mode="wait">
                    {liveLine ? (
                      <motion.div
                        key={`live-${liveKey}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.35 }}
                        className="flex gap-3 rounded-xl bg-black/45 border border-green-primary/30 pl-2 py-2 pr-3 shrink-0 min-h-[80px] border-white/10"
                      >
                        <span className={`text-xs font-semibold shrink-0 ${liveLine.whoClass}`}>{liveLine.who}</span>
                        <p className="text-sm sm:text-base text-text-primary leading-relaxed">{liveLine.text}</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="live-placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-[80px]"
                        aria-hidden
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroTitleWords() {
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
                duration: 0.4,
                delay: index * 0.09,
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

export function Hero() {
  const [bgOpacity, setBgOpacity] = useState(1);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      const opacity = Math.max(0, 1 - (y - FADE_START) / FADE_END);
      setBgOpacity(opacity);
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

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 lg:pt-32 pb-32 overflow-hidden">
      {/* Landing background image - fades out on scroll */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-opacity duration-150"
        style={{
          backgroundImage: "url(/BackIMG.png)",
          opacity: bgOpacity,
        }}
        aria-hidden
      />
      {/* Enhanced background glow with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="flex flex-col items-center gap-8">
          {/* Hero Content - Above */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center w-full -mt-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              <HeroTitleWords />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showSubtitle ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-base sm:text-lg text-text-muted mb-4 max-w-2xl mx-auto leading-relaxed font-light"
            >
              {HERO_SUBTITLE}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showCTA ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center gap-3 mb-10"
            >
                <a
                  href="/sign-in"
                  className="group flex items-center gap-3 px-8 py-3.5 text-base font-semibold rounded-2xl transition-all duration-300 border-2 border-green-primary/70 bg-black text-white hover:bg-gray-900 hover:border-green-primary hover:shadow-2xl hover:shadow-green-primary/20 shadow-lg transform hover:scale-105 active:scale-100"
                >
                  <img
                    src="/PersuaidLogo.png"
                    alt="Persuaid"
                    className="w-5 h-5 flex-shrink-0 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="text-lg">Try for Free</span>
                </a>
                <a
                  href="#product"
                  className="text-sm text-text-dim hover:text-green-accent transition-colors duration-200"
                >
                  See it in action →
                </a>
            </motion.div>

            {/* Looping video with live AI transcript overlay */}
            <LiveTranscriptVideo show={showCTA} />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
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
