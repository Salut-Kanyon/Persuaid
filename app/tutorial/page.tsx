"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { TUTORIAL_VIDEO_SRC } from "@/lib/tutorial-video";
import { cn } from "@/lib/utils";

export default function TutorialPage() {
  const [clicked, setClicked] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-text-primary selection:bg-green-primary/20">
      <Navbar landingLogo />

      <div className="relative z-10">
        <section className="mx-auto w-full max-w-5xl px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-28 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[min(1020px,calc(100vw-2.5rem))] sm:max-w-[1020px]"
          >
            <div
              className={cn(
                "rounded-[20px] sm:rounded-[26px] overflow-hidden",
                "bg-[#040404] border border-white/[0.1] shadow-[0_36px_120px_-34px_rgba(0,0,0,0.95)]",
                "ring-1 ring-white/[0.06]"
              )}
              style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
            >
              <div className="relative aspect-video bg-[#000000]">
                <video
                  className="w-full h-full object-contain bg-black"
                  playsInline
                  preload="metadata"
                  autoPlay
                  controls
                  muted
                  controlsList="nodownload"
                >
                  <source src={TUTORIAL_VIDEO_SRC} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <p className="mt-6 px-1 text-left text-sm leading-snug text-text-muted sm:text-[15px]">
              Starts muted—use the player controls to unmute, scrub, or change playback speed.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-10 sm:mt-12 flex flex-col items-stretch justify-center gap-3 max-w-md sm:max-w-none mx-auto"
          >
            <Link
              href="/"
              onClick={() => setClicked(true)}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-7 py-4 text-[16px] font-semibold text-white",
                "bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c]",
                "shadow-[0_0_0_1px_rgba(26,157,120,0.45),0_8px_32px_-10px_rgba(26,157,120,0.45)]",
                "transition-[filter,transform] hover:brightness-[1.05] active:scale-[0.99]",
              )}
            >
              Download for free
              <span className={cn("ml-2 text-white/90 transition-transform", clicked ? "translate-x-0.5" : "translate-x-0")} aria-hidden>
                →
              </span>
            </Link>
          </motion.div>

          <p className="mx-auto mt-10 max-w-lg text-center text-[12px] leading-relaxed text-text-dim sm:text-[13px]">
            Sharing from email? UTM tags (e.g.{" "}
            <code className="rounded-md border border-white/[0.08] bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-text-muted">
              ?utm_source=bevo
            </code>
            ) work on this URL for analytics.
          </p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
