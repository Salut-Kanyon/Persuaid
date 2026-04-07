"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";

/** Same path when you swap the file on disk — bump `v` so browsers load the new binary. */
const VIDEO_SRC = "/Last Video.mp4?v=1";

type AiStage = "question" | "thinking" | "answer";

type Props = {
  show: boolean;
};

export function LandingHeroVideo({ show }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const [aiOverlayVisible, setAiOverlayVisible] = useState(false);
  const [aiStage, setAiStage] = useState<AiStage>("question");
  const [pkScrollToObjections, setPkScrollToObjections] = useState(false);
  const [pkHighlight, setPkHighlight] = useState<"pricing" | null>(null);
  const [pkViewportH, setPkViewportH] = useState(92);
  const [dimVideo, setDimVideo] = useState(false);
  const transcriptTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setPkViewportH(mq.matches ? 68 : 92);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const questionLabel = "Question";
  const questionTextBetter =
    "What are the typical pricing models for the insurance you offer—and roughly how much coverage does each include?";
  const answerTextBetter =
    "We usually frame it as simple tiers based on coverage amount and term length. For example: Starter covers around $250k, Standard around $500k, and Plus up to $1M—then we confirm age/health class and term to quote the closest fit.";

  const startVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 1;
    v.muted = true;
    void v.play().catch(() => {});
  }, []);

  const startVideoRef = useRef(startVideo);
  startVideoRef.current = startVideo;

  /** Reset when hero CTAs appear */
  useEffect(() => {
    if (!show) {
      setExpanded(false);
      videoRef.current?.pause();
      setDimVideo(false);
      setAiOverlayVisible(false);
      setAiStage("question");
      setPkScrollToObjections(false);
      setPkHighlight(null);
      transcriptTimersRef.current.forEach((t) => clearTimeout(t));
      transcriptTimersRef.current = [];
      return;
    }
    setExpanded(false);
    void startVideoRef.current();

    return undefined;
  }, [show]);

  /** Darken the hero video slightly so the transcript reads easier — 5s after the slot is visible. */
  useEffect(() => {
    if (!show) return;
    setDimVideo(false);
    const t = window.setTimeout(() => setDimVideo(true), 5000);
    return () => window.clearTimeout(t);
  }, [show]);

  // Landing-only mock “Live AI transcript” overlay — short delays so the script reads soon after the hero video shows.
  useEffect(() => {
    transcriptTimersRef.current.forEach((t) => clearTimeout(t));
    transcriptTimersRef.current = [];

    if (!show) return;

    transcriptTimersRef.current.push(
      setTimeout(() => {
        setAiOverlayVisible(true);
        setAiStage("question");

        transcriptTimersRef.current.push(
          setTimeout(() => {
            setAiStage("thinking");
          }, 420),
        );

        transcriptTimersRef.current.push(
          setTimeout(() => {
            setAiStage("answer");
            setPkScrollToObjections(true);

            transcriptTimersRef.current.push(
              setTimeout(() => {
                setPkHighlight("pricing");
              }, 380),
            );
          }, 1500),
        );
      }, 750),
    );

    return () => {
      transcriptTimersRef.current.forEach((t) => clearTimeout(t));
      transcriptTimersRef.current = [];
    };
  }, [show]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const shell = (
    <div
      ref={shellRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_40px_100px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.06]",
        expanded
          ? "fixed inset-4 z-[80] sm:inset-8 flex items-center justify-center bg-black/95"
          : "w-full"
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-black",
          expanded ? "aspect-video max-h-[calc(100vh-4rem)] max-w-[min(100%,1400px)]" : "aspect-video max-h-[min(68vh,720px)] min-h-[240px] sm:min-h-[280px]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-black/70" />
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-contain opacity-100"
          playsInline
          muted
          autoPlay
          preload="auto"
          loop
          controls={false}
        />

        <div
          className="pointer-events-none absolute inset-0 z-[2] rounded-2xl bg-black transition-opacity duration-[900ms] ease-out"
          style={{ opacity: dimVideo ? 0.42 : 0 }}
          aria-hidden
        />

        {/* Mock “Live transcript” overlay — compact on phones so it fits the hero frame */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-[3] flex justify-center px-1.5 pt-2 sm:px-3 sm:pt-4 transition-opacity duration-300"
          style={{ opacity: aiOverlayVisible ? 1 : 0 }}
          aria-hidden
        >
          <div className="w-full max-w-[min(100%,17.5rem)] origin-top scale-[0.88] sm:max-w-[28rem] sm:scale-95 md:max-w-[32rem] md:scale-100">
            <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-lg sm:rounded-2xl">
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/20 sm:gap-2.5 sm:px-4 sm:py-3">
                <img
                  src={PERSUAID_MARK_PNG}
                  alt=""
                  className="h-5 w-5 shrink-0 object-contain brightness-0 invert opacity-90 sm:h-7 sm:w-7"
                  width={28}
                  height={28}
                />
                <h3 className="text-sm font-semibold text-text-primary tracking-tight sm:text-base">Persuaid</h3>
                <span className="ml-auto text-[10px] font-medium text-text-dim/75 sm:text-[11px]">Live</span>
              </div>

              <div className="px-2.5 py-2 space-y-1.5 sm:px-4 sm:py-3 sm:space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-dim/85 sm:text-[11px] sm:tracking-[0.16em]">
                    {questionLabel}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <span className="hidden text-[10px] text-text-dim/70 sm:inline">Enter</span>
                    <span
                      className={cn(
                        "inline-flex h-6 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 text-[10px] font-semibold text-white/90 sm:h-7 sm:rounded-lg sm:px-2.5 sm:text-[11px]",
                        aiStage === "thinking" ? "scale-[0.92] opacity-85" : "scale-100 opacity-100",
                      )}
                      style={{
                        transition: "transform 180ms ease, opacity 180ms ease",
                        transform: aiStage === "thinking" ? "translateY(1px) scale(0.92)" : "translateY(0px) scale(1)",
                      }}
                    >
                      ⏎
                    </span>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-white leading-[1.35] sm:text-[13px] sm:leading-snug md:text-[15px]">
                  {questionTextBetter}
                </p>

                {aiStage === "thinking" ? (
                  <p className="text-[10px] text-text-dim/90 italic leading-snug sm:text-xs">AI is thinking…</p>
                ) : null}

                {aiStage === "answer" ? (
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[10px] font-medium text-green-accent sm:text-xs">Answer</p>
                    <p className="text-[11px] text-text-primary/95 leading-relaxed sm:text-sm">{answerTextBetter}</p>
                  </div>
                ) : null}

                {aiStage === "answer" ? (
                  <div className="pt-0 sm:pt-0.5">
                    <div className="mb-0.5 flex items-center justify-between gap-2 sm:mb-1 sm:gap-3">
                      <p className="text-[9px] font-semibold text-text-dim/85 sm:text-[11px]">From product knowledge</p>
                      <p className="text-[9px] text-text-dim/70 sm:text-[11px]">
                        {pkHighlight === "pricing" ? "Highlighted" : "Scrolling…"}
                      </p>
                    </div>

                    <div
                      className="overflow-hidden rounded-lg border border-white/10 bg-black/20 sm:rounded-xl"
                      style={{ height: pkViewportH }}
                    >
                      <div
                        className="transition-transform duration-700 ease-in-out will-change-transform"
                        style={{
                          transform: pkScrollToObjections ? `translateY(-${pkViewportH}px)` : "translateY(0)",
                        }}
                      >
                        <div className="px-2 py-1.5 sm:px-3 sm:py-2" style={{ height: pkViewportH }}>
                          <p className="mt-0.5 text-[9px] text-text-secondary leading-tight sm:text-[11px]">
                            We price by coverage + term length. Typical tiers: Starter $39/mo ($250k / 10-year), Standard
                            $59/mo ($500k / 20-year), Plus $89/mo ($1M / 20-year). Confirm age + health class to finalize.
                          </p>
                        </div>
                        <div className="px-2 py-1.5 sm:px-3 sm:py-2" style={{ height: pkViewportH }}>
                          <p className="mt-0.5 text-[9px] text-text-secondary leading-tight sm:text-[11px]">
                            <span
                              className={cn(
                                "inline-block rounded-md px-1 py-0.5 transition-colors sm:px-1.5 sm:py-0.5",
                                pkHighlight === "pricing"
                                  ? "text-white bg-emerald-400/30 ring-1 ring-emerald-300/45 shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_12px_34px_rgba(16,185,129,0.16)]"
                                  : "text-text-secondary bg-transparent",
                              )}
                            >
                              Starter ≈ $250k, Standard ≈ $500k, Plus ≈ $1M — then match term length and quote the closest
                              tier.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <button
          type="button"
          className="absolute right-3 top-3 z-[90] rounded-full border border-white/20 bg-black/60 p-2 text-white/90 backdrop-blur-md hover:bg-black/80 sm:right-4 sm:top-4"
          onClick={() => setExpanded(false)}
          aria-label="Close expanded video"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 24 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "flex h-full w-full flex-1 flex-col mx-auto px-3 sm:px-4",
        expanded ? "relative z-[70] max-w-none" : "max-w-5xl xl:max-w-6xl"
      )}
    >
      {shell}
    </motion.div>
  );
}
