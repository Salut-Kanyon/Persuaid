"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AiKind = "answer" | "followup" | "clarification";

interface AiResponse {
  kind: AiKind;
  text: string;
}

const AI_RESPONSES: AiResponse[] = [
  {
    kind: "answer",
    text: "“Great question. The net premium is the pure cost of insurance, while the gross premium also includes the insurer’s expenses and admin fees.”",
  },
  {
    kind: "followup",
    text: "“Would it be helpful if I broke down which part of your premium pays for coverage versus company expenses?”",
  },
  {
    kind: "answer",
    text: "“Paying monthly doesn’t change your coverage—it just spreads the gross annual premium into smaller payments over the year.”",
  },
  {
    kind: "followup",
    text: "“I can show you a simple side‑by‑side of annual versus monthly so you can see the tradeoff between cash flow and simplicity.”",
  },
  {
    kind: "answer",
    text: "“Your age and health affect pricing because they feed into the mortality and morbidity rates the insurer uses to price risk.”",
  },
  {
    kind: "followup",
    text: "“Is it okay if I briefly explain how those rates translate into the numbers you’re seeing on your quote?”",
  },
  {
    kind: "clarification",
    text: "“Net level annual premium is the amount needed each year to fund future benefits; gross premium is that amount plus the insurer’s operating costs.”",
  },
  {
    kind: "answer",
    text: "“If a payment is missed, most policies include a short grace period before coverage lapses—I can walk you through what that looks like in your case.”",
  },
  {
    kind: "followup",
    text: "“When you think about this policy, are you more focused on total long‑term cost, flexibility in payments, or leaving a specific benefit amount?”",
  },
  {
    kind: "answer",
    text: "“People often choose annual payments when they want the clearest view of total cost; monthly is usually about smoothing cash flow.”",
  },
];

interface ProductPreviewProps {
  className?: string;
}

export function ProductPreview({ className }: ProductPreviewProps) {
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    const rotate = () => {
      const indices = AI_RESPONSES.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setVisibleIndexes(indices.slice(0, 3));
    };

    const id = setInterval(rotate, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className={cn(
        "relative rounded-card overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.85)]",
        // Solid charcoal base with subtle glass edge
        "bg-[#050708]",
        "border border-white/6 backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:border before:border-white/10 before:opacity-70",
        className
      )}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Window Chrome */}
      <div className="relative z-10 bg-background-elevated/90 px-5 py-3.5 flex items-center gap-3 border-b border-white/10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60 hover:bg-red-500/80 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500/80 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/60 hover:bg-green-500/80 transition-colors"></div>
        </div>
        <div className="flex-1 text-center">
          <span className="inline-flex items-center gap-2 text-text-dim text-[11px] font-mono">
            <span className="relative flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
              <span className="absolute inset-0 rounded-full border border-green-primary/40 blur-[1px] opacity-60" />
            </span>
            https://persuaid.app
          </span>
        </div>
        <div className="w-20 flex justify-end">
          <img
            src="/PersuaidLogo.png"
            alt="Persuaid"
            className="w-5 h-5 opacity-80"
          />
        </div>
      </div>

      {/* Main UI Grid */}
      <div className="relative z-0 p-4 lg:p-5 grid grid-cols-12 gap-3 lg:gap-4 min-h-[560px] lg:min-h-[680px]">
        {/* Left column: What to say next + Live transcript */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 lg:gap-3.5">
          {/* What to say next */}
          <motion.div
            className="relative flex-[1.15] min-h-[190px] bg-background/80 rounded-2xl border border-white/10 p-3.5 sm:p-4 flex flex-col overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.7)]"
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.9 }}
          >
            <div className="relative z-10 flex items-center justify-between mb-3">
              <div>
                <div className="inline-flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-text-primary tracking-tight">
                    What to say next
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-primary/10 text-[10px] text-green-accent border border-green-primary/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
                    AI coaching
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-[10px] text-text-dim font-mono">Call · 00:18:42</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 border border-white/10 text-[10px] text-text-muted">
                  <span className="w-1 h-1 rounded-full bg-emerald-300" />
                  Objection detected
                </span>
              </div>
            </div>

            {/* Main suggestion card */}
            <motion.div
              className="relative z-10 mt-3 flex-1 rounded-xl border border-white/10 bg-background-elevated/90 px-4 py-4 flex flex-col gap-3 overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.9 }}
            >
              {/* AI thinking indicator */}
              <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-text-muted mb-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-primary/10 text-[12px] font-medium text-green-accent border border-green-primary/40">
                  AI
                </span>
                <span>Drafting your next line…</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1 h-1 rounded-full bg-green-primary animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "0.12s" }} />
                  <span className="w-1 h-1 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "0.24s" }} />
                </span>
              </div>

              {/* Example AI responses stream */}
              <div className="space-y-1.5 text-left text-[14px] sm:text-[15px] text-text-primary/95">
                {visibleIndexes.map((idx, i) => {
                  const line = AI_RESPONSES[idx];
                  const kindLabel =
                    line.kind === "answer"
                      ? "Suggested answer"
                      : line.kind === "followup"
                      ? "Recommended follow-up"
                      : "Clarifying point";
                  return (
                    <motion.div
                      key={`${line.text}-${i}`}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: i * 0.15 }}
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-primary/12 text-[10px] font-medium text-green-accent border border-green-primary/40">
                        AI
                      </span>
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1 rounded-full bg-background/80 text-[9px] text-text-muted border border-border-subtle">
                          {kindLabel}
                          <span className="h-1 w-1 rounded-full bg-emerald-300 animate-pulse" />
                        </span>
                        <p className="leading-relaxed">
                          {line.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Hover overlay headline */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                <p className="px-4 text-center text-[16px] sm:text-xl md:text-2xl font-semibold text-white leading-snug max-w-xl">
                  Live AI coaching that tells you exactly what to say next on this call.
                </p>
              </div>
            </motion.div>

            {/* Input row */}
            <div className="relative z-10 mt-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="flex-1 rounded-full bg-background-elevated/80 border border-white/10 px-3.5 py-1.5 text-[11px] text-text-dim flex items-center shadow-inner">
                <span className="truncate">
                  Press Enter to get an answer, or type your own question for Persuaid…
                </span>
              </div>
              <div className="flex gap-2 sm:ml-1">
                <button
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-green-primary to-emerald-400 text-[11px] font-semibold text-black shadow-[0_0_0_1px_rgba(22,163,74,0.6),0_16px_40px_rgba(22,163,74,0.45)] hover:shadow-[0_0_0_1px_rgba(22,163,74,0.7),0_18px_48px_rgba(22,163,74,0.6)] transition-all"
                >
                  Ask follow-up
                </button>
              </div>
            </div>
          </motion.div>

          {/* Live transcript */}
          <motion.div
            className="relative flex-[0.9] min-h-[170px] bg-background/70 rounded-2xl border border-white/8 p-3.5 sm:p-4 flex flex-col overflow-hidden"
            whileHover={{ y: -2, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.9 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="w-2 h-2 bg-green-primary rounded-full inline-block animate-pulse" />
                  <span className="absolute inset-0 rounded-full border border-green-primary/40 blur-[1px] opacity-60" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-text-primary tracking-tight">
                  Live transcript
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-text-dim font-mono">00:18:42</span>
                <button className="text-[10px] text-text-muted hover:text-text-primary transition-colors underline-offset-2 hover:underline">
                  Clear transcript
                </button>
              </div>
            </div>

            <div className="text-[10px] text-text-dim mb-2">
              What the prospect says on the call. Persuaid listens here, then pulls in the right answer from your notes.
            </div>

            {/* Transcript content */}
            <div className="flex-1 rounded-xl bg-background-elevated/70 border border-white/6 px-3.5 py-2.5 text-[11px] leading-relaxed overflow-hidden space-y-1.5">
              <p>
                <span className="text-emerald-300 font-semibold">Rep</span>
                <span className="mx-1 text-text-dim">· 10:23:04</span>
                <span className="text-text-secondary">
                  Thanks for walking through this with me. I&apos;ll explain pricing in plain language and you can stop me anywhere.
                </span>
              </p>
              <p>
                <span className="text-sky-200 font-semibold">Prospect</span>
                <span className="mx-1 text-text-dim">· 10:23:47</span>
                <span className="text-text-secondary">
                  I see a net premium and a gross premium here. Why is the gross premium higher—what exactly am I paying for?
                </span>
              </p>
              <p>
                <span className="text-sky-200 font-semibold">Prospect</span>
                <span className="mx-1 text-text-dim">· 10:24:18</span>
                <span className="text-text-secondary">
                  And if I pay monthly instead of annually, does that change the total I&apos;m paying over time?
                </span>
              </p>
              <p>
                <span className="text-sky-200 font-semibold">Prospect</span>
                <span className="mx-1 text-text-dim">· 10:24:59</span>
                <span className="text-text-secondary">
                  One more thing—you mentioned mortality rates earlier. How much do my age and health actually change this number?
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button className="flex-1 rounded-full border border-white/10 bg-background-elevated/90 px-3 py-1.5 text-[11px] font-medium text-text-primary hover:bg-background-elevated transition-colors">
                Download call notes
              </button>
              <button className="flex-1 rounded-full bg-white/5 text-[11px] font-medium text-emerald-200 px-3 py-1.5 hover:bg-white/10 border border-emerald-400/40 transition-colors">
                Hand off to CRM summary
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right column: Notes */}
        <motion.div
          className="col-span-12 lg:col-span-5 bg-background/75 rounded-2xl border border-white/8 p-3.5 sm:p-4 flex flex-col"
          whileHover={{ y: -2, scale: 1.005 }}
          transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.9 }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary tracking-tight">
              Notes
            </h3>
            <button
              className="text-text-dim hover:text-text-primary transition-colors"
              aria-label="Collapse notes"
            >
              <span className="text-lg leading-none">−</span>
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px]">
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors">
              Load from file
            </button>
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors">
              Import from my notes
            </button>
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors">
              Style
            </button>
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors">
              Headings
            </button>
            <button className="ml-auto px-2.5 py-1 rounded-full bg-gradient-to-r from-green-primary to-emerald-400 text-[10px] font-medium text-black hover:shadow-[0_14px_40px_rgba(22,163,74,0.6)] transition-all">
              Rewrite with AI
            </button>
          </div>

          <p className="text-[11px] text-green-accent mb-2">
            Product Knowledge notes — Connected to the AI assistant, tailored to your case.
          </p>

          <div className="flex-1 rounded-xl bg-background-elevated/80 border border-white/8 px-3.5 py-2.5 text-[11px] text-text-secondary leading-relaxed overflow-y-auto space-y-2">
            <p className="font-semibold text-text-primary">Premium structure</p>

            <div className="mt-1">
              <p className="font-semibold text-text-primary">Net Single Premium</p>
              <ul className="mt-1 space-y-1 list-disc list-inside marker:text-emerald-300">
                <li>Covers mortality cost (death benefit) and interest only.</li>
                <li>Influenced by interest rate, insured&apos;s age, gender, benefits, and mortality rate.</li>
                <li>Calculation: Net single premium = Mortality cost − Interest.</li>
              </ul>
            </div>

            <div className="mt-2">
              <p className="font-semibold text-text-primary">Net Level Annual Premium</p>
              <ul className="mt-1 space-y-1 list-disc list-inside marker:text-emerald-300">
                <li>Level amount paid each year to fund the future benefit.</li>
                <li>Example: To pay $300,000 in 25 years, this is the annual amount needed.</li>
              </ul>
            </div>

            <div className="mt-2">
              <p className="font-semibold text-text-primary">Gross Premium</p>
              <ul className="mt-1 space-y-1 list-disc list-inside marker:text-emerald-300">
                <li>Total premium charged by the insurer, including mortality, interest, and company expenses.</li>
                <li>Calculation: Gross premium = Net premium + Insurer expenses (admin, commissions, overhead).</li>
              </ul>
            </div>

            <div className="mt-2">
              <p className="font-semibold text-text-primary">Gross Annual Premium</p>
              <ul className="mt-1 space-y-1 list-disc list-inside marker:text-emerald-300">
                <li>Gross premium expressed on an annual basis.</li>
                <li>Adjusted for payment frequency; most clients pay annually or in monthly installments.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="font-semibold text-text-primary">Risk factors · Mortality &amp; Morbidity</p>
              <ul className="mt-1 space-y-1 list-disc list-inside marker:text-emerald-300">
                <li>Mortality rate: Expected frequency of death for a given age and profile.</li>
                <li>Morbidity rate: Expected incidence of illness or disability.</li>
                <li>Higher rates increase the risk the insurer is taking and lead to higher premiums.</li>
              </ul>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button className="text-[11px] text-text-muted hover:text-text-primary transition-colors">
              Clear
            </button>
            <button className="flex-1 rounded-full bg-gradient-to-r from-green-primary to-emerald-400 text-[11px] font-semibold text-black px-4 py-1.5 hover:shadow-[0_16px_44px_rgba(22,163,74,0.6)] transition-all">
              Save
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
