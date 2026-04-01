"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const quoteCls =
  "text-[13px] sm:text-[14px] font-normal leading-[1.6] tracking-normal text-text-secondary/95";
const nameCls = "text-[13px] sm:text-sm font-semibold tracking-tight text-text-primary";
const metaCls = "text-[11px] sm:text-xs font-normal leading-snug tracking-normal text-text-dim";

type Testimonial = {
  image: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  side: "left" | "right";
  top: string;
  delay: number;
  restRotate: number;
  nudgeClass: string;
  insetClass: string;
  greenQuoteMarks?: boolean;
};

const INSURANCE_ORG = "Northline Insurance Group";
const SALES_ACADEMY = "Northline Sales Academy";

const TESTIMONIALS: Testimonial[] = [
  {
    image: "/testimonials/hf_20260323_202221_37b564d2-4170-400b-8622-0dfeb75e52e2.jpeg",
    quote:
      "New producers stopped freezing on product detail. They get the next sentence live instead of memorizing decks.",
    name: "Rose S.",
    role: "Agency owner",
    company: SALES_ACADEMY,
    side: "left",
    top: "9%",
    delay: 0.05,
    restRotate: -2.6,
    nudgeClass: "translate-x-0.5 -translate-y-1",
    insetClass: "left-[1.7rem] min-[1536px]:left-[3.05rem]",
    greenQuoteMarks: true,
  },
  {
    image: "/testimonials/hf_20260323_204033_c62828bd-f1db-4e2b-852c-535316ab8fae.jpeg",
    quote:
      "We still run fundamentals in class. New agents got productive on product much faster—less shadowing, fewer dead-air first calls.",
    name: "Jordan R.",
    role: "CEO",
    company: INSURANCE_ORG,
    side: "left",
    top: "47%",
    delay: 0.13,
    restRotate: 0.85,
    nudgeClass: "-translate-x-0.5 translate-y-1",
    insetClass: "left-[1.5rem] min-[1536px]:left-[2.85rem]",
  },
  {
    image: "/testimonials/hf_20260323_202601_6ee2d99d-a36d-45b4-a021-71b0efd24d43.jpeg",
    quote:
      "First month I was lost mid-call. Now I get a line when I blank—I'm closing small policies I would have handed off before.",
    name: "Madelyne P.",
    role: "New rep, first calls",
    company: INSURANCE_ORG,
    side: "right",
    top: "78%",
    delay: 0.21,
    restRotate: -2.35,
    nudgeClass: "translate-x-0 translate-y-0.5",
    insetClass: "right-[1.75rem]",
  },
  {
    image: "/testimonials/hf_20260323_202419_8817a318-2716-4357-934e-f12daccc9414.jpeg",
    quote:
      "Dropped the calculator for routine scenarios. I quote payment math on the phone in seconds and it's been right every time so far.",
    name: "Devon B.",
    role: "New rep, mortgage insurance",
    company: "Ridgeline MI",
    side: "right",
    top: "7%",
    delay: 0.11,
    restRotate: -2.45,
    nudgeClass: "translate-x-0 translate-y-0",
    insetClass: "right-[1.75rem]",
  },
  {
    image: "/testimonials/hf_20260323_202328_4443aaad-6170-450f-aad9-80edf5a67399.jpeg",
    quote:
      "Far fewer live ride-alongs. Reps get nudges on the call; I step in only when the deal is actually stuck.",
    name: "Andrew D.",
    role: "Sales coach",
    company: "Harborline Mutual",
    side: "right",
    top: "42%",
    delay: 0.23,
    restRotate: 2.25,
    nudgeClass: "translate-x-0 translate-y-0",
    insetClass: "right-[1.75rem]",
  },
];

function TestimonialCardInner({
  t,
  photoClass,
}: {
  t: Testimonial;
  photoClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-600/25 bg-[var(--bg-elevated)]/95 p-4 sm:p-5",
        "shadow-[0_12px_40px_-8px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="flex items-center gap-3 border-b border-stone-600/20 pb-3">
        <div className={cn("shrink-0 overflow-hidden rounded-full border border-stone-600/30 bg-zinc-900", photoClass)}>
          <img
            src={t.image}
            alt={`${t.name}, ${t.role}`}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className={cn("truncate", nameCls)}>{t.name}</p>
          <div className={cn("mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5", metaCls)}>
            <span className="truncate">{t.role}</span>
            <span className="text-text-muted/70">·</span>
            <span className="truncate font-medium text-text-secondary/90">{t.company}</span>
          </div>
        </div>
      </div>
      {t.greenQuoteMarks ? (
        <p className={cn("mt-3 sm:mt-3.5", quoteCls)}>
          <span className="font-serif text-[1.15em] leading-none text-[color:var(--landing-accent)]" aria-hidden>
            &ldquo;
          </span>
          {t.quote}
          <span className="font-serif text-[1.15em] leading-none text-[color:var(--landing-accent)]" aria-hidden>
            &rdquo;
          </span>
        </p>
      ) : (
        <p className={cn("mt-3 sm:mt-3.5", quoteCls)}>{t.quote}</p>
      )}
    </div>
  );
}

function TestimonialScrollCard({
  t,
  reduceMotion,
  index,
}: {
  t: Testimonial;
  reduceMotion: boolean | null;
  index: number;
}) {
  return (
    <motion.article
      role="listitem"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.2), ease: "easeOut" }}
      className="shrink-0 snap-start snap-always w-[min(22.5rem,calc(100vw-2.25rem))] sm:w-[min(24rem,calc(100vw-3rem))]"
    >
      <TestimonialCardInner t={t} photoClass="h-14 w-14 sm:h-[3.75rem] sm:w-[3.75rem]" />
    </motion.article>
  );
}

/** Centered intro + one horizontal row of cards (scroll / swipe on all breakpoints). */
export function LandingTestimonialsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-full">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-2 pb-7 sm:pb-9 text-center">
        <p className="text-[13px] sm:text-sm font-medium uppercase tracking-[0.16em] text-text-dim">
          Real customers
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.35rem] font-semibold tracking-tight text-text-primary leading-[1.15]">
          Results on live calls
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-base sm:text-[17px] text-text-muted leading-relaxed">
          Reps and managers on faster ramps, fewer stalls, and less hand-holding. Scroll for more.
        </p>
      </div>

      <div
        className={cn(
          "flex gap-5 sm:gap-6 overflow-x-auto overflow-y-visible pb-10 sm:pb-12 pt-2 px-4 sm:px-8 lg:px-10",
          "snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-8 lg:scroll-pl-10",
          "overscroll-x-contain [-webkit-overflow-scrolling:touch]"
        )}
        role="list"
        aria-label="Customer testimonials"
      >
        {TESTIMONIALS.map((t, index) => (
          <TestimonialScrollCard key={`${t.name}-${t.image}`} t={t} reduceMotion={reduceMotion} index={index} />
        ))}
      </div>
    </div>
  );
}
