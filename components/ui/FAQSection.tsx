"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/ui/Section";

const FAQ_ITEMS = [
  {
    q: "How is Persuaid different from other meeting or AI tools?",
    a: "Lots of tools take notes after the call. We're built for what happens in the room. Persuaid is only for sales: it listens live, knows your product because you tell it—your playbooks, positioning, objection handlers—and suggests what to say next so you sound like you, just sharper. The big difference: you add your own product knowledge, and the assistant tailors every answer to your product and your pitch. No generic advice. Just yours.",
  },
  {
    q: "Why use Persuaid instead of a typical AI notetaker?",
    a: "Notetakers are great for recaps. We're for the moment. When a prospect asks about pricing or a competitor, you get a suggested line right then—grounded in your notes and your product—so you don't blank or fumble. It's like having your best deck and playbook in your ear, in real time.",
  },
  {
    q: "Who is Persuaid built for?",
    a: "Anyone on live sales or discovery calls who wants a second pair of ears: SDRs, AEs, founders, customer success. If you care about saying the right thing when it matters, and you're willing to add your product knowledge so the AI can speak your language, it's for you.",
  },
  {
    q: "What do I actually see during a call?",
    a: "A live transcript of who said what, your notes (the product knowledge you added), and a suggestion box that updates as the conversation goes—next line to say, follow-up questions, objection handles. Everything stays on your screen; nothing pops up for the prospect.",
  },
  {
    q: "Does Persuaid join or record meetings like a bot?",
    a: "No. No bot on the call, no new link to send. You route your audio to Persuaid; it listens in the background and feeds you suggestions. Your prospect only sees and hears you.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Sign up, add your product knowledge, and try it on a real call. No credit card required to get started.",
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
    <Section id="faq" className="bg-background-default pt-10 md:pt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        <header className="mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-text-primary">
            Frequently asked questions
          </h2>
        </header>

        <div className="rounded-xl border border-white/10 bg-background-elevated/40 overflow-hidden">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border-b border-white/10 last:border-b-0 ${
                  isOpen ? "bg-background-elevated/60" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex((current) => (current === index ? null : index))
                  }
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 sm:py-6 text-left transition-colors duration-150 hover:bg-white/[0.02]"
                >
                  <span className="text-base sm:text-lg font-medium text-text-primary leading-snug pr-6 text-left">
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
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                        <p className="text-[15px] sm:text-base text-text-muted leading-relaxed max-w-none">
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
