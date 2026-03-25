"use client";

/*
 * Marketing home: editorial rhythm, muted organic palette, restrained chrome.
 * Goal: credible B2B tool for reps under pressure — not generic “AI SaaS” gloss.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";
import { TryWorkspaceDemo } from "@/components/landing/TryWorkspaceDemo";
import { LandingTestimonialsSection } from "@/components/landing/LandingTestimonials";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Organic flow connectors — moss/sage, matches landing hero palette */
function StepsArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-9 w-[4.5rem] shrink-0 text-[color:var(--landing-sage)]/60", className)}
      viewBox="0 0 88 36"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 22c18-10 38-14 56-6s22 10 26 2"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M6 20c20-8 42-10 62-2"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72 12l12 10-12 10"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepsArrowDown({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-14 w-11 shrink-0 text-[color:var(--landing-sage)]/60", className)}
      viewBox="0 0 44 64"
      fill="none"
      aria-hidden
    >
      <path
        d="M22 6v36c0 10 6 14 12 8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d="M22 8v38"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M12 42l10 12 10-12"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Step02MiniUI() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [justClicked, setJustClicked] = useState(false);

  useEffect(() => {
    if (isRecording) return;
    let pauseT: ReturnType<typeof setTimeout>;
    const startT = setTimeout(() => {
      setJustClicked(true);
      pauseT = setTimeout(() => {
        setJustClicked(false);
        setIsRecording(true);
      }, 220);
    }, 2200);
    return () => {
      clearTimeout(startT);
      clearTimeout(pauseT!);
    };
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const resetT = setTimeout(() => {
      setIsRecording(false);
      setElapsed(0);
    }, 10000);
    return () => clearTimeout(resetT);
  }, [isRecording]);

  return (
    <div className="w-full max-w-md rounded-lg border border-stone-600/25 bg-background shadow-[0_8px_28px_-6px_rgba(0,0,0,0.4)] px-3 py-2.5 flex items-center justify-center min-h-[88px] gap-2 flex-wrap">
      <AnimatePresence mode="wait">
        {!isRecording ? (
          <motion.div
            key="start"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ scale: justClicked ? 0.92 : 1 }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center gap-1.5 rounded-md border border-stone-500/35 bg-[color:var(--landing-moss)] px-4 py-2 text-xs font-semibold tracking-tight text-stone-100 shadow-sm"
          >
            <span className="relative z-[1]">Start Call</span>
            <span
              className="relative z-[1] inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300/40"
              aria-hidden
            />
          </motion.div>
        ) : (
          <motion.div
            key="pause"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 flex-wrap justify-center"
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-md",
                "bg-red-500/10 border border-red-500/30 text-red-400"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Pause</span>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center gap-1.5 rounded-lg bg-background-elevated/80 border border-border-subtle px-2 py-1"
            >
              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-text-primary tabular-nums">
                {formatTimer(elapsed)}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STEP04_ANSWERS = [
  "Got it—you want sharp lines live and a clean recap after the call.",
  "Persuaid sits next to your dialer. It only surfaces text when you ask.",
  "Load your scripts once; we turn them into live prompts so reps aren't searching mid-call.",
];

function Step04MiniUI() {
  const [phase, setPhase] = useState<"idle" | "thinking" | "answer">("idle");
  const [answerIndex, setAnswerIndex] = useState(0);

  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("thinking"), 1200);
      return () => clearTimeout(t);
    }
    if (phase === "thinking") {
      const t = setTimeout(() => {
        setPhase("answer");
      }, 2200);
      return () => clearTimeout(t);
    }
    if (phase === "answer") {
      const t = setTimeout(() => {
        setAnswerIndex((i) => (i + 1) % STEP04_ANSWERS.length);
        setPhase("idle");
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="w-full max-w-md rounded-lg border border-stone-600/25 bg-background shadow-[0_8px_28px_-6px_rgba(0,0,0,0.4)] px-3 py-2.5 text-left">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-900/80 text-[9px] font-medium text-[color:var(--landing-accent-soft)] border border-stone-600/35">
            <span className="w-1 h-1 rounded-full bg-[color:var(--landing-sage)]" />
            What to say next
          </span>
        </div>
        <span className="text-[9px] text-text-dim font-mono">Press Enter</span>
      </div>
      <div className="min-h-[42px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[10px] text-text-muted"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-800 text-[8px] text-text-secondary border border-stone-600/40">
                AI
              </span>
              <span>Drafting your next line…</span>
              <span className="flex gap-0.5">
                <span
                  className="w-1 h-1 rounded-full bg-stone-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-stone-500 animate-bounce"
                  style={{ animationDelay: "100ms" }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-stone-500 animate-bounce"
                  style={{ animationDelay: "200ms" }}
                />
              </span>
            </motion.div>
          )}
          {phase === "answer" && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg bg-background-elevated/80 border border-border-subtle px-2 py-1.5 text-[10px] text-text-primary leading-snug"
            >
              &ldquo;{STEP04_ANSWERS[answerIndex]}&rdquo;
            </motion.div>
          )}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-background-elevated/50 border border-border-subtle/60 px-2 py-1.5 text-[9px] text-text-dim leading-snug"
            >
              Press Enter to get the next line…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1 rounded-md bg-stone-950/50 border border-stone-600/30 px-2 py-1 text-[9px] text-text-dim mt-1.5">
        <span className="flex-1 truncate">Enter for the next line—fast.</span>
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[color:var(--landing-moss)] text-[9px] font-medium text-stone-100 border border-stone-500/25 shrink-0">
          Enter
        </span>
      </div>
    </div>
  );
}

const SALES_BENEFITS = [
  {
    title: "No freeze. No stall.",
    body: "The next line appears from your notes and live context—you stay concise.",
  },
  {
    title: "Sound like your best rep",
    body: "Pricing and positioning in your playbook's tone, not generic filler.",
  },
  {
    title: "One screen. Full context.",
    body: "Transcript, notes, and prompts together—no tab hunt mid-deal.",
  },
  {
    title: "They never know",
    body: "Buyers see you—composed and human—while the coaching stays on your screen.",
  },
] as const;

const POST_CALL_BENEFITS = [
  {
    title: "Know what worked—and what didn’t",
    body: "Wins, slips, and how objections actually landed—spelled out.",
  },
  {
    title: "Improve every call",
    body: "Patterns surface; you fix leaks before the next dial.",
  },
  {
    title: "Follow up with a plan",
    body: "Next steps from the real conversation—not a vague recap.",
  },
] as const;

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <main className="landing-home min-h-screen antialiased">
      <Navbar landing liveDemo={{ isOpen: demoOpen, onOpenChange: setDemoOpen }} />

      {/* Hero: video and interactive demo share one slot */}
      <Hero landing demoOpen={demoOpen} onDemoOpenChange={setDemoOpen}>
        <TryWorkspaceDemo variant="heroSlot" open={demoOpen} onOpenChange={setDemoOpen} />
      </Hero>

      {/* How it works — animated mini UI per step (restored from earlier landing) */}
      <Section className="bg-background-elevated py-12 md:py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10 lg:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-3"
            >
              <span className="text-[10px] sm:text-xs font-medium text-text-dim uppercase tracking-[0.16em]">
                How it works
              </span>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-semibold mb-3 leading-[1.18] tracking-tight text-text-primary">
              <span>From playbook to </span>
              <span className="text-[color:var(--landing-accent)]">live line</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-text-muted max-w-xl mx-auto leading-relaxed">
              Load your playbook once. Run the call. Pull the next line when the moment turns—without breaking flow.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-center lg:gap-2 xl:gap-4">
              {[
                {
                  step: "01",
                  title: "Load your playbook",
                  description: "Notes, pricing, objections—whatever you sell with. Persuaid uses all of it.",
                },
                {
                  step: "02",
                  title: "Start the call",
                  description: "Persuaid listens in real time from your side of the conversation.",
                },
                {
                  step: "03",
                  title: "Get what to say next",
                  description: "One shortcut. Lines you can say as yourself. As often as the call demands.",
                  isHighlight: true,
                },
              ].map((item, index) => (
                <div key={item.step} className="contents">
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.1 }}
                    className="flex flex-col min-w-0 w-full max-w-md mx-auto lg:max-w-none lg:flex-1 lg:min-w-[min(100%,14rem)]"
                  >
                    <div className="text-center mb-4 lg:mb-5 flex flex-col items-center">
                      <div className="flex items-center justify-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-[11px] font-mono text-text-dim shrink-0">Step {item.step}</span>
                        {"isHighlight" in item && item.isHighlight && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[color:var(--landing-forest)] text-[9px] font-medium text-[color:var(--landing-accent-soft)] border border-stone-600/35 shrink-0">
                            Most important
                          </span>
                        )}
                      </div>
                      <h3
                        className={cn(
                          "text-lg lg:text-[17px] font-semibold text-text-primary mb-2 leading-snug max-w-[22rem]",
                          "isHighlight" in item && item.isHighlight && "text-[color:var(--landing-accent-soft)]"
                        )}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed max-w-[24rem]">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-auto w-full min-w-0 pt-1">
                      {item.step === "01" && (
                        <div className="w-full rounded-lg border border-stone-600/25 bg-background shadow-[0_8px_28px_-6px_rgba(0,0,0,0.4)] px-3 py-2.5 text-left">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background-elevated text-[9px] font-medium text-text-primary border border-border-subtle">
                                Product knowledge
                              </span>
                            </div>
                            <span className="text-[9px] text-text-dim">Linked to AI</span>
                          </div>
                          <div className="mb-1.5 text-[9px] text-text-dim">
                            What Persuaid reads before each suggestion.
                          </div>
                          <div className="rounded-lg bg-background-elevated/80 border border-border-subtle px-2 py-1.5 text-[10px] text-text-secondary leading-snug max-h-[5.5rem] overflow-hidden space-y-1">
                            <div>
                              <p className="text-[9px] font-semibold text-text-primary">Positioning</p>
                              <ul className="mt-0.5 space-y-0 list-disc list-inside marker:text-stone-500 leading-tight">
                                <li>Real-time next lines; save the call for post-call coaching.</li>
                                <li>Sits beside your dialer or meeting link.</li>
                              </ul>
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-text-primary">Objections</p>
                              <ul className="mt-0.5 space-y-0 list-disc list-inside marker:text-stone-500 leading-tight">
                                <li>You talk. Persuaid suggests wording.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      {item.step === "02" && <Step02MiniUI />}
                      {item.step === "03" && <Step04MiniUI />}
                    </div>
                  </motion.div>

                  {index < 2 && (
                    <>
                      <div
                        className="flex justify-center py-6 lg:hidden"
                        aria-hidden
                      >
                        <div className="flex flex-col items-center gap-1">
                          <StepsArrowDown />
                          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-text-dim/80">
                            Next
                          </span>
                        </div>
                      </div>
                      <div
                        className="hidden lg:flex flex-col items-center justify-center shrink-0 w-[min(5rem,7vw)] self-stretch"
                        aria-hidden
                      >
                        <StepsArrowRight />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Section>

      {/* During the call — editorial photo + compact benefits */}
      <Section
        id="product"
        className="border-t border-white/[0.06] py-16 md:py-20 lg:py-24 overflow-hidden"
      >
        <div className="relative max-w-6xl mx-auto">
          <div
            className="pointer-events-none absolute -left-[28%] top-[8%] h-[min(100vw,28rem)] w-[min(100vw,28rem)] rounded-[58%_42%_48%_52%] bg-[color:var(--landing-forest)]/35 blur-3xl opacity-70"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-[22%] bottom-[-12%] h-[min(90vw,24rem)] w-[min(90vw,24rem)] rounded-[42%_58%_55%_45%] bg-[color:var(--landing-sand)]/20 blur-3xl opacity-60"
            aria-hidden
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="order-2 lg:order-1 lg:col-span-5 flex justify-center lg:justify-start"
            >
              <div className="relative w-full max-w-[min(100%,380px)] lg:max-w-none">
                <div
                  className="pointer-events-none absolute -left-8 top-1/4 h-24 w-32 rounded-[65%_35%_40%_60%] border border-[color:var(--landing-accent)]/25 rotate-[-8deg]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-6 bottom-[18%] h-20 w-20 rounded-full border border-[color:var(--landing-sage)]/35"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute right-[4%] -top-5 h-16 w-28 rounded-[50%_50%_45%_55%] bg-[color:var(--landing-accent)]/15 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-[10%] -z-0 rounded-[2.25rem] border border-stone-500/15 rotate-[4deg] bg-[color:var(--landing-moss)]/5"
                  aria-hidden
                />
                <figure className="relative z-[1] mx-auto aspect-[3/4] max-h-[min(72vh,28rem)] w-full rotate-[-1.25deg]">
                  <div className="h-full w-full overflow-hidden rounded-[2rem] shadow-[0_28px_70px_-24px_rgba(0,0,0,0.65)] ring-1 ring-stone-500/25 [clip-path:polygon(4%_2%,98%_0%,100%_96%,0%_100%)] sm:rounded-[2.25rem] sm:[clip-path:polygon(2%_4%,100%_0%,98%_98%,0%_96%)]">
                    <img
                      src="/landing-call-moment.png?v=1"
                      alt="Sales professional on a live call at a laptop, focused and composed."
                      className="h-full w-full object-cover object-[34%_40%] scale-[1.11] origin-center"
                      width={900}
                      height={1200}
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--bg-near-black)]/40 via-transparent to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[var(--bg-near-black)]/45 to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_60%_at_100%_0%,rgba(18,18,16,0.72)_0%,transparent_52%)] sm:bg-[radial-gradient(ellipse_90%_55%_at_100%_-2%,rgba(18,18,16,0.68)_0%,transparent_50%)]"
                      aria-hidden
                    />
                  </div>
                  <figcaption className="sr-only">
                    Editorial photograph illustrating focus during a revenue call.
                  </figcaption>
                </figure>
              </div>
            </motion.div>

            <div className="order-1 lg:order-2 lg:col-span-7 space-y-8 lg:pl-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-left"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-dim mb-3">
                  During the call
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold text-text-primary mb-5 leading-[1.12] tracking-tight">
                  Win the moments that{" "}
                  <span className="text-[color:var(--landing-accent)]">decide the deal</span>
                </h2>
                <p className="text-base sm:text-[17px] text-text-muted leading-relaxed max-w-xl">
                  Deals flip in seconds—pause, objection, surprise question. Persuaid surfaces the next line from
                  your playbook in real time so you keep the thread.
                </p>
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 text-left">
                {SALES_BENEFITS.map((b, index) => (
                  <motion.article
                    key={b.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.42, delay: index * 0.04, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-xl border border-stone-600/20 bg-[var(--bg-surface)]/40 px-4 py-4 sm:px-5 sm:py-4 shadow-[0_8px_36px_-14px_rgba(0,0,0,0.45)] border-l-[3px] border-l-[color:var(--landing-line)]"
                  >
                    <span
                      className="text-[10px] font-mono font-medium text-[color:var(--landing-sage)] tabular-nums tracking-wide"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-1.5 text-base sm:text-[17px] font-semibold text-text-primary leading-snug tracking-tight">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted leading-relaxed">{b.body}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Post-call — editorial video frame + staggered benefit tiles (mirrors “During the call”) */}
      <Section className="relative border-t border-white/[0.06] py-16 md:py-20 lg:py-24 overflow-hidden bg-background-elevated/90">
        <div className="pointer-events-none absolute -right-[20%] top-[5%] h-[min(100vw,26rem)] w-[min(100vw,26rem)] rounded-[48%_52%_42%_58%] bg-[color:var(--landing-forest)]/30 blur-3xl opacity-75" aria-hidden />
        <div className="pointer-events-none absolute -left-[18%] bottom-[12%] h-[min(85vw,22rem)] w-[min(85vw,22rem)] rounded-[55%_45%_50%_50%] bg-[color:var(--landing-sand)]/18 blur-3xl opacity-55" aria-hidden />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="order-1 lg:col-span-5 space-y-5 lg:pr-2"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-dim">After the call</p>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold text-text-primary leading-[1.12] tracking-tight">
                Coaching after{" "}
                <span className="text-[color:var(--landing-accent)]">every call</span>
              </h2>
              <p className="text-base sm:text-[17px] text-text-muted leading-relaxed max-w-xl">
                <span className="font-medium text-text-secondary">Hang up. Get the debrief.</span> What worked, what
                slipped, what to say next—without building a deck.
              </p>
              <a
                href="/sign-in"
                className="inline-flex items-center gap-3 px-7 py-3 text-[15px] font-medium rounded-lg transition-colors duration-200 border border-white/12 bg-[color:var(--landing-moss)] text-stone-100 hover:bg-[color:var(--landing-moss-hover)] focus:outline-none focus:ring-2 focus:ring-[color:var(--landing-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-near-black)]"
              >
                <img
                  src="/PersuaidLogo.png"
                  alt=""
                  className="w-5 h-5 flex-shrink-0 object-contain opacity-95"
                  aria-hidden
                />
                <span>Try free</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="order-2 lg:col-span-7 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-2xl">
                <div
                  className="pointer-events-none absolute -left-6 top-[20%] h-20 w-28 rounded-[60%_40%_50%_50%] border border-[color:var(--landing-accent)]/20 rotate-[-6deg]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-3 bottom-[8%] h-24 w-24 rounded-[45%_55%_50%_50%] bg-[color:var(--landing-accent)]/12 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-[6%] -z-0 rounded-[1.75rem] border border-stone-500/12 rotate-[3deg] bg-[color:var(--landing-moss)]/6"
                  aria-hidden
                />
                <figure className="relative z-[1] mx-auto w-full rotate-[1deg]">
                  <div className="relative aspect-video w-full overflow-hidden rounded-[1.35rem] shadow-[0_28px_70px_-22px_rgba(0,0,0,0.6)] ring-1 ring-stone-500/25 sm:rounded-[1.65rem] [clip-path:polygon(1%_3%,99%_0%,100%_97%,0%_100%)]">
                    <video
                      src="/VideoAd.mp4"
                      className="absolute inset-0 h-full w-full object-contain object-center bg-[color:var(--bg-near-black)]"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      aria-label="Persuaid post-call coaching and product overview"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--bg-near-black)]/35 via-transparent to-[var(--bg-near-black)]/25"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--bg-near-black)]/55 to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_100%,rgba(18,18,16,0.5)_0%,transparent_55%)]"
                      aria-hidden
                    />
                  </div>
                  <figcaption className="sr-only">Product video: coaching after the call</figcaption>
                </figure>
              </div>
            </motion.div>
          </div>

          <div className="mt-14 lg:mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-left">
            {POST_CALL_BENEFITS.map((b, index) => (
              <motion.article
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.42, delay: index * 0.06, ease: "easeOut" }}
                className={cn(
                  "relative overflow-hidden border border-stone-600/20 bg-[var(--bg-surface)]/40 px-5 py-5 shadow-[0_10px_40px_-14px_rgba(0,0,0,0.5)] border-l-[3px] border-l-[color:var(--landing-line)] rounded-2xl",
                  index === 0 && "lg:-translate-y-1",
                  index === 1 && "lg:translate-y-1.5 rounded-[1.35rem]",
                  index === 2 && "sm:col-span-2 sm:mx-auto sm:max-w-md lg:col-span-1 lg:mx-0 lg:max-w-none"
                )}
              >
                <span
                  className="text-[10px] font-mono font-medium text-[color:var(--landing-sage)] tabular-nums tracking-wide"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1.5 text-base sm:text-[17px] font-semibold text-text-primary leading-snug tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">{b.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </Section>

      {/* Customer quotes — horizontal scroll row */}
      <Section className="bg-[var(--bg-near-black)] border-t border-white/[0.06] pt-16 md:pt-20 lg:pt-24 pb-20 md:pb-24 lg:pb-28 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
        >
          <LandingTestimonialsSection />
        </motion.div>
      </Section>

      <FAQSection />

      <Footer />
    </main>
  );
}
