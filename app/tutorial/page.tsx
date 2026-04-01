"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import {
  MarketingHeroHeadlineDivider,
  marketingHeroSubtitleClassName,
  marketingHeroTitleClassName,
} from "@/components/ui/marketing-landing-art";
import { cn } from "@/lib/utils";

export default function TutorialPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  const copyPageLink = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const playWithSound = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play().catch(() => {});
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-text-primary selection:bg-green-primary/20">
      <Navbar landingLogo />

      <div className="relative z-10">
        <section className="mx-auto w-full max-w-5xl px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-28 lg:pt-28">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[42rem] text-center"
          >
            <h1 className={marketingHeroTitleClassName}>Watch the walkthrough in the actual call flow</h1>
            <MarketingHeroHeadlineDivider />
            <p className={cn(marketingHeroSubtitleClassName, "mb-10 text-white sm:mb-12")}>
              Same dark workspace style as the app, with the latest tutorial capture.
            </p>
          </motion.header>

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
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-black/60 to-transparent" />
                <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-white/15 bg-black/55 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-dim">Tutorial</p>
                  <p className="mt-1 text-[12px] leading-snug text-text-secondary">
                    give me an example of a healthy young person price
                  </p>
                </div>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  preload="auto"
                  autoPlay
                  loop
                  muted
                >
                  <source src="/go.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-left text-sm leading-snug text-text-muted sm:text-[15px]">
                Want narration? Tap once to unmute and continue playing.
              </p>
              <button
                type="button"
                onClick={playWithSound}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#4dc49a]/50 bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_0_1px_rgba(26,157,120,0.35),0_4px_20px_rgba(26,157,120,0.35)] transition-[transform,filter] duration-200 hover:brightness-[1.04] active:scale-[0.99] sm:text-[15px]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                Play with sound
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md sm:max-w-none mx-auto"
          >
            <button
              type="button"
              onClick={copyPageLink}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white/[0.06] px-6 py-3.5 text-[15px] font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-white/[0.1]"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 text-green-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy link
                </>
              )}
            </button>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white px-6 py-3.5 text-[15px] font-semibold text-background-near-black shadow-[0_1px_2px_rgba(0,0,0,0.2)] ring-1 ring-white/15 transition-[filter] hover:brightness-[1.03]"
            >
              Join now
              <svg className="w-4 h-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
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
