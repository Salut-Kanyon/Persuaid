"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AiKind = "answer" | "followup" | "clarification";

interface AiResponse {
  kind: AiKind;
  text: string;
  source: string;
}

// AI coaching lines—natural, grounded in notes.
const AI_RESPONSES: AiResponse[] = [
  { kind: "answer", text: "“Great question. The net premium is the pure cost of insurance—mortality and interest. The gross premium is that plus the insurer’s expenses: admin, commissions, and overhead. So you’re paying for coverage plus the cost to run the policy.”", source: "Gross Premium" },
  { kind: "answer", text: "“Paying monthly doesn’t change your total or your coverage. It just spreads the gross annual premium into smaller payments over the year. Same benefit, different cash flow.”", source: "Gross Annual Premium" },
  { kind: "answer", text: "“Your age and health feed into what we call mortality and morbidity rates—they’re how the insurer prices risk. Higher expected risk means a higher premium. I can walk you through how that shows up in your quote if that’s helpful.”", source: "Mortality & Morbidity" },
];

interface ProductPreviewProps {
  className?: string;
}

export function ProductPreview({ className }: ProductPreviewProps) {
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
      <div className="relative z-10 bg-background-elevated/90 px-4 py-3 flex items-center gap-2 border-b border-white/10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 text-center">
          <span className="inline-flex items-center gap-1.5 text-text-dim text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
            https://persuaid.app
          </span>
        </div>
        <motion.button
          type="button"
          className="group relative flex items-center gap-2 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-[#5eead4] via-[#20D3A6] to-[#0f766e] px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-bold tracking-tight text-[#04110D] shadow-[0_6px_28px_rgba(32,211,166,0.4),0_0_36px_-6px_rgba(45,212,191,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] ring-2 ring-[#20D3A6]/55 ring-offset-2 ring-offset-[#0a0c0c] transition-[transform,filter,box-shadow] duration-300 hover:brightness-[1.06] hover:shadow-[0_8px_36px_rgba(32,211,166,0.55),0_0_48px_-4px_rgba(45,212,191,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <span
            className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />
          <span className="relative z-[1]">Start Call</span>
          <span
            className="relative z-[1] inline-flex h-2 w-2 shrink-0 rounded-full bg-[#04110D]/30"
            aria-hidden
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#04110D]/25" />
          </span>
        </motion.button>
      </div>

      {/* Main UI Grid */}
      <div className="relative z-0 p-4 lg:p-5 grid grid-cols-12 gap-3 lg:gap-4 min-h-[520px] lg:min-h-[620px]">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 lg:gap-3.5">
          {/* What to say next */}
          <motion.div
            className="group relative flex-[1.15] min-h-[180px] bg-background/80 rounded-2xl border border-white/10 p-3.5 sm:p-4 flex flex-col overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.9 }}
          >
            <div className="relative z-10 flex items-center justify-between mb-2.5">
              <div className="inline-flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-text-primary tracking-tight">What to say next</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-primary/10 text-[10px] text-green-accent border border-green-primary/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
                  AI coaching
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] text-text-dim font-mono">00:18:42</span>
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-text-muted border border-white/10">
                  <span className="w-1 h-1 rounded-full bg-emerald-300 inline-block mr-1" />
                  Objection detected
                </span>
              </div>
            </div>

            {/* Main suggestion card */}
            <motion.div
              className="relative z-10 mt-2.5 flex-1 rounded-xl border border-white/10 bg-background-elevated/90 px-3.5 py-3 flex flex-col gap-2 overflow-hidden group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.9 }}
            >
              <div className="flex items-center gap-2 text-[12px] text-text-muted mb-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-primary/10 text-[10px] text-green-accent border border-green-primary/40">AI</span>
                <span>Drafting your next line…</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                </span>
              </div>

              <div className="text-left text-[12px] sm:text-[13px] text-text-primary/95 leading-relaxed">
                {AI_RESPONSES.map((line, i) => (
                  <motion.div
                    key={`${line.text}-${i}`}
                    className={cn(i === 0 ? "mt-0" : "mt-4")}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.08 }}
                  >
                    <p className="leading-relaxed">{line.text}</p>
                    <span className="mt-1 block text-[10px] text-text-dim/80">{line.source}</span>
                  </motion.div>
                ))}
              </div>

              </motion.div>

            <div className="relative z-10 mt-2.5 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="flex-1 rounded-full bg-background-elevated/80 border border-white/10 px-3.5 py-1.5 text-[11px] text-text-dim flex items-center shadow-inner">
                <span className="truncate">Press Enter to get an answer, or type your own question…</span>
              </div>
              <button className="rounded-full bg-gradient-to-r from-green-primary to-emerald-400 px-3.5 py-1.5 text-[11px] font-semibold text-black hover:opacity-90 transition-opacity">
                Ask follow-up
              </button>
            </div>
            {/* Hover overlay: explanation */}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/85 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="px-4 text-center text-[13px] sm:text-base font-medium text-white leading-snug max-w-[300px]">
                Press Enter and Persuaid uses the last moments of the conversation plus your product notes to draft the next line.
              </p>
            </div>
          </motion.div>

          {/* Live transcript */}
          <motion.div
            className="relative flex-[0.9] min-h-[160px] bg-background/70 rounded-2xl border border-white/8 p-3.5 flex flex-col overflow-hidden group"
            whileHover={{ y: -2, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.9 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-primary rounded-full animate-pulse" />
                <h3 className="text-xs font-semibold text-text-primary tracking-tight">Live transcript</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-dim font-mono">00:18:42</span>
                <button className="text-[10px] text-text-muted hover:text-text-primary">Clear transcript</button>
              </div>
            </div>
            <div className="text-[10px] text-text-dim mb-2">What the prospect says. Persuaid listens here, then pulls the right answer from your notes.</div>
            <div className="flex-1 rounded-xl bg-background-elevated/70 border border-white/6 px-3 py-2.5 text-[11px] leading-relaxed overflow-y-auto space-y-1.5">
              <p><span className="text-emerald-300 font-semibold">Rep</span><span className="mx-1 text-text-dim">· 10:23</span><span className="text-text-secondary">Thanks for your time. I&apos;ll explain pricing in plain language—stop me anytime.</span></p>
              <p><span className="text-sky-200 font-semibold">Prospect</span><span className="mx-1 text-text-dim">· 10:24</span><span className="text-text-secondary">I see net and gross premium. Why is gross higher—what am I actually paying for?</span></p>
              <p><span className="text-sky-200 font-semibold">Prospect</span><span className="mx-1 text-text-dim">· 10:24</span><span className="text-text-secondary">If I pay monthly instead of annually, does that change the total I pay?</span></p>
              <p><span className="text-sky-200 font-semibold">Prospect</span><span className="mx-1 text-text-dim">· 10:25</span><span className="text-text-secondary">You mentioned mortality rates—how much do my age and health affect the number?</span></p>
              <p><span className="text-emerald-300 font-semibold">Rep</span><span className="mx-1 text-text-dim">· 10:25</span><span className="text-text-secondary">Those mortality and morbidity rates are exactly what drive that. I can put it in simple terms for your situation.</span></p>
            </div>
            <div className="mt-2.5 flex gap-2">
              <button className="flex-1 rounded-full border border-white/10 bg-background-elevated/90 px-3 py-1.5 text-[10px] font-medium text-text-primary">Download call notes</button>
              <button className="flex-1 rounded-full bg-white/5 text-[10px] font-medium text-emerald-200 px-3 py-1.5 border border-emerald-400/40">Hand off to CRM</button>
            </div>
            {/* Hover overlay: explanation */}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/85 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="px-4 text-center text-[12px] sm:text-sm font-medium text-white leading-snug max-w-[260px]">When toggled on, Persuaid listens to the full conversation and uses it with your notes to suggest what to say next.</p>
            </div>
          </motion.div>
        </div>

        {/* Right column: Notes */}
        <motion.div
          className="relative col-span-12 lg:col-span-5 bg-background/75 rounded-2xl border border-white/8 p-3.5 flex flex-col overflow-hidden group"
          whileHover={{ y: -2, scale: 1.005 }}
          transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.9 }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-text-primary tracking-tight">Notes</h3>
            <span className="text-text-dim text-base leading-none cursor-default">−</span>
          </div>
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted">Load from file</button>
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted">Import</button>
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted">Style</button>
            <button className="px-2.5 py-1 rounded-full bg-background-elevated/90 border border-white/10 text-text-muted">Headings</button>
            <button className="ml-auto px-2.5 py-1 rounded-full bg-green-primary/80 text-black font-medium">Rewrite with AI</button>
          </div>
          <p className="text-[10px] text-green-accent mb-2">Product Knowledge — connected to the AI, tailored to your case.</p>
          <div className="flex-1 rounded-xl bg-background-elevated/80 border border-white/8 px-3 py-2.5 text-[11px] text-text-secondary leading-relaxed overflow-y-auto space-y-2">
            <p className="font-semibold text-text-primary text-[11px]">Premium structure</p>
            <div><p className="font-medium text-text-primary">Net Single Premium</p><ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-emerald-300"><li>Covers mortality cost (death benefit) and interest only.</li><li>Influenced by rate, age, gender, benefits, mortality.</li><li>Net single = Mortality cost − Interest.</li></ul></div>
            <div><p className="font-medium text-text-primary">Net Level Annual Premium</p><ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-emerald-300"><li>Level amount each year to fund the future benefit.</li><li>e.g. $300k in 25 years.</li></ul></div>
            <div><p className="font-medium text-text-primary">Gross Premium</p><ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-emerald-300"><li>Total: mortality, interest, and company expenses.</li><li>Gross = Net + Insurer expenses (admin, commissions).</li></ul></div>
            <div><p className="font-medium text-text-primary">Gross Annual Premium</p><ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-emerald-300"><li>Gross on an annual basis; pay monthly or annually.</li></ul></div>
            <div className="pt-2 border-t border-white/5"><p className="font-medium text-text-primary">Mortality &amp; Morbidity</p><ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-emerald-300"><li>Rates by age and profile; higher rates → higher premium.</li></ul></div>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button className="text-[10px] text-text-muted hover:text-text-primary">Clear</button>
            <button className="flex-1 rounded-full bg-gradient-to-r from-green-primary to-emerald-400 text-[11px] font-semibold text-black px-3.5 py-1.5">Save</button>
          </div>
          {/* Hover overlay: explanation */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/85 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="px-4 text-center text-[12px] sm:text-sm font-medium text-white leading-snug max-w-[280px]">
              Add all your product knowledge and everything you need to know about your product here. The AI will still think for itself if nothing is in here—but this gives it a guide to focus on.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
