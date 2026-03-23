"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const THUMB_SRC = "/LandingVid/Thumbnail.png";
/** Same path when you swap the file on disk — bump `v` so browsers load the new binary. */
const VIDEO_SRC = "/LandingVid/newv.mp4?v=2";
const CAPTIONS_SRC = "/LandingVid/captions.vtt";

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

type Props = {
  show: boolean;
};

export function LandingHeroVideo({ show }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"thumbnail" | "video">("thumbnail");
  const [countdown, setCountdown] = useState(5);
  const [expanded, setExpanded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [needsSoundHint, setNeedsSoundHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  const startVideo = useCallback(
    (opts?: { userGesture?: boolean }) => {
      clearTimers();
      setPhase("video");
      const v = videoRef.current;
      if (!v) return;
      v.playbackRate = playbackRateRef.current;
      if (!opts?.userGesture) {
        v.muted = true;
        setNeedsSoundHint(true);
      } else {
        v.muted = false;
        setNeedsSoundHint(false);
      }
      void v.play().catch(() => {
        setNeedsSoundHint(true);
      });
    },
    [clearTimers]
  );

  const startVideoRef = useRef(startVideo);
  startVideoRef.current = startVideo;

  /** Reset when hero CTAs appear */
  useEffect(() => {
    if (!show) {
      clearTimers();
      setPhase("thumbnail");
      setCountdown(5);
      setExpanded(false);
      videoRef.current?.pause();
      return;
    }
    setPhase("thumbnail");
    setCountdown(5);
    clearTimers();

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      startVideoRef.current({ userGesture: false });
    }, 5000);

    return clearTimers;
  }, [show, clearTimers]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = playbackRate;
  }, [playbackRate, phase]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      const t = v.textTracks[0];
      if (t) t.mode = captionsOn ? "showing" : "hidden";
    };
    sync();
    v.addEventListener("loadedmetadata", sync);
    return () => v.removeEventListener("loadedmetadata", sync);
  }, [captionsOn, phase]);

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

  const onThumbClick = () => {
    startVideo({ userGesture: true });
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(playbackRate as (typeof SPEEDS)[number]);
    const next = SPEEDS[(i + 1) % SPEEDS.length];
    setPlaybackRate(next);
  };

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
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={THUMB_SRC}
          className={cn(
            "absolute inset-0 h-full w-full object-contain transition-opacity duration-500",
            phase === "video" ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
          )}
          playsInline
          preload="auto"
          controls={phase === "video"}
          controlsList="nodownload"
        >
          <track kind="captions" srcLang="en" label="English" src={CAPTIONS_SRC} default />
        </video>

        <AnimatePresence>
          {phase === "thumbnail" && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-[2] flex flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              onClick={onThumbClick}
              aria-label="Play video now"
            >
              <img
                src={THUMB_SRC}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20"
                aria-hidden
              />
              <div className="relative z-[1] flex flex-col items-center gap-4 px-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-2 ring-white/25 backdrop-blur-md transition-transform hover:scale-105">
                  <svg className="ml-1 h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight text-white sm:text-lg">
                    Watch the product tour
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    {countdown > 0 ? (
                      <>
                        Starts in <span className="tabular-nums font-mono font-semibold text-emerald-300">{countdown}</span>s — or tap to play now
                      </>
                    ) : (
                      "Starting…"
                    )}
                  </p>
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {phase === "video" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] flex justify-end gap-2 p-2 sm:p-3">
            <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCaptionsOn((c) => !c)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-md transition-colors",
                  captionsOn
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                    : "border-white/15 bg-black/50 text-white/80 hover:bg-black/70"
                )}
              >
                CC
              </button>
              <button
                type="button"
                onClick={cycleSpeed}
                className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] font-semibold tabular-nums text-white/90 backdrop-blur-md hover:bg-black/70"
                title="Playback speed"
              >
                {playbackRate}×
              </button>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md hover:bg-black/70"
                aria-expanded={expanded}
              >
                {expanded ? "Exit" : "Expand"}
              </button>
            </div>
          </div>
        )}

        {phase === "video" && needsSoundHint && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 z-[3] flex justify-center px-3 sm:bottom-16">
            <button
              type="button"
              className="pointer-events-auto rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-black/85"
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                v.muted = false;
                setNeedsSoundHint(false);
                void v.play();
              }}
            >
              Tap for sound
            </button>
          </div>
        )}
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
      {!expanded && (
        <p className="mt-3 text-center text-sm font-semibold tracking-tight text-white/60">
          Video tutorial
        </p>
      )}
    </motion.div>
  );
}
