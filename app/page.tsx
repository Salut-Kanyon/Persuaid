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
          <div className="text-left mb-16 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                What we offer
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
              Make your sales meetings{" "}
              <span className="bg-gradient-to-r from-green-primary via-green-accent to-emerald-400 bg-clip-text text-transparent">
                better
              </span>
            </h2>
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

          <div className="space-y-14 lg:space-y-16">
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
                  "relative flex flex-col md:flex-row items-stretch gap-8 md:gap-12",
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

      {/* After the call — compact, rectangle card */}
      <Section className="bg-background pb-10 md:pb-14 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 text-center lg:text-left">
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">After the call</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mt-3 mb-3 leading-tight tracking-tight">
                Turn the call into clear next steps
              </h2>
              <p className="text-base text-text-muted leading-relaxed mb-6">
                Key moments, one AI insight, and next steps—so nothing gets lost.
              </p>
              <ul className="space-y-2.5 text-base text-text-secondary">
                <li className="flex items-start gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-primary flex-shrink-0" /><span><strong className="text-text-primary font-medium">AI summary</strong> — Call highlights, organized.</span></li>
                <li className="flex items-start gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-primary flex-shrink-0" /><span><strong className="text-text-primary font-medium">CRM ready</strong> — Save or send where your team works.</span></li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-white/10 bg-[#0a0c0d] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">Call summary</span>
                  <span className="text-xs text-text-dim font-mono">00:18:42</span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">Key moments</h4>
                      <ul className="text-[13px] text-text-secondary leading-snug space-y-1">
                        <li>· Pricing and payment options came up</li>
                        <li>· Prospect worried about extra work for reps</li>
                        <li>· Interest grew when real-time help was explained</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">Next steps</h4>
                      <p className="text-[13px] text-text-secondary leading-snug">Send pricing one-pager and book a 30-minute demo.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <h4 className="text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">AI insight</h4>
                    <p className="text-[13px] text-text-secondary leading-snug mb-3">Prospect&apos;s main concern was adoption. &quot;Help during the call, not more work after&quot; landed well.</p>
                    <h4 className="text-xs font-semibold text-text-primary mb-1 uppercase tracking-wider">Suggested follow-up</h4>
                    <p className="text-[13px] text-text-primary leading-snug italic">&quot;What usually makes a new tool hard for your reps to adopt?&quot;</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-text-primary hover:bg-white/10 transition-colors">Save</button>
                    <button type="button" className="px-3 py-1.5 rounded-lg bg-green-primary/20 text-xs font-semibold text-green-accent border border-green-primary/40 hover:bg-green-primary/30 transition-colors">Hand off to CRM</button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Section>

      <FAQSection />

      {/* Final CTA Section */}
      <Section className="py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16"
        >
          {/* Left: copy + button */}
          <div className="flex-1 space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary leading-tight tracking-tight">
              Sales AI that helps during the call, not after.
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              Try <span className="text-text-primary font-semibold">Persuaid</span> on your next call today.
            </p>
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
              <span>Try for Free</span>
            </a>
          </div>
          {/* Right: video with small AI transcript overlay */}
          <div className="flex-1 min-w-0 flex items-center justify-center mt-6 lg:mt-8">
            <div className="relative w-full max-w-2xl aspect-video min-h-[280px] sm:min-h-[320px] rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/50 ring-1 ring-white/5">
              <video
                src="/VideoAd.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden
              />
              {/* Soft vignette */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(10,10,10,0.4) 85%, rgba(10,10,10,0.85) 100%)",
                  boxShadow: "inset 0 0 60px 20px rgba(10,10,10,0.3)",
                }}
                aria-hidden
              />
              {/* Small AI transcript overlay (like Hero) */}
              <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
                <div className="w-full max-w-[240px] sm:max-w-[280px] rounded-xl border border-white/10 bg-black/50 shadow-xl overflow-hidden flex flex-col backdrop-blur-sm">
                  <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
                      <span className="text-xs font-semibold text-text-primary">Live AI transcript</span>
                    </div>
                    <span className="text-[10px] text-text-dim font-mono tabular-nums">00:18</span>
                  </div>
                  <div className="p-2.5 space-y-1.5 bg-black/35">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-semibold text-emerald-300/95 shrink-0">Rep</span>
                      <p className="text-[11px] text-text-primary leading-snug">Thanks for your time—focused on how we can help.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-semibold text-sky-200/95 shrink-0">Prospect</span>
                      <p className="text-[11px] text-text-primary leading-snug">We've tried tools that added more work for reps.</p>
                    </div>
                    <div className="flex gap-2 rounded-lg bg-black/45 border border-green-primary/20 pl-2 py-1.5 pr-2">
                      <span className="text-[10px] font-semibold text-green-primary shrink-0">AI</span>
                      <p className="text-[11px] text-text-primary leading-snug">Suggested: &quot;That&apos;s what we fix. Real-time help, no extra steps.&quot;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}
