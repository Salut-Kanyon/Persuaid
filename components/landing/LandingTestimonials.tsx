"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const quoteCls = "text-[11px] font-normal leading-[1.55] tracking-normal text-text-secondary/95";
const nameCls = "text-[11px] font-semibold tracking-tight text-text-primary";
const metaCls = "text-[9.5px] font-normal leading-snug tracking-normal text-text-dim";

type CeoStat = {
  label: string;
  from: string;
  to: string;
  /** Optional tiny scope line, e.g. “30 days” */
  context?: string;
  lowerIsBetter?: boolean;
};

type Testimonial = {
  image: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  side: "left" | "right";
  top: string;
  delay: number;
  /** Slight final tilt (deg) so cards aren’t perfectly parallel */
  restRotate: number;
  /** Tailwind translate nudges on inner card */
  nudgeClass: string;
  /** Horizontal anchor — small variation per card */
  insetClass: string;
  layout?: "default" | "ceoSpotlight";
  ceoStats?: [CeoStat, CeoStat];
  /** Shown under CEO metrics for credibility */
  ceoCohortNote?: string;
  /** Decorative green quotation marks around quote (default cards only) */
  greenQuoteMarks?: boolean;
};

const CARD_MAX = "max-w-[min(15rem,calc((100vw-64rem)/2-3.75rem))]";
const CARD_MAX_CEO = "max-w-[min(17.5rem,calc((100vw-64rem)/2-2.25rem))] min-w-[15rem]";

/** Carrier / program naming */
const INSURANCE_ORG = "Northline Insurance Group";
const SALES_ACADEMY = "Northline Sales Academy";

/** Shared right-rail horizontal anchor so cards line up */
const RIGHT_RAIL_INSET = "right-[1.75rem] min-[1536px]:right-[3.1rem]";

const TESTIMONIALS: Testimonial[] = [
  {
    image: "/testimonials/hf_20260323_202221_37b564d2-4170-400b-8622-0dfeb75e52e2.jpeg",
    quote:
      "Training and what’s next increase confidence—especially for younger reps who aren’t stuck memorizing everything.",
    name: "Rose S",
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
      "We still train the basics the normal way. This just helped new agents get through the early product-learning curve much faster.",
    name: "Jordan R",
    role: "CEO",
    company: INSURANCE_ORG,
    side: "left",
    top: "47%",
    delay: 0.13,
    restRotate: 0.85,
    nudgeClass: "-translate-x-0.5 translate-y-1",
    insetClass: "left-[1.5rem] min-[1536px]:left-[2.85rem]",
    layout: "ceoSpotlight",
    ceoCohortNote: "One cohort.",
    ceoStats: [
      {
        label: "Product knowledge",
        from: "14 days",
        to: "3 days",
        lowerIsBetter: true,
      },
      {
        label: "Coaching hours",
        context: "30 days",
        from: "20h",
        to: "8h",
        lowerIsBetter: true,
      },
    ],
  },
  {
    image: "/testimonials/hf_20260323_202601_6ee2d99d-a36d-45b4-a021-71b0efd24d43.jpeg",
    quote:
      "I’m not gonna lie, I didn’t really know what I was doing at first. This just makes it easier to not feel lost mid-call. You kind of learn without realizing it.",
    name: "Madelyne P",
    role: "New rep · first calls",
    company: INSURANCE_ORG,
    side: "right",
    top: "78%",
    delay: 0.21,
    restRotate: -2.35,
    nudgeClass: "translate-x-0 translate-y-0.5",
    insetClass: RIGHT_RAIL_INSET,
  },
  {
    image: "/testimonials/hf_20260323_202419_8817a318-2716-4357-934e-f12daccc9414.jpeg",
    quote:
      "I basically dropped the financial calculator. The AI shows the math and answers the simple stuff quickly—and correctly.",
    name: "Devon B",
    role: "New rep · mortgage insurance",
    company: "Ridgeline MI",
    side: "right",
    top: "7%",
    delay: 0.11,
    restRotate: -2.45,
    nudgeClass: "translate-x-0 translate-y-0",
    insetClass: RIGHT_RAIL_INSET,
  },
  {
    image: "/testimonials/hf_20260323_202328_4443aaad-6170-450f-aad9-80edf5a67399.jpeg",
    quote:
      "I used to be in live sales meetings constantly—mostly coaching in the moment. Now I delegate more of that; the AI handles the steady coaching and I step in when it actually needs a human.",
    name: "Andrew D",
    role: "Sales coach",
    company: "Harborline Mutual",
    side: "right",
    top: "42%",
    delay: 0.23,
    restRotate: 2.25,
    nudgeClass: "translate-x-0 translate-y-0",
    insetClass: RIGHT_RAIL_INSET,
  },
];

function StatPair({
  stats,
  cohortNote,
  reduceMotion,
}: {
  stats: [CeoStat, CeoStat];
  cohortNote?: string;
  reduceMotion: boolean | null;
}) {
  const rm = Boolean(reduceMotion);
  const listVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: rm ? 0 : 0.08, delayChildren: rm ? 0 : 0.04 },
    },
  };
  const itemVariants = {
    hidden: rm ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    show: {
      opacity: 1,
      y: 0,
      transition: rm ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 32 },
    },
  };

  return (
    <div className="mt-0">
      <motion.div
        className="grid grid-cols-2 gap-2"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={itemVariants}
            className="rounded-lg border border-white/[0.07] bg-zinc-950/40 px-2.5 py-2"
          >
            <p className="text-[8px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              {s.label}
            </p>
            {s.context ? (
              <p className="mt-0.5 text-[7px] text-zinc-600">{s.context}</p>
            ) : null}
            <div className="mt-1.5 flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-[10px] text-zinc-500 line-through decoration-zinc-600/70">
                {s.from}
              </span>
              <span className="text-[9px] text-zinc-600">→</span>
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-tight",
                  s.lowerIsBetter ? "text-[#7d9c8a]" : "text-sky-400/60"
                )}
              >
                {s.to}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
      {cohortNote ? (
        <p className="mt-2 text-center text-[6.5px] tracking-wide text-zinc-600">{cohortNote}</p>
      ) : null}
    </div>
  );
}

function TestimonialCard({
  t,
  reduceMotion,
  demoOpen,
}: {
  t: Testimonial;
  reduceMotion: boolean | null;
  demoOpen: boolean;
}) {
  const spring = {
    type: "spring" as const,
    stiffness: 112,
    damping: 15,
    mass: 0.9,
  };

  const ceoStats = t.layout === "ceoSpotlight" ? t.ceoStats : undefined;
  const isCeoSpotlight = Boolean(ceoStats);
  const r = t.restRotate;

  return (
    <motion.article
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, y: "-115%", rotate: r - 3.2, scale: 0.93 }
      }
      animate={
        demoOpen
          ? reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: "-35%", rotate: r * 0.35, scale: 0.9 }
          : reduceMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0, rotate: r, scale: 1 }
      }
      transition={
        reduceMotion ? { duration: 0.35, delay: t.delay } : { ...spring, delay: t.delay }
      }
      style={{ top: t.top }}
      className={cn(
        "absolute z-[4] w-full origin-top drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)]",
        isCeoSpotlight ? CARD_MAX_CEO : cn("min-w-[13rem]", CARD_MAX),
        t.insetClass
      )}
    >
      <div className={t.nudgeClass}>
        {ceoStats ? (
          <div
            className={cn(
              "rounded-2xl border border-white/[0.08] bg-[#0c0f0f]/94 p-4 backdrop-blur-md",
              !reduceMotion && "landing-testimonial-green-line-ceo"
            )}
            style={
              !reduceMotion
                ? { animationDelay: `${Number(t.delay) * 14}s` }
                : {
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.35)",
                  }
            }
          >
            <div className="flex gap-3 text-left">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/[0.1] bg-zinc-900 shadow-inner shadow-black/40">
                <img src={t.image} alt="" className="h-full w-full object-cover object-center" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[12px] font-semibold tracking-tight text-text-primary">{t.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[9.5px] font-normal leading-snug tracking-normal text-text-dim">
                  <span className="text-text-secondary/90">{t.role}</span>
                  <span className="text-text-muted/60">·</span>
                  <span className="font-medium text-text-secondary/85">{t.company}</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 border-t border-white/[0.06] pt-3.5">
              <p className="text-[11px] font-normal leading-[1.65] tracking-normal text-text-secondary/90">
                {t.quote}
              </p>
            </div>
            <div className="mt-3.5 border-t border-white/[0.06] pt-3.5">
              <StatPair stats={ceoStats} cohortNote={t.ceoCohortNote} reduceMotion={reduceMotion} />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-[14px] border border-white/[0.09] bg-[#0c0f0f]/88 p-3 backdrop-blur-md",
              !reduceMotion && "landing-testimonial-green-line"
            )}
            style={
              !reduceMotion
                ? { animationDelay: `${Number(t.delay) * 14}s` }
                : { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }
            }
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/[0.1] bg-zinc-900">
                <img src={t.image} alt="" className="h-full w-full object-cover object-center" />
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
              <p className={cn("mt-2.5", quoteCls)}>
                <span className="font-serif text-[1.15em] leading-none text-[#6b8f7c]" aria-hidden>
                  &ldquo;
                </span>
                {t.quote}
                <span className="font-serif text-[1.15em] leading-none text-[#6b8f7c]" aria-hidden>
                  &rdquo;
                </span>
              </p>
            ) : (
              <p className={cn("mt-2.5", quoteCls)}>{t.quote}</p>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

type LandingTestimonialsProps = {
  demoOpen: boolean;
};

export function LandingTestimonials({ demoOpen }: LandingTestimonialsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] hidden min-h-[100svh] overflow-visible min-[1400px]:block"
      aria-label="Customer quotes"
    >
      <div
        className="absolute inset-y-8 left-0 w-72 bg-gradient-to-r from-black/35 via-black/12 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-y-8 right-0 w-72 bg-gradient-to-l from-black/35 via-black/12 to-transparent"
        aria-hidden
      />

      {TESTIMONIALS.map((t) => (
        <TestimonialCard key={`${t.name}-${t.image}`} t={t} reduceMotion={reduceMotion} demoOpen={demoOpen} />
      ))}
    </div>
  );
}
