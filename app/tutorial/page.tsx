"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
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
    <main className="relative min-h-screen bg-[#000000] text-[#F5F7F7] selection:bg-[color:var(--landing-accent)]/20">
      <div className="pointer-events-none fixed inset-0 bg-[#000000] z-0" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:96px_96px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-[#000000] via-[#000000]/88 to-transparent z-0" />

      <Navbar landing />

      <div className="relative z-10">
        <section className="pt-24 pb-20 sm:pt-28 sm:pb-28 px-5 sm:px-8 max-w-[1100px] mx-auto">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10 sm:mb-12"
          >
            <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.22em] text-[#8A9494] mb-3">
              Tutorial
            </p>
            <h1 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.75rem] font-semibold tracking-[-0.03em] text-[#F5F7F7] leading-[1.1] max-w-2xl mx-auto text-balance">
              Watch the walkthrough in the actual call flow
            </h1>
            <p className="mt-4 text-[15px] sm:text-[17px] text-[#AEB8B8] font-normal leading-relaxed max-w-xl mx-auto">
              Same dark workspace style as the app, with the latest tutorial capture.
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[1020px]"
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8d0d0]">Tutorial</p>
                  <p className="mt-1 text-[12px] text-[#d7dddd] leading-snug">
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

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
              <p className="text-left text-[13px] sm:text-sm text-[#7E8888] leading-snug max-w-md">
                Want narration? Tap once to unmute and continue playing.
              </p>
              <button
                type="button"
                onClick={playWithSound}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[14px] sm:text-[15px] font-medium text-[#04110D] bg-[#20D3A6] border border-[#20D3A6]/40 shadow-[0_4px_24px_rgba(32,211,166,0.2)] hover:bg-[#19BE95] transition-colors active:scale-[0.99]"
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-medium text-[#E8EDED] bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.1] hover:border-white/[0.18] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-[#20D3A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#7E8888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold text-[#04110D] bg-white border border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.2)] ring-1 ring-white/15 hover:brightness-[1.03] transition-[filter]"
            >
              Join now
              <svg className="w-4 h-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>

          <p className="mt-10 text-center text-[12px] text-[#7E8888] max-w-lg mx-auto leading-relaxed">
            Sharing from email? UTM tags (e.g.{" "}
            <code className="text-[#B7C0C0] font-mono text-[11px] bg-white/[0.06] px-2 py-1 rounded-md border border-white/[0.08]">
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
