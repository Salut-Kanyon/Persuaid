"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import {
  MarketingHeroHeadlineDivider,
  marketingHeroSubtitleClassName,
  marketingHeroTitleClassName,
} from "@/components/ui/marketing-landing-art";
import { TUTORIAL_VIDEO_SRC } from "@/lib/tutorial-video";
import { cn } from "@/lib/utils";

export default function TutorialPage() {
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
