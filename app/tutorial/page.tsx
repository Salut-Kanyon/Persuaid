"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

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
    <main className="theme-light min-h-screen bg-[#f5f5f7] text-text-primary selection:bg-neutral-300/40">
      <Navbar />

      {/* Subtle top fade — no brand green */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-white/80 to-transparent z-0" />

      <div className="relative z-10">
        <section className="pt-8 pb-16 sm:pt-14 sm:pb-24 px-5 sm:px-8 max-w-[980px] mx-auto">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[13px] sm:text-sm font-medium text-text-muted tracking-wide mb-3">
              Persuaid · Getting started
            </p>
            <h1 className="text-[32px] sm:text-[44px] lg:text-[48px] font-semibold tracking-tight text-text-primary leading-[1.08] max-w-2xl mx-auto text-balance">
              Watch the quick start
            </h1>
            <p className="mt-4 text-[15px] sm:text-[17px] text-text-muted font-normal leading-relaxed max-w-md mx-auto">
              Use the controls below. Turn your volume up for narration.
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-[880px]"
          >
            <div
              className="rounded-[20px] sm:rounded-[28px] overflow-hidden bg-black shadow-[0_2px_40px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.06)]"
              style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
            >
              <div className="aspect-video bg-neutral-950">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  muted={false}
                >
                  <source src="/g.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
              <p className="text-left text-[13px] sm:text-sm text-text-muted leading-snug max-w-md">
                No audio? Check the speaker icon on the player and your device volume.
              </p>
              <button
                type="button"
                onClick={playWithSound}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] sm:text-sm font-medium text-text-primary bg-white border border-black/[0.08] shadow-sm hover:bg-neutral-50 hover:border-black/[0.12] transition-colors active:scale-[0.99]"
              >
                <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                Play with sound
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md sm:max-w-none mx-auto"
          >
            <button
              type="button"
              onClick={copyPageLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[15px] font-medium text-text-primary bg-white border border-black/[0.1] shadow-sm hover:border-black/[0.18] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[15px] font-medium text-white bg-[#1d1d1f] hover:bg-black transition-colors shadow-sm"
            >
              Get started
              <svg className="w-4 h-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>

          <p className="mt-10 text-center text-[12px] text-text-dim max-w-lg mx-auto leading-relaxed">
            Sharing from email? UTM tags (e.g.{" "}
            <code className="text-text-muted font-mono text-[11px] bg-white/80 px-1.5 py-0.5 rounded-md border border-black/[0.06]">
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
