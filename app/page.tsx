"use client";

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
    <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border border-border-subtle/80 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 flex items-center justify-center min-h-[120px] gap-4 flex-wrap">
      <AnimatePresence mode="wait">
        {!isRecording ? (
          <motion.div
            key="start"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ scale: justClicked ? 0.92 : 1 }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center gap-2 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-[#5eead4] via-[#20D3A6] to-[#0f766e] px-5 py-2.5 text-sm font-bold tracking-tight text-[#04110D] shadow-[0_6px_28px_rgba(32,211,166,0.45),0_0_40px_-8px_rgba(45,212,191,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] ring-2 ring-[#20D3A6]/60 ring-offset-2 ring-offset-background"
          >
            <span
              className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-80"
              aria-hidden
            />
            <span className="relative z-[1]">Start Call</span>
            <span
              className="relative z-[1] inline-flex h-2 w-2 shrink-0 rounded-full bg-[#04110D]/25 shadow-[0_0_10px_rgba(4,17,13,0.4)]"
              aria-hidden
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[#04110D]/20" />
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="pause"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold shadow-lg",
                "bg-red-500/10 border border-red-500/30 text-red-400"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Pause</span>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center gap-2 rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono text-text-primary tabular-nums">
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
    <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border-2 border-green-primary/40 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 text-left">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-primary/10 text-[10px] font-medium text-green-accent border border-green-primary/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
            What to say next
          </span>
        </div>
        <span className="text-[10px] text-green-accent font-mono">Press Enter</span>
      </div>
      <div className="min-h-[52px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-[11px] text-text-muted"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-primary/10 text-[9px] text-green-accent border border-green-primary/40">
                AI
              </span>
              <span>Drafting your next line…</span>
              <span className="flex gap-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce"
                  style={{ animationDelay: "100ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce"
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
              className="rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-2 text-[11px] text-text-primary leading-snug"
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
              className="rounded-xl bg-background-elevated/50 border border-border-subtle/60 px-3 py-2 text-[10px] text-text-dim leading-snug"
            >
              Press Enter to get the next line…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-background-elevated border border-green-primary/30 px-3 py-1.5 text-[10px] text-text-dim mt-2">
        <span className="flex-1 truncate">Press Enter for the next line—fast.</span>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-primary text-[10px] font-medium text-black">
          Enter
        </span>
      </div>
    </div>
  );
}

const SALES_BENEFITS = [
  {
    title: "No freeze. No stall.",
    paragraphs: [
      "The objection lands. Your mind blanks. You still get the next sentence—instantly.",
      "Real-time lines from your notes and the last few seconds of the call. You talk. No ramble.",
    ],
  },
  {
    title: "Sound like your best rep",
    paragraphs: [
      "Answers pull from your pricing, positioning, and playbook—not a generic model.",
      "Same tone your top closer would use. You deliver it live.",
    ],
  },
  {
    title: "One screen. Full context.",
    paragraphs: [
      "Transcript, notes, and what to say next together.",
      "No tab hunt while the deal is moving.",
    ],
  },
  {
    title: "They never know",
    paragraphs: [
      "Nothing joins the call. The buyer sees you—not a bot.",
      "You look sharp and in control. The coaching stays on your screen.",
    ],
  },
] as const;

const POST_CALL_BENEFITS = [
  {
    title: "Know what worked—and what didn’t",
    body: "See where you won, where you slipped, and how objections actually landed.",
  },
  {
    title: "Improve every call",
    body: "Patterns surface automatically. You fix the leaks before the next dial.",
  },
  {
    title: "Follow up with a plan",
    body: "Concrete next steps from the real conversation—not a vague recap.",
  },
] as const;

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar liveDemo={{ isOpen: demoOpen, onOpenChange: setDemoOpen }} />

      {/* Hero: video and interactive demo share one slot */}
      <Hero demoOpen={demoOpen} onDemoOpenChange={setDemoOpen}>
        <TryWorkspaceDemo variant="heroSlot" open={demoOpen} onOpenChange={setDemoOpen} />
      </Hero>

      {/* How it works — animated mini UI per step (restored from earlier landing) */}
      <Section className="bg-background-elevated">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-16 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Three steps
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-text-primary">How</span>{" "}
              <span className="bg-gradient-to-r from-green-primary via-green-accent to-emerald-400 bg-clip-text text-transparent">
                Persuaid
              </span>{" "}
              <span className="text-text-primary">works on a call</span>
            </h2>
            <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-light">
              Load your playbook. Run the call. Pull the next line the second you need it.
            </p>
          </div>

          <div className="space-y-14 lg:space-y-16">
            {[
              {
                step: "01",
                title: "Load your playbook",
                description: "Notes, pricing, objections—whatever you sell with. Persuaid uses all of it.",
              },
              {
                step: "02",
                title: "Start the call",
                description: "Persuaid listens in real time. Nothing joins the line for your prospect.",
              },
              {
                step: "03",
                title: "Get what to say next",
                description: "One shortcut. Lines you can say as yourself. As often as the call demands.",
                isHighlight: true,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="relative flex flex-col md:flex-row items-stretch gap-8 md:gap-12"
              >
                <div className="md:w-5/12 lg:w-2/5 flex flex-col justify-center text-center md:text-left">
                  <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3 flex-wrap">
                    <span className="text-sm font-mono text-green-primary/80">Step {item.step}</span>
                    {"isHighlight" in item && item.isHighlight && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-primary/15 text-[10px] font-semibold text-green-accent border border-green-primary/40">
                        Most important
                      </span>
                    )}
                    <span className="h-px w-8 bg-gradient-to-r from-green-primary/70 to-transparent hidden md:inline-block" />
                  </div>
                  <h3
                    className={cn(
                      "text-2xl md:text-3xl font-semibold text-text-primary mb-3 leading-snug",
                      "isHighlight" in item && item.isHighlight && "text-green-accent/90"
                    )}
                  >
                    {item.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-4">{item.description}</p>
                </div>

                {item.step === "01" && (
                  <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border border-border-subtle/80 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] font-medium text-text-primary border border-border-subtle">
                          Product knowledge
                        </span>
                      </div>
                      <span className="text-[10px] text-green-accent">Linked to AI</span>
                    </div>
                    <div className="mb-2 text-[10px] text-text-dim">What Persuaid reads before each suggestion.</div>
                    <div className="rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-2 text-[11px] text-text-secondary leading-snug max-h-28 overflow-hidden space-y-1.5">
                      <div>
                        <p className="text-[10px] font-semibold text-text-primary">Positioning</p>
                        <ul className="mt-0.5 space-y-0.5 list-disc list-inside marker:text-emerald-300">
                          <li>Real-time next lines; save the call for post-call coaching.</li>
                          <li>Sits beside your dialer or meeting link.</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-primary">Objections</p>
                        <ul className="mt-0.5 space-y-0.5 list-disc list-inside marker:text-emerald-300">
                          <li>You talk. Persuaid suggests wording.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {item.step === "02" && <Step02MiniUI />}
                {item.step === "03" && <Step04MiniUI />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* During the call — benefits (aligned with post-call section width) */}
      <Section id="product" className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-12 lg:mb-16 mx-auto max-w-4xl text-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-green-accent/90 mb-4">
              During the call
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              Win the moments that{" "}
              <span className="bg-gradient-to-r from-green-primary via-green-accent to-emerald-400 bg-clip-text text-transparent">
                decide the deal
              </span>
            </h2>
            <div className="mx-auto max-w-3xl space-y-3 text-base sm:text-lg text-text-muted leading-relaxed">
              <p className="font-semibold text-text-primary/95">
                Deals turn in seconds—the pause, the objection, the question you didn&apos;t prep for.
              </p>
              <p>
                Persuaid gives you the exact words in real time. No freeze. No guessing. You keep control of the
                thread.
              </p>
              <p className="font-medium text-text-primary">
                No bot on the line. No &ldquo;let me circle back.&rdquo; Just answers when you need them.
              </p>
            </div>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:gap-7 text-left">
            {SALES_BENEFITS.map((b, index) => (
              <motion.article
                key={b.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.05, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-background-elevated/40 pl-5 pr-5 py-6 sm:pl-6 sm:pr-6 sm:py-7 text-left shadow-[0_16px_48px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.04] sm:ring-white/[0.06] before:pointer-events-none before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-green-primary before:via-green-accent/90 before:to-emerald-500/80 before:content-['']"
              >
                <span
                  className="text-[11px] font-mono font-semibold text-green-primary/85 tabular-nums"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg sm:text-xl font-semibold text-text-primary leading-snug tracking-tight">
                  {b.title}
                </h3>
                <div className="mt-3 space-y-3">
                  {b.paragraphs.map((para, pi) => (
                    <p
                      key={pi}
                      className="text-sm sm:text-[15px] lg:text-base text-text-muted leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </Section>

      {/* Post-call AI coaching + video — explains analysis after the hang-up */}
      <Section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto flex flex-col gap-12 lg:gap-14"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">
            <div className="flex-1 space-y-5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-green-accent/90">
                After the call
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
                Coaching after every call
              </h2>
              <div className="space-y-3 text-base sm:text-lg text-text-muted leading-relaxed">
                <p className="font-medium text-text-primary/95">Hang up. Get the debrief.</p>
                <p>
                  What worked. What didn&apos;t. What to say on the follow-up. You improve on the next call without
                  building a deck.
                </p>
              </div>
              <a
                href="/sign-in"
                className="group inline-flex items-center gap-3 px-8 py-3.5 text-base font-semibold rounded-2xl transition-all duration-300 border-2 border-green-primary/70 bg-black text-white hover:bg-green-primary hover:border-green-primary hover:shadow-2xl hover:shadow-green-primary/20 shadow-lg transform hover:scale-[1.05] active:scale-100 focus:outline-none focus:ring-2 focus:ring-green-primary focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                <img
                  src="/PersuaidLogo.png"
                  alt=""
                  className="w-5 h-5 flex-shrink-0 object-contain group-hover:scale-110 transition-transform duration-300"
                  aria-hidden
                />
                <span>Try Free</span>
              </a>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-center mt-6 lg:mt-0">
              <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-xl shadow-black/40">
                <video
                  src="/VideoAd.mp4"
                  className="absolute inset-0 h-full w-full object-contain object-center bg-[#0d0d0d]"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label="Persuaid post-call coaching and product overview"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:gap-7 text-left">
            {POST_CALL_BENEFITS.map((b, index) => (
              <motion.article
                key={b.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.05, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-background-elevated/40 pl-5 pr-5 py-6 sm:pl-6 sm:pr-6 sm:py-7 text-left shadow-[0_16px_48px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.04] sm:ring-white/[0.06] before:pointer-events-none before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-green-primary before:via-green-accent/90 before:to-emerald-500/80 before:content-['']"
              >
                <span
                  className="text-[11px] font-mono font-semibold text-green-primary/85 tabular-nums"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg sm:text-xl font-semibold text-text-primary leading-snug tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-3 text-sm sm:text-[15px] lg:text-base text-text-muted leading-relaxed">{b.body}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Customer quotes — horizontal scroll row */}
      <Section className="bg-black border-t border-white/[0.06] pt-12 md:pt-16 lg:pt-20 pb-16 md:pb-20 lg:pb-24 overflow-x-hidden">
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
