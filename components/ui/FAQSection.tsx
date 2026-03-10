"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/ui/Section";

const FAQ_ITEMS = [
  {
    q: "How is Persuaid different from other meeting or AI tools?",
    a: "There are plenty of meeting assistants and notetakers out there. Persuaid is built only for sales. The AI and the product are designed around one goal: helping you close sales calls. You get real-time, professional advice—what to say next, how to handle objections, and when to ask the right questions—so you sound confident and move deals forward.",
  },
  {
    q: "Why use Persuaid instead of a typical AI notetaker?",
    a: "Most AI notetakers help after the call. Persuaid helps during it. It listens in real time, reads the conversation as it happens, and suggests what to say next so you can handle objections, answer questions, and keep the call moving.",
  },
  {
    q: "Who is Persuaid built for?",
    a: "Persuaid is for SDRs, AEs, founders, and anyone running live sales or discovery calls who wants a real-time copilot for sharper responses, better follow-up questions, and more confidence in the moment.",
  },
  {
    q: "What do I actually see during a call?",
    a: "You'll see a live transcript, a notes panel, and a suggestion area with recommended responses and follow-up questions. The goal is simple: help you stay present while still having strong talking points ready when you need them.",
  },
  {
    q: "Does Persuaid join or record meetings like a bot?",
    a: "No noisy bot joining the call. Persuaid is designed to stay out of the way while quietly listening to the audio you route to it, so you get live support without adding friction for your prospect.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. You can get started with a free trial and no credit card required. Just sign in, create an account, and launch your first session.",
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
    <Section id="faq" className="bg-background-default">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        <header className="mb-12 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-text-primary">
            Questions, answered clearly
          </h2>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-7 text-text-muted">
            Built for sales. Everything you need to know about using Persuaid to close more calls.
          </p>
        </header>

        <div className="rounded-xl border border-border-default bg-background-elevated/50 overflow-hidden shadow-sm">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border-b border-border-subtle last:border-b-0 ${
                  isOpen ? "bg-background-elevated/80" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex((current) => (current === index ? null : index))
                  }
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 sm:py-5 text-left transition-colors duration-150 hover:bg-background-elevated/60"
                >
                  <span className="text-[15px] sm:text-base font-medium text-text-primary leading-snug pr-4">
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
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 pt-0">
                        <p className="text-[15px] sm:text-base text-text-muted leading-[1.65] max-w-none">
                          {item.a}
                        </p>
                      </div>
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
