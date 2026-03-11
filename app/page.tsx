"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { ProductPreview } from "@/components/ui/ProductPreview";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";

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
              Persuaid listens to your call, drafts what to say next, keeps a clean transcript, and pulls in your product
              knowledge—so you sound composed, confident, and ready for every objection.
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
              Three pieces working together: what to say next, what&apos;s been said, and what your team already knows.
            </p>
          </div>

          <div className="space-y-10 lg:space-y-14">
            {[
              {
                step: "01",
                title: "What to say next",
                description:
                  "Persuaid listens to the call and turns what it hears into live coaching. Press Enter or ask a question to get the exact next line to say—written in your voice and grounded in this conversation.",
              },
              {
                step: "02",
                title: "Live transcript",
                description:
                  "Every word from the call is captured, cleaned up, and streamed into a live transcript. This is the source of truth Persuaid uses to reason about the call, surface insights, and suggest stronger responses.",
              },
              {
                step: "03",
                title: "Your product knowledge, connected",
                description:
                  "Paste your product notes, objections, and playbooks once. Persuaid uses them as a private knowledge layer so every suggestion, follow-up question, and answer is tailored to how your team actually sells.",
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
                  <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3">
                    <span className="text-sm font-mono text-green-primary/80">
                      Step {item.step}
                    </span>
                    <span className="h-px w-8 bg-gradient-to-r from-green-primary/70 to-transparent hidden md:inline-block" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-text-primary mb-3 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Mini UI column */}
                {/* Zoomed-in mini UI for step 1: What to say next */}
                {item.step === "01" && (
                  <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border border-border-subtle/80 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-primary/10 text-[10px] font-medium text-green-accent border border-green-primary/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
                          What to say next
                        </span>
                      </div>
                      <span className="text-[10px] text-text-dim font-mono">
                        AI coach
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] text-text-muted border border-border-subtle">
                          Next line
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] text-text-muted border border-border-subtle">
                          Follow-up
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] text-text-muted border border-border-subtle">
                          Objection
                        </span>
                      </div>

                      <div className="mt-1 rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-2 text-[11px] text-text-primary leading-snug">
                        “That makes sense. Reps in your position usually want help in the moment, not another recap after the call.”
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-background-elevated border border-border-subtle px-3 py-1.5 text-[10px] text-text-dim">
                      <span className="flex-1 truncate">
                        Type a question or press Enter to get a new line…
                      </span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-primary text-[10px] font-medium text-black">
                        Ask AI
                      </span>
                    </div>
                  </div>
                )}

                {/* Zoomed-in mini UI for step 2: Live transcript */}
                {item.step === "02" && (
                  <div className="mx-auto md:mx-0 md:w-7/12 lg:w-3/5 rounded-2xl border border-border-subtle/80 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.65)] px-4 py-3.5 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-elevated text-[10px] font-medium text-text-primary border border-border-subtle">
                          Live transcript
                        </span>
                      </div>
                      <span className="text-[10px] text-text-dim font-mono">
                        00:18:42
                      </span>
                    </div>

                    <div className="mb-2 text-[10px] text-text-dim">
                      Clean, live text feed Persuaid uses to understand the call.
                    </div>

                    <div className="space-y-1.5 rounded-xl bg-background-elevated/80 border border-border-subtle px-3 py-2 text-[11px] leading-snug max-h-28 overflow-hidden">
                      <p>
                        <span className="text-emerald-300 font-semibold">Rep</span>
                        <span className="mx-1 text-text-dim">· 10:23</span>
                        <span className="text-text-secondary">
                          Thanks for making the time today—my goal is to keep this focused on how your team actually sells.
                        </span>
                      </p>
                      <p>
                        <span className="text-sky-200 font-semibold">Prospect</span>
                        <span className="mx-1 text-text-dim">· 10:24</span>
                        <span className="text-text-secondary">
                          We&apos;ve tried a few tools, but they always ended up being more work for the reps.
                        </span>
                      </p>
                      <p>
                        <span className="text-emerald-300 font-semibold">Rep</span>
                        <span className="mx-1 text-text-dim">· 10:25</span>
                        <span className="text-text-secondary">
                          Totally fair—that&apos;s exactly the problem Persuaid is designed to fix.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Zoomed-in mini UI for step 3: Product knowledge / notes */}
                {item.step === "03" && (
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
              </motion.div>
            ))}
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
