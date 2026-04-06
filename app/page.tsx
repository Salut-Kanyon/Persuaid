"use client";

/*
 * Marketing home: editorial rhythm, muted organic palette, restrained chrome.
 * Goal: credible B2B tool for reps under pressure — not generic “AI SaaS” gloss.
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";
import { LandingPreFooterCta } from "@/components/landing/LandingPreFooterCta";
import { LandingResearchBanner } from "@/components/landing/LandingResearchBanner";
import { TUTORIAL_VIDEO_SRC } from "@/lib/tutorial-video";

function ProductKnowledgeShowcaseCard() {
  const previewLines = [
    "Case: 42-year-old, married, 2 kids, income protection",
    "Goal: $500k–$1M coverage, 20-year term",
    "Risk factors: non-smoker, no major conditions — Positioning: protect income first, adjust coverage later—then",
    "Pricing bands (by preferred class): Starter / Standard / Plus",
    "Policy details: confirm term length vs monthly premium band",
    "Underwriting notes: age + health class drives estimate range",
    "Objection handling: value first, numbers second",
    "Case specifics: timeline + decision-maker preference",
  ] as const;

  return (
    <article className="relative h-full min-h-[396px] overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:min-h-[420px] sm:p-5 shadow-none">
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:mt-2 sm:text-[1.9rem]">Add Your Knowledge</h3>
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/[0.14] bg-black/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl backdrop-saturate-150 sm:mt-5 sm:p-4">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/30"
          aria-hidden
        />
        <div className="relative space-y-2 sm:space-y-2.5">
          {previewLines.map((line, i) => {
            const blurPx = 1.15 + i * 0.17;
            const opacity = Math.max(0.52, 0.94 - i * 0.055);
            return (
              <p
                key={line}
                className="select-none text-[11px] leading-relaxed text-text-secondary sm:text-[12px] font-mono antialiased"
                style={{
                  filter: `blur(${blurPx}px)`,
                  opacity,
                  textShadow: "0 0 24px rgba(255,255,255,0.06)",
                }}
              >
                {line}
              </p>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0b]/90 via-[#0a0a0b]/35 to-transparent sm:h-20"
          aria-hidden
        />
      </div>
    </article>
  );
}

function EnterInstantAnswerShowcaseCard() {
  const [phase, setPhase] = useState<"idle" | "press" | "thinking" | "answer" | "done">("idle");
  const [pass, setPass] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "idle") t = setTimeout(() => setPhase("press"), 950);
    else if (phase === "press") t = setTimeout(() => setPhase("thinking"), 260);
    else if (phase === "thinking") t = setTimeout(() => setPhase("answer"), 1800);
    else if (phase === "answer") {
      t = setTimeout(() => {
        if (pass === 0) {
          setPass(1);
          setPhase("press");
        } else {
          setPhase("done");
        }
      }, 2600);
    }
    return () => clearTimeout(t);
  }, [phase, pass]);

  return (
    <article className="relative flex h-full min-h-[480px] flex-col overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:min-h-[508px] sm:p-5">
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:mt-2 sm:text-[1.9rem]">
        Listens live, press Enter and get an answer
      </h3>

      <div className="mt-5 flex min-h-0 flex-1 flex-col sm:mt-6">
        <div className="border-l-2 border-emerald-400/50 pl-3 sm:pl-3.5">
          <p className="text-[15px] font-medium leading-snug text-white sm:text-[16px]">
            <span className="text-emerald-300/90">&ldquo;</span>
            <span>What would this cost monthly for someone in their early 40s?</span>
            <span className="text-emerald-300/90">&rdquo;</span>
          </p>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-white/15 bg-white/[0.02] sm:mt-5">
          <div className="flex min-h-[120px] flex-1 flex-col p-3 sm:min-h-[132px] sm:p-4">
            <AnimatePresence mode="wait">
              {phase === "thinking" ? (
                <motion.div
                  key="think"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 text-[13px] text-text-primary/85"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90 animate-pulse" />
                  Thinking...
                </motion.div>
              ) : phase === "answer" || phase === "done" ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="space-y-2"
                >
                  {pass === 0 ? (
                    <>
                      <p className="text-[14px] leading-relaxed text-text-primary/95 sm:text-[14.5px]">
                        For a healthy 42-year-old non-smoker, a $500k 20-year term policy typically fits in the mid-range monthly
                        band. If underwriting comes back preferred, the monthly premium can drop meaningfully.
                      </p>
                      <p className="text-[13px] leading-relaxed text-text-secondary/90">
                        <span className="text-emerald-200/90">Follow-up:</span> Should I quote conservative first, then show the
                        preferred-class scenario once underwriting is confirmed?
                      </p>
                    </>
                  ) : (
                    <div className="flex min-h-[160px] flex-1 flex-col items-stretch justify-center px-2 sm:min-h-[180px] sm:px-4">
                      <p className="w-full text-left text-balance text-[16px] font-medium leading-[1.5] tracking-[-0.015em] text-text-primary sm:text-[18px] sm:leading-[1.48]">
                        For a healthy 42-year-old non-smoker at $500k over twenty years, you are usually in the mid-range on monthly
                        premium—and if underwriting comes back preferred, you can tighten that quote quite a bit.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-1 flex-col items-center justify-center py-6 text-center sm:py-8"
                >
                  <p className="text-[13px] text-text-dim/70">Answer appears here after you send.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/10 p-3 pt-6 sm:p-4 sm:pt-7">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value=""
                placeholder="Press Return or Enter to get an answer"
                aria-label="Press Return or Enter to get an answer (demo)"
                className="min-w-0 flex-1 cursor-default rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] placeholder:text-text-dim/55 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/35 sm:py-3"
              />
              <motion.span
                animate={phase === "press" ? { scale: 0.92, y: 1 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#4dc49a]/45 bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_0_0_1px_rgba(26,157,120,0.4),0_3px_12px_rgba(26,157,120,0.35)] sm:py-2.5"
              >
                Enter
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function NotesRetrievalShowcaseCard() {
  const segments = [
    "42, married, 2 kids — income protection",
    "Non-smoker, no flags yet",
    "$500k · 20yr term (flexible)",
  ] as const;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("idle");
  const ranRef = useRef(false);
  const rowHeight = 32;
  const rowGap = 6;
  const rowStep = rowHeight + rowGap;

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "idle") t = setTimeout(() => setPhase("thinking"), 900);
    else if (phase === "thinking") t = setTimeout(() => setPhase("done"), segments.length * 900 + 500);
    return () => clearTimeout(t);
  }, [phase, segments.length]);

  // Scroll + highlight once, top → bottom, then stop.
  useEffect(() => {
    if (phase !== "thinking" || ranRef.current) return;
    ranRef.current = true;
    setIdx(0);
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    for (let i = 1; i < segments.length; i++) {
      timers.push(setTimeout(() => setIdx(i), i * 900));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, segments.length]);

  return (
    <article className="relative h-full min-h-[396px] overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:min-h-[420px] sm:p-5 shadow-none">
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:mt-2 sm:text-[1.9rem]">Connect your notes with the AI</h3>
      <div className="relative mt-4 h-[272px] overflow-hidden rounded-2xl border border-white/[0.14] bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl backdrop-saturate-150 sm:mt-5 sm:h-[292px]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/30" aria-hidden />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative flex h-full flex-col p-3 sm:p-4"
        >
          <div className="relative h-[128px] overflow-hidden rounded-xl border border-white/[0.12] bg-black/35 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150 sm:h-[136px]">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1.5 right-1.5 rounded-full border border-emerald-300/35 bg-emerald-300/12"
              style={{ height: rowHeight }}
              animate={{ y: idx * rowStep }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="relative space-y-1.5">
              {segments.map((s, i) => (
                <p
                  key={s}
                  className={cn(
                    "h-8 truncate whitespace-nowrap px-2 font-mono text-[11px] leading-8 antialiased transition-all duration-300 sm:text-[12px] sm:leading-8",
                    i === idx
                      ? "text-emerald-100"
                      : "text-text-secondary/80"
                  )}
                  style={
                    i === idx
                      ? { filter: "blur(0px)", opacity: 1 }
                      : {
                          filter: `blur(${Math.min(2.2, 1.2 + Math.abs(i - idx) * 0.55)}px)`,
                          opacity: Math.max(0.22, 0.62 - Math.abs(i - idx) * 0.12),
                        }
                  }
                >
                  {s}
                </p>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {phase === "done" && (
              <motion.div
                key="done-insight"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="mt-2 flex min-h-0 flex-1 flex-col rounded-xl border border-emerald-400/40 bg-black/35 px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(52,211,153,0.08),0_0_24px_-8px_rgba(52,211,153,0.15)] backdrop-blur-xl backdrop-saturate-150"
              >
                <div className="flex min-h-0 flex-1 flex-col font-mono">
                  <p className="text-[11px] leading-relaxed text-emerald-100/95 sm:text-[12px]">
                    $500k·20yr (flex) → mid mo, protect income first
                  </p>
                  <p
                    className="mt-1.5 text-[11px] leading-relaxed text-text-secondary/60 sm:text-[12px]"
                    style={{ filter: "blur(0.85px)", opacity: 0.68 }}
                  >
                    + earlier lines: clean health — lock $ after UW
                  </p>
                  <p
                    className="mt-1.5 text-[10px] leading-relaxed text-text-dim/55 sm:text-[11px]"
                    style={{ filter: "blur(1.2px)", opacity: 0.52 }}
                  >
                    → if UW comes back strong, flag preferred-class band
                  </p>
                  <p
                    className="mt-1.5 text-[9.5px] leading-relaxed text-text-dim/45 sm:text-[10px]"
                    style={{ filter: "blur(1.45px)", opacity: 0.4 }}
                  >
                    → next touch: confirm face + term w/ spouse timeline
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </article>
  );
}

function MeetingCaptureShowcaseCard() {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:p-5">
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:mt-2 sm:text-[1.9rem]">Every meeting, captured clearly</h3>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-3.5 backdrop-blur-xl sm:mt-6">
        <div className="px-1 py-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-text-dim/80">Transcript saved</p>
          <div className="mt-2 space-y-1.5 font-mono text-[11.5px] leading-relaxed text-text-secondary/85 sm:text-[12px]">
            <p style={{ filter: "blur(1px)", opacity: 0.82 }}>
              <span className="text-blue-300/95">Client:</span> &ldquo;$500k, 20 years—mainly protecting household income.&rdquo;
            </p>
            <p style={{ filter: "blur(1.2px)", opacity: 0.74 }}>
              <span className="text-orange-300/95">You:</span> &ldquo;Healthy 42, non-smoker, $500k/20yr—think mid monthly; preferred after UW, you can quote
              meaningfully lower.&rdquo;
            </p>
            <p style={{ filter: "blur(1.45px)", opacity: 0.64 }}>
              <span className="text-blue-300/95">Client:</span> &ldquo;If they&rsquo;re preferred, can we show a lower monthly too?&rdquo;
            </p>
            <p style={{ filter: "blur(1.75px)", opacity: 0.52 }}>
              <span className="text-orange-300/95">You:</span> &ldquo;Anything else I can help with—coverage, riders, or how this monthly fits your plan?&rdquo;
            </p>
          </div>

          <div className="mt-4 border-t border-white/10 px-1 pt-3">
            <p className="flex flex-wrap items-baseline gap-0.5 font-mono text-[11px] leading-relaxed sm:text-[12px]">
              <span className="text-white">Creating analysis of meeting</span>
              <span className="inline-flex translate-y-[0.5px] pl-0.5 text-[1.05em] font-medium leading-none text-emerald-300">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay }}
                  >
                    .
                  </motion.span>
                ))}
              </span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function FastTutorialCard() {
  return (
    <article className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5">
      <video
        src={TUTORIAL_VIDEO_SRC}
        muted
        playsInline
        preload="metadata"
        autoPlay
        controls
        controlsList="nodownload"
        className="relative aspect-video w-full rounded-2xl object-contain bg-black"
      />
    </article>
  );
}

function NotesToActionComparisonSection() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const rawNotes = [
    "Premium depends on age, health, tobacco use.",
    "$500k 20-year term mid range monthly pricing.",
    "Preferred class lowers cost at same coverage level.",
    "Talk about value before price.",
    "Confirm underwriting early to tighten estimate.",
  ];

  const steps = [
    {
      key: "pricing",
      title: "Pricing logic",
      body: (
        <div className="text-[13px] leading-relaxed text-text-secondary">
          Premium depends on:
          <ul className="mt-2 space-y-1 ml-0 pl-0 list-none">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/25" />
              Age
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/25" />
              Health
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/25" />
              Tobacco use
            </li>
          </ul>
        </div>
      ),
    },
    {
      key: "range",
      title: "Estimated range",
      body: (
        <div className="text-[13px] leading-relaxed text-text-secondary">
          $500k · 20-year term → typically mid-range monthly band.
        </div>
      ),
    },
    {
      key: "opt",
      title: "Optimization insight",
      body: (
        <div className="text-[13px] leading-relaxed text-text-secondary">
          Preferred underwriting class significantly reduces cost (same coverage).
        </div>
      ),
    },
    {
      key: "say",
      title: "How to say it",
      body: (
        <div className="text-[13px] leading-relaxed text-text-secondary">
          Frame protection first, then introduce price with context.
        </div>
      ),
    },
    {
      key: "confirm",
      title: "What to confirm",
      body: (
        <div className="text-[13px] leading-relaxed text-text-secondary">
          Lock in underwriting inputs early to tighten the estimate.
        </div>
      ),
    },
  ] as const;

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_35px_110px_-70px_rgba(0,0,0,0.9)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_15%_0%,rgba(255,255,255,0.07),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-0 py-0">
        <div className="text-center px-2 pt-8 pb-6">
          <h2 className="text-[1.6rem] sm:text-[2rem] font-semibold tracking-tight text-text-primary">
            From notes to something you can actually use
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] text-text-muted max-w-2xl mx-auto leading-relaxed">
            Most tools store information. Persuaid turns it into something you can act on in the moment.
          </p>
        </div>

        <div className="relative border-t border-white/10" />

        <div className="relative grid lg:grid-cols-2">
          {/* arrow indicator */}
          <div
            className="hidden lg:block pointer-events-none absolute left-1/2 top-20 bottom-10 w-px bg-white/10"
            aria-hidden
          />
          <div className="hidden lg:block pointer-events-none absolute left-1/2 -translate-x-1/2 top-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-text-dim/80">
              <span className="text-text-primary">→</span> transformed by Persuaid
            </div>
          </div>

          {/* LEFT: Raw Notes */}
          <div className="p-5 sm:p-6 border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/85">Your notes</p>
                <p className="mt-2 text-[13px] text-text-muted">Stored, but not usable in the moment</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
              <div className="space-y-3 text-[13px] leading-relaxed text-text-secondary/90">
                {rawNotes.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Persuaid */}
          <div className="p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/85">Persuaid</p>
                <p className="mt-2 text-[13px] text-text-muted">Structured, analyzed, and ready in real time</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl px-4 py-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="space-y-4">
                  {steps.map((s, i) => (
                    <motion.div
                      key={s.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">{s.title}</p>
                      <div className="mt-2">{s.body}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesToActionInteractiveDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scienceRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0.5);
  const targetRef = useRef(0.5);
  const currentRef = useRef(0.5);
  const rafRef = useRef<number | null>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const [transformStage, setTransformStage] = useState<0 | 1 | 2>(0);
  const [visibleBlocks, setVisibleBlocks] = useState<Record<string, boolean>>({
    pricing: false,
    range: false,
    opt: false,
    say: false,
    confirm: false,
  });

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  useEffect(() => {
    // Choreography: input → understanding → transformation → output
    const t1 = setTimeout(() => setTransformStage(1), 160); // show “Analyzing…” first
    const t2 = setTimeout(() => setTransformStage(2), 1250); // then begin structured output

    const order: Array<keyof typeof visibleBlocks> = ["pricing", "range", "opt", "say", "confirm"];
    const timers = order.map((key, i) =>
      setTimeout(() => {
        setVisibleBlocks((prev) => ({ ...prev, [key]: true }));
      }, 1400 + i * 300),
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Shimmer = ({ className }: { className?: string }) => (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-70",
        className
      )}
      animate={{ x: ["0%", "240%"] }}
      transition={{ duration: 1.9, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.2 }}
    />
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const animateToTarget = () => {
    const delta = targetRef.current - currentRef.current;
    const next = currentRef.current + delta * 0.16;
    currentRef.current = next;
    setX(next);

    if (Math.abs(delta) < 0.001) {
      rafRef.current = null;
      return;
    }

    rafRef.current = requestAnimationFrame(animateToTarget);
  };

  const setTargetFromPointer = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left) / r.width;
    targetRef.current = clamp(ratio, 0.18, 0.82);
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(animateToTarget);
  };

  // Keep layout stable: panels stay fixed at 50/50.
  // Hover only changes blur/opacity (inactive side becomes hard to read),
  // preventing text reflow/resizing jitter.
  const leftActive = x >= 0.5;
  const leftOpacity = leftActive ? 1 : 0.18;
  const rightOpacity = leftActive ? 0.18 : 1;
  const leftBlur = leftActive ? 0 : 2.25;
  const rightBlur = leftActive ? 2.25 : 0;

  const handleScale = leftActive ? 1.03 : 1.03;

  const rawNotes = [
    "Customer: 42-year-old, married, 2 kids, income protection",
    "Health: non-smoker, no major conditions",
    "Coverage: $500k · 20-year term",
    "Positioning: protect income first",
    "Pricing bands: Starter / Standard / Plus",
    "Underwriting: age + health determines range",
    "Objection: value first, numbers second",
  ];

  // Subtle depth on solid dark (no frosted-glass wash).
  const spotlight = `radial-gradient(620px circle at ${x * 100}% 50%, rgba(255,255,255,0.045), rgba(255,255,255,0.015) 40%, transparent 65%)`;

  useEffect(() => {
    if (!showWorkflow) return;
    // Simulate navigation: reveal + scroll to the “science” panel.
    const t = setTimeout(() => {
      scienceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => clearTimeout(t);
  }, [showWorkflow]);

  return (
    <div>
      <div className="mt-10 md:mt-14 text-center mb-10">
        <h2 className="text-4xl sm:text-[3.25rem] font-semibold tracking-tight text-text-primary">
          Make your notes useful for the first time
        </h2>
        <p className="mt-3 text-sm sm:text-[15px] text-white/60 max-w-2xl mx-auto leading-relaxed">
          Not stored. Not summarized. Actually usable in the moment.
        </p>

        <button
          type="button"
          onClick={() => setShowWorkflow((s) => !s)}
          className="mt-4 inline-flex items-center gap-2 text-[13px] sm:text-[14px] font-medium text-white/75 hover:text-white/90 underline-offset-4 hover:underline transition-colors"
          aria-expanded={showWorkflow}
        >
          How does this actually work?
          <span
            className={cn("transition-transform duration-200", showWorkflow ? "rotate-180" : "rotate-0")}
            aria-hidden
          >
            ▾
          </span>
        </button>

        <div className="mt-8 mx-auto w-[min(26rem,92%)] h-px bg-white/10" aria-hidden />
      </div>

      <AnimatePresence>
        {showWorkflow ? (
          <motion.div
            key="workflow"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="mx-auto mb-10 max-w-5xl px-4"
          >
            <div ref={scienceRef} className="scroll-mt-24">
              <div className="rounded-3xl border border-white/[0.07] bg-[color:var(--bg-near-black)] px-5 py-5 sm:px-6 sm:py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/80">
                  From messy notes to usable intelligence
                </p>
                <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-secondary/90">
                  <p>Persuaid doesn’t store your notes.</p>
                  <p className="text-white/80">It interprets them.</p>
                </div>

                <div className="mt-6 rounded-3xl border border-white/[0.07] bg-[#0d0d0f] overflow-hidden">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-4 border-b border-white/[0.08] sm:border-b-0 sm:border-r sm:border-white/[0.08]">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/85">Raw notes</p>
                      <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-white/60">
                        <p>Customer: 42-year-old, married, 2 kids, income protection</p>
                        <p>Health: non-smoker, no major conditions</p>
                        <p>Coverage: $500k · 20-year term</p>
                        <p>Positioning: protect income first</p>
                        <p>Pricing bands: Starter / Standard / Plus</p>
                        <p style={{ filter: "blur(2px)", opacity: 0.55 }}>Underwriting: age + health determines range</p>
                        <p style={{ filter: "blur(2px)", opacity: 0.55 }}>Objection: value first, numbers second</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/70">AI Notes</p>
                      <div className="mt-3 space-y-3">
                        <div className="rounded-2xl border border-white/[0.08] bg-[#121214] px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">Pricing logic</p>
                          <p className="mt-1 text-[13px] text-text-secondary/90">Underwriting tier → monthly band (coverage + term)</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-[#121214] px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">Suggested narrative</p>
                          <p className="mt-1 text-[13px] text-text-secondary/90">Lead with protection, then introduce price</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-[#121214] px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">Next line</p>
                          <p className="mt-1 text-[13px] text-text-secondary/90">
                            “Let’s focus on protecting income first—then I’ll show where this typically lands monthly based on your profile.”
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        ref={containerRef}
        className="relative mx-auto max-w-6xl mt-8 h-[500px] rounded-3xl border border-white/[0.07] overflow-hidden bg-[color:var(--bg-near-black)] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)]"
        style={{
          background:
            "linear-gradient(180deg, #131315 0%, var(--bg-near-black) 45%, #060606 100%)",
        }}
        onMouseMove={(e) => setTargetFromPointer(e.clientX)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          targetRef.current = 0.5;
          if (rafRef.current === null) rafRef.current = requestAnimationFrame(animateToTarget);
        }}
      >
        {/* Ambient wash + depth layers */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: spotlight,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35),transparent_45%)]"
          aria-hidden
        />

        {/* (no floating label) */}

          {/* Vertical divider */}
        <div
          className="absolute top-10 bottom-10 z-20"
          style={{ left: `${x * 100}%`, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <div className="absolute inset-0 w-px bg-white/12" />
          <div className="absolute inset-0 w-px bg-gradient-to-b from-white/25 via-white/10 to-white/25" />
          <div className="absolute inset-0 w-px bg-white/8" />
        </div>

        {/* Handle */}
          <div
          className="absolute top-1/2 z-30 rounded-full border border-white/12 bg-[#1c1c1e] shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
            style={{
              left: `${x * 100}%`,
              transform: `translate(-50%, -50%) scale(${handleScale})`,
            }}
            aria-hidden
          >
          <div className="flex items-center justify-center gap-2 px-3.5 py-2">
            <span className="text-[12px] font-semibold text-white/55">&lt;</span>
            <span className="text-[12px] font-semibold text-white/55">&gt;</span>
          </div>
        </div>

        {/* Subtle “AI connects ideas” lines (hover-only) */}
        <AnimatePresence>
          {isHovering && (
            <motion.svg
              key="connections"
              className="pointer-events-none absolute inset-0 z-[18]"
              viewBox="0 0 1000 500"
              preserveAspectRatio="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-hidden
            >
              <defs>
                <linearGradient id="connStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="35%" stopColor="rgba(255,255,255,0.16)" />
                  <stop offset="70%" stopColor="rgba(255,255,255,0.10)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <filter id="connGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* age + health → underwriting tier */}
              <motion.path
                d="M130 165 C 320 165, 430 210, 620 220"
                fill="none"
                stroke="url(#connStroke)"
                strokeWidth="1.2"
                strokeDasharray="4 10"
                filter="url(#connGlow)"
                animate={{ strokeDashoffset: [0, -28] }}
                transition={{ duration: 3.2, ease: "linear", repeat: Infinity }}
                style={{ opacity: 0.55 }}
              />

              {/* $500k / 20-year → estimated range */}
              <motion.path
                d="M130 250 C 340 270, 450 280, 640 305"
                fill="none"
                stroke="url(#connStroke)"
                strokeWidth="1.2"
                strokeDasharray="4 10"
                filter="url(#connGlow)"
                animate={{ strokeDashoffset: [0, -28] }}
                transition={{ duration: 3.2, ease: "linear", repeat: Infinity, delay: 0.15 }}
                style={{ opacity: 0.45 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Panels */}
        <div className="absolute inset-0">
          {/* LEFT: Raw Notes */}
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <div
              className="h-full w-full p-7 sm:p-10 transition-[opacity,filter,transform] duration-300"
              style={{
                opacity: leftOpacity,
                filter: `blur(${leftBlur}px) saturate(92%)`,
                transform: "scale(1)",
              }}
            >
              <div className="h-full rounded-2xl border border-white/[0.08] bg-[#0e0e10] relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" aria-hidden />

                <div className="relative h-full flex flex-col px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/85">Raw notes</p>
                    </div>
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-white/35" aria-hidden />
                  </div>

                  <div className="mt-5 flex-1 overflow-hidden">
                    <ul className="space-y-2.5 text-[13px] leading-relaxed text-text-secondary/85">
                      {rawNotes.map((l, i) => (
                        <li
                          key={l}
                          className="flex gap-3"
                          style={{
                            opacity: i < 4 ? 1 : Math.max(0.25, 0.62 - (i - 3) * 0.12),
                            filter: i < 4 ? "blur(0px)" : `blur(${1.2 + (i - 4) * 0.95}px)`,
                          }}
                        >
                          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-white/20" aria-hidden />
                          <span className="flex-1">{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <div className="h-px bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Persuaid */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <div
              className="h-full w-full p-6 sm:p-8 transition-[opacity,filter,transform] duration-300"
              style={{
                opacity: rightOpacity,
                filter: `blur(${rightBlur}px) saturate(105%)`,
                transform: "scale(1)",
              }}
            >
                <div className="h-full rounded-2xl border border-white/[0.08] border-t-emerald-500/20 bg-[#0e0e10] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-24px_48px_-32px_rgba(26,157,120,0.06)]">
                <div className="relative h-full px-4 py-4 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/75">AI Notes</p>
                      <p className="mt-2 text-[13px] text-text-secondary/72">
                        Structured, analyzed,{" "}
                        <span className="text-emerald-200/80">ready to act</span>
                      </p>
                    </div>
                    <div className="mt-1 rounded-full border border-emerald-500/25 bg-emerald-500/[0.09] px-3 py-1 text-[11px] font-medium text-emerald-200/90">
                      Live
                    </div>
                  </div>

                  {/* Step 1: reorganize hint */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={transformStage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] border-l-emerald-500/35 bg-[#121214] p-4">
                      <Shimmer className="opacity-25" />
                      <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/65">
                        Analyzing your notes<span className="inline-flex w-[1.25em] justify-start">
                          <motion.span
                            aria-hidden
                            animate={{ opacity: [0.35, 1, 0.35] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                          >
                            …
                          </motion.span>
                        </span>
                      </p>
                      <p className="mt-2 text-[13px] text-text-secondary/80 leading-relaxed">
                        Persuaid identifies{" "}
                        <span className="rounded bg-emerald-500/[0.12] px-1 text-emerald-100/88">underwriting signals</span>,{" "}
                        <span className="rounded bg-emerald-500/[0.12] px-1 text-emerald-100/88">pricing anchors</span>, and{" "}
                        <span className="rounded bg-emerald-500/[0.12] px-1 text-emerald-100/88">positioning intent</span> — then
                        reconstructs them into something usable in the moment.
                      </p>
                    </div>
                  </motion.div>

                  {/* Step 2: polished modules */}
                  <div className="mt-4 space-y-2 overflow-hidden">
                    {transformStage >= 2 ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={visibleBlocks.pricing ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                          transition={{ duration: 0.42 }}
                        >
                      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] border-l-emerald-500/30 bg-[#121214] px-4 py-4">
                        <Shimmer className="opacity-20" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400/45 shadow-[0_0_8px_rgba(52,211,153,0.25)]" aria-hidden />
                            <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/70">Pricing logic</p>
                          </div>
                          <span className="text-[11px] text-emerald-200/45">Tiered underwriting</span>
                        </div>
                        <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                          Underwriting determines pricing tier:
                          <span className="block mt-2 text-text-secondary/85">
                            - Age<br />
                            - <span className="rounded bg-emerald-500/[0.14] px-1 text-emerald-100/85">Health class</span>
                            <br />
                            - Tobacco status
                          </span>
                          <span className="block mt-2">
                            Coverage and term map that tier into a monthly range.
                          </span>
                        </p>
                      </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={visibleBlocks.range ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                          transition={{ duration: 0.42 }}
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-white/20" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/90">Estimated range</p>
                            </div>
                            <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                              $500k · 20-year term
                              <br />→ typically mid-range monthly band
                              <br />
                              <span className="text-text-secondary/75">If underwriting improves → shifts lower</span>
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={visibleBlocks.opt ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                          transition={{ duration: 0.42 }}
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-white/20" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/90">Optimization insight</p>
                            </div>
                            <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                              <span className="rounded bg-white/[0.08] px-1 text-white/90">Preferred class</span> can
                              significantly reduce cost
                              <br />
                              <span className="text-text-secondary/75">without changing coverage</span>
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={visibleBlocks.say ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                          transition={{ duration: 0.42 }}
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-white/20" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/90">How to say it</p>
                            </div>
                            <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed whitespace-pre-line">
                              “Let’s focus on protecting income first —
                              then I’ll show you where this typically lands monthly based on your profile.”
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={visibleBlocks.confirm ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                          transition={{ duration: 0.42 }}
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-white/20" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/90">What to confirm</p>
                            </div>
                            <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                              Age
                              <br />
                              <span className="rounded bg-white/[0.08] px-1 text-white/85">Health class</span>
                              <br />
                              Tobacco status
                              <br />
                              Term length
                              <br />
                              <span className="text-text-secondary/75">→ locks in a tighter estimate instantly</span>
                            </p>
                          </div>
                        </motion.div>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="h-1.5 w-full rounded-full bg-white/8">
                      <div className="h-full w-[64%] rounded-full bg-white/16" />
                    </div>
                    <p className="mt-2 text-[12px] text-text-dim/85">
                      Hover to preview how your notes become usable in real time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RevenueResearchAccordion() {
  const [open, setOpen] = useState(false);
  const questions = [
    "If every rep had your top performer’s answers in real time… what would that change?",
    "What percentage of onboarding actually shows up in real calls?",
    "How much time do senior reps spend helping others instead of selling?",
    "How many deals slow down because reps don’t answer something confidently?",
    "What do reps “know” in training but fail to use on live calls?",
  ] as const;

  return (
    <div className="mt-7">
      <div className="overflow-hidden rounded-xl border border-white/[0.09] bg-black/30 backdrop-blur-sm transition-colors hover:border-white/[0.14]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-4 sm:py-4"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-dim/80">Questions we asked</span>
          <ChevronDownIcon
            className={cn(
              "h-4 w-4 shrink-0 text-emerald-200/70 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <ul className="space-y-3.5 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                {questions.map((q) => (
                  <li
                    key={q}
                    className="flex gap-3 text-[14px] sm:text-[15px] leading-snug text-text-primary/95"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-300/55" aria-hidden />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing-home min-h-screen antialiased">
      {/* Announcement strip + nav over hero (both scroll with page) */}
      <LandingResearchBanner />
      <div className="relative">
        <Navbar landing announcementBar />
        <Hero landing />
      </div>

      <Section className="border-t border-white/[0.06] py-16 md:py-22 lg:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45 }}
            className="mb-8 md:mb-10"
          >
            <h2 className="text-left text-4xl sm:text-5xl lg:text-[3.15rem] xl:text-[3.45rem] font-semibold tracking-[-0.025em] leading-[1.06] text-text-primary">
              How Persuaid works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <ProductKnowledgeShowcaseCard />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.04 }}>
              <NotesRetrievalShowcaseCard />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
              <EnterInstantAnswerShowcaseCard />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.12 }}>
              <MeetingCaptureShowcaseCard />
            </motion.div>
          </div>

        </div>
      </Section>

      <Section className="border-t border-white/[0.06] py-12 md:py-16 lg:py-22">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 md:mb-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">Tutorial</p>
          </div>
          <FastTutorialCard />
        </div>
      </Section>

      <Section className="pt-24 pb-20 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotesToActionInteractiveDemo />
        </div>
      </Section>

      <section className="relative border-t border-white/[0.06] bg-[var(--bg-near-black)] py-24 md:py-32 lg:py-36 overflow-hidden">
        {/* Full-bleed art — same pattern as landing Hero (bg layer + cover + position) */}
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[var(--bg-near-black)]"
          aria-hidden
        >
          <div
            className="absolute min-h-full min-w-full bg-no-repeat bg-cover"
            style={{
              backgroundImage: "url(/landing-dunes-bg.png?v=1)",
              top: "-6%",
              left: "-12%",
              right: "-12%",
              bottom: "-8%",
              backgroundPosition: "50% 100%",
            }}
          />
        </div>
        {/* Blend from section above */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-[var(--bg-near-black)] to-transparent sm:h-36"
          aria-hidden
        />
        {/* Bright sand at bottom: pull back to page bg so type + cards stay readable */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(78%,560px)] bg-gradient-to-t from-[var(--bg-near-black)] via-[var(--bg-near-black)]/88 to-transparent sm:h-[min(72%,620px)]"
          aria-hidden
        />
        {/* Overall veil so mid-tone dunes don’t compete with text */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[var(--bg-near-black)]/25"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-row items-start gap-6 lg:col-span-4 lg:flex-col lg:gap-8"
            >
              <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.28em] text-text-dim/75 [writing-mode:vertical-rl] rotate-180 sm:text-[11px] lg:pt-1">
                For revenue teams
              </p>
              <div className="hidden h-px w-full max-w-[8rem] bg-gradient-to-r from-white/25 to-transparent lg:block" aria-hidden />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
              className="lg:col-span-8"
            >
              <h2 className="font-sans text-4xl sm:text-5xl lg:text-[3.15rem] xl:text-[3.45rem] font-semibold tracking-[-0.025em] leading-[1.06] text-text-primary">
                <span className="block">Train faster.</span>
                <span className="mt-1 block bg-gradient-to-r from-emerald-200/[0.92] via-[#e8e4dc]/90 to-violet-200/[0.88] bg-clip-text text-transparent">
                  Perform better.
                </span>
              </h2>
              <div className="mt-8 max-w-xl border-l border-white/[0.12] pl-6 sm:pl-7">
                <p className="text-[15px] sm:text-base leading-[1.65] text-text-muted">
                  We reached out to over 1,000 sales teams to learn what breaks on live calls—two college students,
                  asking for nothing but honest answers. If we reached out to you, we&rsquo;d love to have you on the
                  team.
                </p>
                <Link
                  href="/what-we-found-out"
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-[-0.02em] text-emerald-200/90 underline decoration-emerald-200/25 underline-offset-[3px] transition-colors hover:text-emerald-100/95 hover:decoration-emerald-100/40 sm:mt-6 sm:text-[15px]"
                >
                  Read more
                  <span aria-hidden className="text-emerald-200/70">
                    →
                  </span>
                </Link>
                <RevenueResearchAccordion />
              </div>
            </motion.div>
          </div>

          <div className="mt-16 sm:mt-20 lg:mt-24 space-y-6 sm:space-y-8">
            {(
              [
                {
                  kind: "stat" as const,
                  index: "01",
                  figure: "~30–50%",
                  figureClass:
                    "font-mono text-[clamp(1.85rem,4vw,2.35rem)] tabular-nums text-emerald-200/90",
                  label: "faster ramp to productivity",
                  line: "Most reps take 1–3 months to ramp but still hesitate in real calls.",
                  note: "A lot of that hesitation is missing product knowledge under pressure—confidence drops when they can’t pull the right detail live.",
                  stroke: "from-emerald-400/70 via-emerald-300/25 to-transparent",
                  stagger: "lg:translate-y-0",
                },
                {
                  kind: "stat" as const,
                  index: "02",
                  figure: "~70%",
                  figureClass:
                    "font-mono text-[clamp(1.85rem,4vw,2.35rem)] tabular-nums text-violet-200/88",
                  label: "don’t feel confident after onboarding",
                  line: "Only ~30% of reps feel fully prepared.",
                  note: "Hesitation mid-conversation lowers trust—and costs deals.",
                  stroke: "from-violet-400/65 via-violet-300/22 to-transparent",
                  stagger: "lg:translate-y-6",
                },
                {
                  kind: "statement" as const,
                  index: "03",
                  line: "Delays and uncertainty are where deals lose momentum.",
                  stroke: "from-sky-400/65 via-sky-300/22 to-transparent",
                  stagger: "lg:translate-y-0",
                },
                {
                  kind: "bullets" as const,
                  index: "04",
                  title: "Top teams win on consistency",
                  bullets: ["Higher win rates", "Faster cycles", "More predictable revenue"],
                  stroke: "from-emerald-400/60 via-teal-300/20 to-transparent",
                  stagger: "lg:translate-y-6",
                },
                {
                  kind: "closing" as const,
                  title: "Bottom line",
                  line:
                    "The teams that execute faster—with confidence and consistency—are the ones that outperform everyone else.",
                  stroke: "from-white/35 via-white/10 to-transparent",
                },
              ] as const
            ).map((row, index) => {
              if (row.kind === "statement") {
                return (
                  <motion.article
                    key={row.index}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.06 }}
                    className={cn(
                      "group relative overflow-hidden rounded-[1.35rem] bg-black/35 p-6 sm:p-8 lg:p-9",
                      "ring-1 ring-white/[0.1] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)] backdrop-blur-md",
                      row.stagger
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b opacity-90",
                        row.stroke
                      )}
                      aria-hidden
                    />
                    <div className="pointer-events-none absolute -right-8 -top-10 font-display text-[7rem] leading-none text-white/[0.03] sm:text-[8.5rem]">
                      {row.index}
                    </div>
                    <p className="relative max-w-3xl font-display text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-text-primary/95">
                      {row.line}
                    </p>
                  </motion.article>
                );
              }
              if (row.kind === "bullets") {
                return (
                  <motion.article
                    key={row.index}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.06 }}
                    className={cn(
                      "group relative overflow-hidden rounded-[1.35rem] bg-black/35 p-6 sm:p-8 lg:p-9",
                      "ring-1 ring-white/[0.1] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)] backdrop-blur-md",
                      row.stagger
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b opacity-90",
                        row.stroke
                      )}
                      aria-hidden
                    />
                    <div className="pointer-events-none absolute -right-8 -top-10 font-display text-[7rem] leading-none text-white/[0.03] sm:text-[8.5rem]">
                      {row.index}
                    </div>
                    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-10">
                      <h3 className="font-display text-[clamp(1.5rem,3.5vw,1.95rem)] leading-tight text-text-primary">
                        {row.title}
                      </h3>
                      <ul className="space-y-3">
                        {row.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex gap-3 text-[15px] sm:text-[16px] leading-relaxed text-text-secondary/95"
                          >
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-300/60" aria-hidden />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.article>
                );
              }
              if (row.kind === "closing") {
                return (
                  <motion.article
                    key="bottom-line"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 sm:p-8 lg:p-9 ring-1 ring-white/[0.12] backdrop-blur-md"
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b opacity-90",
                        row.stroke
                      )}
                      aria-hidden
                    />
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-dim/80">{row.title}</p>
                    <p className="mt-3 max-w-3xl text-[17px] sm:text-[18px] leading-relaxed text-text-primary/95">
                      {row.line}
                    </p>
                  </motion.article>
                );
              }
              return (
                <motion.article
                  key={row.index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -12 : 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.06 }}
                  className={cn(
                    "group relative overflow-hidden rounded-[1.35rem] bg-black/35 p-6 sm:p-8 lg:p-9",
                    "ring-1 ring-white/[0.1] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)]",
                    "backdrop-blur-md transition-shadow duration-500 hover:shadow-[0_32px_90px_-44px_rgba(0,0,0,0.75)]",
                    row.stagger
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b opacity-90",
                      row.stroke
                    )}
                    aria-hidden
                  />
                  <div className="pointer-events-none absolute -right-8 -top-10 font-display text-[7rem] leading-none text-white/[0.03] transition-colors duration-500 group-hover:text-white/[0.045] sm:text-[8.5rem]">
                    {row.index}
                  </div>

                  <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-12 lg:items-start">
                    <div>
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn("font-medium tracking-tight", row.figureClass)}>{row.figure}</span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold tracking-tight text-text-primary sm:text-[17px]">
                        {row.label}
                      </h3>
                    </div>
                    <div className="space-y-4 lg:pt-1">
                      <p className="text-[15px] sm:text-[16px] leading-relaxed text-text-secondary/95">{row.line}</p>
                      {row.note ? (
                        <p className="text-[13px] leading-relaxed text-text-dim/78 sm:text-[13.5px]">{row.note}</p>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <FAQSection />

      <LandingPreFooterCta />

      <Footer />
    </main>
  );
}
