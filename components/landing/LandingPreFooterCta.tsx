"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PRE_FOOTER_VIDEO_SRC =
  "/hf_20260327_002153_caa83e0a-b2f0-4511-af8b-6f325a7d99fc.mp4";

export function LandingPreFooterCta() {
  return (
    <section
      className="relative overflow-hidden border-t border-white/[0.07] bg-[#000000]"
      aria-labelledby="pre-footer-cta-heading"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="max-w-xl">
            <h2
              id="pre-footer-cta-heading"
              className="text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-3xl md:text-[2.15rem]"
            >
              Accurate AI, anchored in your knowledge.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-muted sm:text-[17px]">
              Persuaid draws on what you add—your facts, files, and notes—so answers stay specific and reliable instead of
              generic.
            </p>

            <motion.a
              href="/download"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "mt-8 inline-flex h-12 min-h-12 items-center justify-center rounded-full px-8 sm:px-10",
                "bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] text-[15px] font-semibold tracking-[-0.02em] text-white",
                "border border-[#4dc49a]/50 shadow-[0_0_0_1px_rgba(26,157,120,0.35),0_4px_24px_rgba(26,157,120,0.4),0_14px_40px_-12px_rgba(0,0,0,0.65)]",
                "before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:rounded-full before:bg-white/30",
                "relative isolate transition-[filter,box-shadow] duration-200 hover:brightness-[1.05] hover:shadow-[0_0_0_1px_rgba(61,184,146,0.45),0_8px_32px_rgba(26,157,120,0.5)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]"
              )}
            >
              Download Now
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative flex w-full justify-center lg:justify-end"
          >
            <video
              className="h-auto w-full max-h-[min(260px,52vw)] max-w-[min(100%,320px)] object-contain object-center bg-[#000000] sm:max-h-[280px] sm:max-w-[380px] lg:max-h-[300px] lg:max-w-[420px]"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Persuaid in action"
            >
              <source src={PRE_FOOTER_VIDEO_SRC} type="video/mp4" />
            </video>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
