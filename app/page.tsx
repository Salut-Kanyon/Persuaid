"use client";

/*
 * Marketing home: editorial rhythm, muted organic palette, restrained chrome.
 * Goal: credible B2B tool for reps under pressure — not generic “AI SaaS” gloss.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";
import { LandingPreFooterCta } from "@/components/landing/LandingPreFooterCta";

function ProductKnowledgeShowcaseCard() {
  const typedLines = [
    "Case: 42-year-old, married, 2 kids, income protection",
    "Goal: $500k–$1M coverage, 20-year term",
    "Risk factors: non-smoker, no major conditions — Positioning: protect income first, adjust coverage later—then",
  ] as const;

  const blurLines = [
    "Pricing bands (by preferred class): Starter / Standard / Plus",
    "Policy details: confirm term length vs monthly premium band",
    "Underwriting notes: age + health class drives estimate range",
    "Objection handling: value first, numbers second",
    "Case specifics: timeline + decision-maker preference",
  ] as const;

  const fullText = typedLines.join("\n");
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    const speedMs = 18;
    const tick = setInterval(() => {
      setTypedChars((n) => {
        if (n >= fullText.length) return n;
        return n + 1;
      });
    }, speedMs);
    return () => {
      clearInterval(tick);
    };
  }, [fullText.length]);

  const shown = fullText.slice(0, typedChars);
  const lineCount = shown.split("\n").length;

  return (
    <article className="relative h-full min-h-[332px] overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:p-5 shadow-none">
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:mt-2 sm:text-[1.9rem]">
        Input your product knowledge
      </h3>
      <p className="mt-2 text-sm text-text-muted sm:text-[0.95rem]">Policies, pricing notes, rates, and more</p>
      <div className="mt-4 rounded-2xl border border-white/12 bg-black/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl backdrop-saturate-125 sm:mt-5 sm:p-3.5">
        <pre className="h-[84px] overflow-hidden whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text-secondary font-mono">
          {shown}
          <span className="inline-block w-[7px] h-[1em] align-[-2px] bg-emerald-200/35 animate-pulse ml-0.5" />
        </pre>
        <div className="mt-1 space-y-1">
          {blurLines.map((l, i) => (
            <div
              key={l}
              className="text-[12px] leading-relaxed text-text-secondary/75 font-mono"
              style={{
                filter: "blur(2px)",
                opacity: 0.65 - i * 0.1,
              }}
            >
              {l}
            </div>
          ))}
        </div>
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
    <article className="relative h-full min-h-[430px] overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:min-h-[456px] sm:p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/75">Listens Live</p>
      <h3 className="mt-2.5 text-2xl font-semibold tracking-tight text-text-primary sm:mt-3 sm:text-[1.95rem]">Right answer at your fingertips</h3>

      <div className="mt-5 p-0 sm:mt-6">
        <p className="text-[11px] uppercase tracking-[0.12em] text-white">Question</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary sm:text-[15px]">
          What would this cost monthly for someone in their early 40s?
        </p>

        <div className="mt-4 flex items-center justify-start gap-2.5">
          <span className="text-[12px] text-text-dim">Press</span>
          <motion.span
            animate={phase === "press" ? { scale: 0.92, y: 1 } : { scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="inline-flex items-center justify-center rounded-full border border-[#4dc49a]/45 bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] px-3 py-1 text-[12px] font-semibold text-white shadow-[0_0_0_1px_rgba(26,157,120,0.4),0_3px_12px_rgba(26,157,120,0.35)]"
          >
            Enter
          </motion.span>
        </div>

        <div className="mt-5 h-[156px] overflow-hidden p-0 sm:mt-6 sm:h-[168px]">
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
                className="space-y-2 rounded-xl border border-white/15 bg-white/[0.02] p-3"
              >
                {pass === 0 ? (
                  <>
                    <p className="text-[14px] leading-relaxed text-text-primary/95 sm:text-[14.5px]">
                      For a healthy 42-year-old non-smoker, a $500k 20-year term policy typically fits in the mid-range monthly
                      band. If underwriting comes back preferred, the monthly premium can drop meaningfully.
                    </p>
                    <p className="text-[13px] leading-relaxed text-emerald-200/90">
                      Follow-up: Should I quote conservative first, then show the preferred-class scenario once underwriting is confirmed?
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] leading-relaxed text-text-primary/95 sm:text-[14.5px]">
                      Estimated outcome: mid-range monthly premium for a 42-year-old healthy non-smoker at $500k over 20 years,
                      with potential downward adjustment in a preferred underwriting class.
                    </p>
                    <p className="text-[13px] leading-relaxed text-emerald-200/90">
                      Next question: Want me to present both a standard quote and a preferred-class best-case quote side by side?
                    </p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] text-text-dim/70">
                Press Enter
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="h-2 sm:h-3" aria-hidden />
      </div>
    </article>
  );
}

function NotesRetrievalShowcaseCard() {
  const segments = [
    "Customer profile: 42 years old, married, two kids, focused on income protection.",
    "Health snapshot: non-smoker, no major conditions mentioned so far.",
    "Coverage target: $500k for a 20-year term, open to adjusting later.",
  ] as const;
  const noteConnections = [
    "AI extracts the customer's household and protection intent.",
    "AI evaluates underwriting quality from health and tobacco signals.",
    "AI anchors estimate to requested coverage and term length.",
    "AI aligns messaging to protection-first positioning.",
    "AI checks for preferred-class pricing upside.",
    "AI combines everything into a single actionable insight.",
  ] as const;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("idle");
  const ranRef = useRef(false);
  const rowHeight = 36;
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
    <article className="relative h-full min-h-[348px] overflow-hidden rounded-3xl border border-transparent bg-transparent p-4 sm:min-h-[372px] sm:p-6 shadow-none">
      <h3 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-text-primary sm:mt-2 sm:text-[1.8rem]">Connect your notes with the AI</h3>
      <div className="relative mt-5 h-[272px] overflow-hidden rounded-2xl border border-white/18 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl backdrop-saturate-150 sm:mt-6 sm:h-[292px]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="flex h-full flex-col p-3">
          <div className="relative h-[142px] overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl backdrop-saturate-150 sm:h-[150px]">
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
                    "h-9 truncate whitespace-nowrap px-2 text-[13px] leading-9 transition-all duration-300 sm:text-[13.5px]",
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
                className="mt-2 min-h-[104px] rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl backdrop-saturate-150 sm:min-h-[112px]"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-200/80">Insights</p>
                  <div className="mt-1 h-px w-full bg-white/10" />
                  <p className="mt-1 text-[12px] leading-relaxed text-text-primary sm:text-[12.5px]">
                    Based on the highlighted note, AI recommends a protection-first quote for a healthy customer in their early
                    40s: start with a mid-range monthly estimate for $500k over 20 years, then tighten the number after
                    underwriting details are confirmed.
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
      <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/75">After the call</p>
      <h3 className="mt-2.5 text-2xl font-semibold tracking-tight text-text-primary sm:mt-3 sm:text-[1.95rem]">Every meeting, captured clearly</h3>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-3.5 backdrop-blur-xl sm:mt-6">
        <div className="px-1 py-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-text-dim/80">Transcript saved</p>
          <div className="mt-2 space-y-1.5 font-mono text-[12px] leading-relaxed text-text-secondary/85">
            <p>
              <span className="text-blue-300/95">You:</span> "Looking at $500k over 20 years with a focus on protecting family income."
            </p>
            <p>
              <span className="text-orange-300/95">Rep:</span> "Great, we can anchor protection first, then refine pricing by underwriting class."
            </p>
            <p>
              <span className="text-text-dim/70">Transcript:</span> "Client asks monthly estimate, coverage flexibility, and follow-up timeline."
            </p>
            <p style={{ filter: "blur(1.6px)", opacity: 0.7 }}>
              <span className="text-blue-300/95">You:</span> "If preferred class applies, can we show a lower best-case monthly option too?"
            </p>
            <p style={{ filter: "blur(2px)", opacity: 0.58 }}>
              <span className="text-orange-300/95">Rep:</span> "Yes - I will present standard and preferred scenarios side by side on follow-up."
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

type TutorialSubtitle = {
  start: number;
  end?: number;
  text: string;
};

const TUTORIAL_SUBTITLES: TutorialSubtitle[] = [
  { start: 15, end: 18, text: "Hello whats up ready to help me sell:" },
  { start: 18, end: 22, text: "what are the typical pricing ranges in your policy:" },
  { start: 22, end: 30, text: "give me an example of a healthy young person price" },
  { start: 30, text: "give me the three types of insurances" },
];

function FastTutorialCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [subtitle, setSubtitle] = useState<string>("");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const compute = () => {
      const t = v.currentTime;
      const active =
        TUTORIAL_SUBTITLES.find((s) => t >= s.start && (s.end === undefined || t < s.end)) ??
        TUTORIAL_SUBTITLES[TUTORIAL_SUBTITLES.length - 1];
      setSubtitle(t >= TUTORIAL_SUBTITLES[0]!.start ? active.text : "");
    };

    compute();
    v.addEventListener("timeupdate", compute);
    v.addEventListener("seeked", compute);
    return () => {
      v.removeEventListener("timeupdate", compute);
      v.removeEventListener("seeked", compute);
    };
  }, []);

  return (
    <article className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5">
      <video
        ref={videoRef}
        src="/go.mp4"
        muted
        playsInline
        autoPlay
        loop
        preload="metadata"
        className="relative aspect-video w-full rounded-2xl object-contain"
      />

      <div className="pointer-events-none absolute left-6 top-6 z-10">
        <div className="rounded-2xl border border-white/10 bg-black/55 px-3.5 py-2 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">Fast Tutorial</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-pulse" />
            <p className="text-[12px] text-white/90">Listening (subtitles)</p>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-white/95">{subtitle || " "}</p>
        </div>
      </div>
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
  const leftBlur = leftActive ? 0 : 3.4;
  const rightBlur = leftActive ? 3.4 : 0;

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

  // Subtle neutral spotlight (avoid “blue neon” look).
  const spotlight = `radial-gradient(640px circle at ${x * 100}% 50%, rgba(255,255,255,0.08), rgba(255,255,255,0.03) 35%, transparent 62%)`;

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
              <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-2xl px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/80">
                  From messy notes to usable intelligence
                </p>
                <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-secondary/90">
                  <p>Persuaid doesn’t store your notes.</p>
                  <p className="text-white/80">It interprets them.</p>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 overflow-hidden">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-4 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
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
                      <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">AI Notes</p>
                      <div className="mt-3 space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">Pricing logic</p>
                          <p className="mt-1 text-[13px] text-text-secondary/90">Underwriting tier → monthly band (coverage + term)</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">Suggested narrative</p>
                          <p className="mt-1 text-[13px] text-text-secondary/90">Lead with protection, then introduce price</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
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
        className="relative mx-auto max-w-6xl mt-8 h-[500px] rounded-3xl border border-white/10 overflow-hidden backdrop-blur-2xl bg-black/30"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent)]"
          aria-hidden
        />

        {/* (no floating label) */}

          {/* Vertical divider */}
        <div
          className="absolute top-10 bottom-10 z-20"
          style={{ left: `${x * 100}%`, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <div className="absolute inset-0 w-px bg-white/25" />
          <div className="absolute inset-0 w-px bg-gradient-to-b from-white/60 via-white/20 to-white/60" />
          <div className="absolute inset-0 w-px bg-white/15" />
        </div>

        {/* Handle */}
          <div
          className="absolute top-1/2 z-30 rounded-full border border-white/25 bg-white/75 backdrop-blur-md"
            style={{
              left: `${x * 100}%`,
              transform: `translate(-50%, -50%) scale(${handleScale})`,
            }}
            aria-hidden
          >
          <div className="flex items-center justify-center gap-2 px-3.5 py-2">
            <span className="text-[12px] font-semibold text-black/85">&lt;</span>
            <span className="text-[12px] font-semibold text-black/85">&gt;</span>
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
              <div className="h-full rounded-2xl border border-white/10 bg-black/35 relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" aria-hidden />

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
                <div className="h-full rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="relative h-full px-4 py-4 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">AI Notes</p>
                      <p className="mt-2 text-[13px] text-text-secondary/65">Structured, analyzed, ready to act</p>
                    </div>
                    <div className="mt-1 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] text-emerald-200/90">
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
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                      <Shimmer className="opacity-35" />
                      <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim/85">
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
                        <span className="rounded bg-white/[0.06] px-1 text-white/85">underwriting signals</span>,{" "}
                        <span className="rounded bg-white/[0.06] px-1 text-white/85">pricing anchors</span>, and{" "}
                        <span className="rounded bg-white/[0.06] px-1 text-white/85">positioning intent</span> — then
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
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur px-4 py-4">
                        <Shimmer className="opacity-25" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-300/30" aria-hidden />
                            <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">Pricing logic</p>
                          </div>
                          <span className="text-[11px] text-text-dim/70">Tiered underwriting</span>
                        </div>
                        <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                          Underwriting determines pricing tier:
                          <span className="block mt-2 text-text-secondary/85">
                            - Age<br />
                            - <span className="rounded bg-emerald-300/10 px-1 text-white/85">Health class</span>
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
                          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-300/30" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">Estimated range</p>
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
                          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-300/30" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">Optimization insight</p>
                            </div>
                            <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                              <span className="rounded bg-emerald-300/10 px-1 text-white/90">Preferred class</span> can
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
                          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-300/30" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">How to say it</p>
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
                          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-300/30" aria-hidden />
                              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">What to confirm</p>
                            </div>
                            <p className="mt-2 text-[14px] text-text-secondary/90 leading-relaxed">
                              Age
                              <br />
                              <span className="rounded bg-emerald-300/10 px-1 text-white/85">Health class</span>
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
      {/* One stack: nav overlays hero top; both scroll away together (nav is not fixed to viewport) */}
      <div className="relative">
        <Navbar landing />
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
            <h2 className="text-left text-3xl sm:text-4xl lg:text-[2.55rem] font-semibold tracking-tight text-text-primary">
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
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">Fast Tutorial</p>
          </div>
          <FastTutorialCard />
        </div>
      </Section>

      <Section className="pt-24 pb-20 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotesToActionInteractiveDemo />
        </div>
      </Section>

      <Section className="border-t border-white/[0.06] bg-[var(--bg-near-black)] py-20 md:py-24 lg:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 lg:items-center"
          >
            <div className="lg:col-span-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">On every call</p>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold tracking-tight text-text-primary">
                Real-time understanding
              </h2>
              <ul className="mt-5 space-y-2.5 text-sm sm:text-[15px] text-text-muted leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400/50" aria-hidden />
                  <span>New agents ramp faster.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/45" aria-hidden />
                  <span>Your team stays consistent.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400/45" aria-hidden />
                  <span>
                    You just{" "}
                    <span className="bg-gradient-to-r from-emerald-200/85 via-violet-200/75 to-sky-200/80 bg-clip-text text-transparent font-medium">
                      know what to say
                    </span>
                    .
                  </span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-8">
              <div className="relative overflow-hidden rounded-[1.85rem] bg-white/[0.02] shadow-[0_44px_160px_-110px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.06]">
                <div
                  className="pointer-events-none absolute -left-28 -top-36 h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl"
                  aria-hidden
                />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/10">
                      <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-300/70" />
                      <span className="text-[11px] font-medium text-emerald-100/90">Live</span>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-text-dim/80">On-call</span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-5 lg:items-stretch">
                    <div className="overflow-hidden rounded-2xl bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/[0.07]">
                      <div className="px-4 py-3 sm:px-5">
                        <div className="flex items-start gap-3 text-[13px] sm:text-[14px]">
                          <span className="w-11 shrink-0 pt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/45">
                            Rep
                          </span>
                          <p className="min-w-0 leading-relaxed text-white/72">
                            &ldquo;What would this cost monthly?&rdquo;
                          </p>
                        </div>
                      </div>
                      <div className="h-px bg-white/[0.08]" aria-hidden />
                      <div className="px-4 py-3 sm:px-5">
                        <div className="flex items-start gap-3 text-[13px] sm:text-[14px]">
                          <span className="w-11 shrink-0 pt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/45">
                            Client
                          </span>
                          <p className="min-w-0 leading-relaxed text-white/72">
                            &ldquo;I&rsquo;m in my early 40s and healthy.&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex min-h-0"
                    >
                      <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.11] to-white/[0.05] backdrop-blur-xl ring-1 ring-white/20 shadow-[0_18px_70px_-46px_rgba(0,0,0,0.85)]">
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-300/10 ring-1 ring-emerald-200/20 text-[11px] font-semibold text-emerald-100/90">
                              AI
                            </span>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-100/85">
                              It&rsquo;s{" "}
                              <span className="bg-gradient-to-r from-emerald-200/85 via-violet-200/75 to-sky-200/80 bg-clip-text text-transparent">
                                already there
                              </span>
                            </p>
                          </div>
                          <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-white/92">
                            For a healthy 42-year-old non-smoker, <span className="text-emerald-100/95">$500k</span> /{" "}
                            <span className="text-emerald-100/95">20-year term</span> typically lands in a mid-range
                            monthly band. If underwriting comes back preferred, the premium can drop meaningfully.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
              <h2 className="font-display text-[clamp(2.15rem,5.5vw,3.35rem)] leading-[1.06] font-normal tracking-[-0.02em] text-text-primary">
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
