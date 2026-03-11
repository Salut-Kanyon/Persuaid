"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { ProductPreview } from "@/components/ui/ProductPreview";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function Step02MiniUI() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [justClicked, setJustClicked] = useState(false);

  // Show Start Call first; after 2.2s simulate click and switch to Pause + timer. Re-runs when we reset (isRecording false).
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
            className="flex items-center gap-2 rounded-2xl bg-black border border-green-primary/60 px-5 py-2 text-sm font-semibold text-white shadow-lg"
          >
            <img src="/PersuaidLogo.png" alt="" className="w-4 h-4 flex-shrink-0 object-contain" aria-hidden />
            <span>Start Call</span>
          </motion.div>
        ) : (
          <motion.div
            key="pause"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <div className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold shadow-lg",
              "bg-red-500/10 border border-red-500/30 text-red-400"
            )}>
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

const STEP03_LINES = [
  { who: "Rep", time: "10:23", text: "Thanks for your time—I'll keep this focused on how your team sells." },
  { who: "Prospect", time: "10:24", text: "We've tried a few tools; they ended up being more work for reps." },
  { who: "Rep", time: "10:24", text: "That's exactly what we're built to fix. Real-time help, no extra steps." },
  { who: "Prospect", time: "10:25", text: "How does it work during an actual call?" },
  { who: "Rep", time: "10:25", text: "You talk, Persuaid listens and suggests the next line. Press Enter when you need it." },
];

function Step03MiniUI() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= STEP03_LINES.length) {
      const t = setTimeout(() => setVisibleCount(0), 2500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 1100);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border border-border-subtle/80 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 text-left">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] font-medium text-text-primary border border-border-subtle">
          Live transcript
        </span>
        <span className="text-[10px] text-text-dim font-mono">00:18:42</span>
      </div>
      <div className="mb-2 text-[10px] text-text-dim">
        Whole conversation captured and streamed live.
      </div>
      <div className="space-y-1.5 rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-2 text-[11px] leading-snug max-h-32 overflow-hidden">
        {STEP03_LINES.slice(0, visibleCount).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className={line.who === "Rep" ? "text-emerald-300 font-semibold" : "text-sky-200 font-semibold"}>
              {line.who}
            </span>
            <span className="mx-1 text-text-dim">· {line.time}</span>
            <span className="text-text-secondary"> {line.text}</span>
          </motion.p>
        ))}
      </div>
    </div>
  );
}

const STEP04_ANSWERS = [
  "That makes sense. Reps in your position usually want help in the moment, not another recap after the call.",
  "Here's how Persuaid fits in: it sits next to your dialer and only steps in when it can make your next sentence sharper.",
  "If your team has scripts, we can turn those into live prompts so reps don't search for them mid-call.",
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
                <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "100ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "200ms" }} />
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
        <span className="flex-1 truncate">Press Enter anytime—get the next line in milliseconds.</span>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-primary text-[10px] font-medium text-black">Enter</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Product Overview Section */}
      <Section id="product">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                Product Overview
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary mb-5 leading-tight tracking-tight">
              One workspace for{" "}
              <span className="text-green-primary">live sales calls</span>
            </h2>
            <p className="text-lg sm:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              This is an example of how the software works during a real call—what to say next, what&apos;s been said, and the product
              knowledge Persuaid uses, all in one place.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="pointer-events-none absolute -inset-10 bg-green-primary/15 blur-3xl rounded-[32px] opacity-40" />
            <div className="pointer-events-none absolute -inset-4 bg-green-primary/10 blur-2xl rounded-[32px] opacity-40" />
            <ProductPreview className="relative" />
          </motion.div>
        </motion.div>
      </Section>

      {/* How It Works Section */}
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
                Simple Process
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              How Persuaid works on a call
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              Add your knowledge, start the call, and get live answers whenever you need them.
            </p>
          </div>

          <div className="space-y-10 lg:space-y-14">
            {[
              {
                step: "01",
                title: "Add your product knowledge",
                description: "Notes, playbooks, and objection handlers. Persuaid uses them to tailor every suggestion.",
              },
              {
                step: "02",
                title: "Start a call",
                description: "Click Start Call. Persuaid connects and listens so it can coach you in real time.",
              },
              {
                step: "03",
                title: "Live transcript records the conversation",
                description: "The full conversation is captured live so Persuaid can spot context and objections.",
              },
              {
                step: "04",
                title: "Press Enter for answers—as often as you want",
                description: "Press Enter anytime. Persuaid uses the last moments and your notes, then gives you the answer in milliseconds.",
                isHighlight: true,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className={cn(
                  "relative flex flex-col md:flex-row items-stretch gap-6 md:gap-10",
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                )}
              >
                {/* Text column */}
                <div className="md:w-5/12 lg:w-2/5 flex flex-col justify-center text-center md:text-left">
                  <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3 flex-wrap">
                    <span className="text-sm font-mono text-green-primary/80">
                      Step {item.step}
                    </span>
                    {"isHighlight" in item && item.isHighlight && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-primary/15 text-[10px] font-semibold text-green-accent border border-green-primary/40">
                        Most important
                      </span>
                    )}
                    <span className="h-px w-8 bg-gradient-to-r from-green-primary/70 to-transparent hidden md:inline-block" />
                  </div>
                  <h3 className={cn(
                    "text-2xl md:text-3xl font-semibold text-text-primary mb-3 leading-snug",
                    "isHighlight" in item && item.isHighlight && "text-green-accent/90"
                  )}>
                    {item.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Mini UI column */}
                {/* Step 01: Product knowledge */}
                {item.step === "01" && (
                  <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border border-border-subtle/80 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] font-medium text-text-primary border border-border-subtle">
                          Product knowledge
                        </span>
                      </div>
                      <span className="text-[10px] text-green-accent">
                        Linked to AI
                      </span>
                    </div>

                    <div className="mb-2 text-[10px] text-text-dim">
                      Notes Persuaid pulls from when it suggests what to say.
                    </div>

                    <div className="rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-2 text-[11px] text-text-secondary leading-snug max-h-28 overflow-hidden space-y-1.5">
                      <div>
                        <p className="text-[10px] font-semibold text-text-primary">
                          Positioning · Core value
                        </p>
                        <ul className="mt-0.5 space-y-0.5 list-disc list-inside marker:text-emerald-300">
                          <li>Live coaching during the call, not a recap.</li>
                          <li>Fits next to any dialer or meeting tool.</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-primary">
                          Objection handling
                        </p>
                        <ul className="mt-0.5 space-y-0.5 list-disc list-inside marker:text-emerald-300">
                          <li>Reps stay in control—Persuaid suggests language.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 02: Start a call (button) — animated click → Pause + timer */}
                {item.step === "02" && <Step02MiniUI />}

                {/* Step 03: Live transcript — lines stream in like a real call */}
                {item.step === "03" && <Step03MiniUI />}

                {/* Step 04: Press Enter — AI thinking then answer, loops */}
                {item.step === "04" && <Step04MiniUI />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* After the call — simplified */}
      <Section className="bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            {/* Left: short copy */}
            <div className="lg:col-span-5 text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-xs font-semibold text-green-accent uppercase tracking-wider"
              >
                After the call
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="text-3xl sm:text-4xl font-bold text-text-primary mt-3 mb-4 leading-tight tracking-tight"
              >
                Turn the call into clear next steps
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-base text-text-muted leading-relaxed mb-8"
              >
                Persuaid organizes the conversation into key moments, one useful AI insight, and the follow-up so nothing gets lost.
              </motion.p>
              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                className="space-y-3 text-[15px] text-text-secondary"
              >
                {[
                  { label: "AI summary", desc: "The important parts of the call, already organized." },
                  { label: "CRM ready", desc: "Save it or send the next steps where your team works." },
                ].map((item, i) => (
                  <motion.li
                    key={item.label}
                    className="flex items-start gap-2.5"
                    variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-primary flex-shrink-0" />
                    <span><strong className="text-text-primary font-medium">{item.label}</strong> — {item.desc}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* Right: single card */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="rounded-2xl border border-white/10 bg-[#0a0c0d] shadow-[0_24px_64px_rgba(0,0,0,0.45)] overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <span className="text-base font-semibold text-text-primary">Call summary</span>
                  <span className="text-sm text-text-dim font-mono">00:18:42</span>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Key moments</h4>
                    <ul className="text-[15px] text-text-secondary leading-relaxed space-y-2">
                      <li>· Pricing and payment options came up</li>
                      <li>· Prospect worried about adding extra work for reps</li>
                      <li>· Interest increased when real-time help was explained</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">AI insight</h4>
                    <p className="text-[15px] text-text-secondary leading-relaxed">
                      Prospect&apos;s main concern was adoption. Messaging around &quot;help during the call, not more work after&quot; landed well.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Suggested follow-up</h4>
                    <p className="text-[15px] text-text-primary leading-relaxed italic">
                      &quot;What usually makes a new tool hard for your reps to adopt?&quot;
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Next steps</h4>
                    <p className="text-[15px] text-text-secondary leading-relaxed">
                      Send pricing one-pager and book a 30-minute demo.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button type="button" className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-text-primary hover:bg-white/10 transition-colors">
                      Save
                    </button>
                    <button type="button" className="px-4 py-2 rounded-xl bg-green-primary/20 text-sm font-semibold text-green-accent border border-green-primary/40 hover:bg-green-primary/30 transition-colors">
                      Hand off to CRM
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Section>

      <FAQSection />

      {/* Final CTA Section */}
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary mb-8 leading-tight tracking-tight">
            Start your free trial
          </h2>
          <p className="text-xl sm:text-2xl text-text-muted mb-12 leading-relaxed font-light max-w-2xl mx-auto">
            No credit card required. Sign in or create an account to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton variant="primary" href="/sign-in" className="text-lg px-8 py-4">
              Try for Free
            </CTAButton>
            <CTAButton variant="secondary" href="/pricing" className="text-lg px-8 py-4">
              Compare plans
            </CTAButton>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}
