"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { FREE_PLAN_MONTHLY_MINUTES } from "@/lib/usage";

const FAQ_ITEMS = [
  {
    q: "What does Persuaid do?",
    a: "It sits beside your call: live transcript, your product notes, and a shortcut (Enter) when you want a suggested next line.",
  },
  {
    q: "How is it different from a typical AI notetaker?",
    a: "Notetakers are great for recaps. We're for the moment. When a prospect asks about pricing or a competitor, you get a suggested line right then—grounded in your notes and your product—so you don't blank or fumble.",
  },
  {
    q: "Does Persuaid join the call as a participant?",
    a: "No. You route audio through the app on your side—your prospect only sees you.",
  },
  {
    q: "Is there a free tier?",
    a: `Yes. Sign up and try it without a card—you get ${FREE_PLAN_MONTHLY_MINUTES} minutes of live call listening per month, with paid plans for more airtime.`,
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 w-5 h-5 items-center justify-center text-text-muted transition-transform duration-200 ease-out ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      className="border-t border-white/[0.06] bg-[var(--bg-near-black)] py-20 md:py-24 lg:py-32"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-text-dim/85">Questions</p>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold tracking-tight text-text-primary">
            Questions
          </h2>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_22px_60px_-34px_rgba(0,0,0,0.85)] overflow-hidden">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q} className="border-b border-white/10 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:bg-white/[0.04] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-[17px] font-medium text-text-primary pr-2">
                    {item.q}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[15px] text-text-muted leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </Section>
  );
}
