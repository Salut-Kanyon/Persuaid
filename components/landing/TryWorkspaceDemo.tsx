"use client";

/**
 * Landing demo: mirrors the signed-in workspace layout (Header + Workspace panels).
 * Left column: What to say next (top) + Live transcript (bottom). Right: Notes.
 * Start Call / Pause lives in the header like the real app, not inside the transcript panel.
 */

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getClientIanaTimeZone } from "@/lib/client-timezone";
import { Section } from "@/components/ui/Section";
import { fetchApi } from "@/lib/api-fetch";

const MAX_NOTES = 1200;
const LISTEN_SECONDS = 60;
const CLIENT_AI_CAP = 2;

const COACHING_DEMO_INSIGHTS = [
  {
    label: "Strengths",
    text: "You kept the conversation moving and tied answers back to what they said—confidence reads even when you pause.",
  },
  {
    label: "Gaps to tighten",
    text: "Discovery on budget, timeline, and who signs could go one layer deeper so the next call isn’t a reset.",
  },
  {
    label: "Suggested follow-up",
    text: "Send a short recap with two options to advance; offer a focused call with whoever owns the outcome they hinted at.",
  },
] as const;

const COL_HEADER_DESC_LINES = "min-h-[2.25rem] line-clamp-2";
const MAIN_PANEL_FOLLOW =
  "min-h-[160px] max-h-[220px] sm:max-h-[240px] flex-1 overflow-y-auto overflow-x-hidden";
const MAIN_PANEL_TRANSCRIPT =
  "min-h-[140px] max-h-[200px] sm:max-h-[220px] flex-1 overflow-y-auto overflow-x-hidden";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

/** Demo chrome — moss/sage accents to match landing hero art (not neon teal) */
const demo = {
  bgPage: "#121210",
  bgElevated: "var(--bg-elevated)",
  bgPanel: "rgba(255,255,255,0.02)",
  text: "#F5F7F7",
  textSecondary: "#B7C0C0",
  textMuted: "#7E8888",
  accent: "#8aae96",
  accentHover: "#9db89a",
  accentGlow: "rgba(138, 174, 150, 0.14)",
  accentBorder: "rgba(122, 150, 130, 0.32)",
  /** Outlines for inputs & action controls */
  actionBorder: "rgba(122, 150, 130, 0.45)",
  border: "rgba(255,255,255,0.08)",
  btnText: "#121210",
} as const;

type Speaker = "rep" | "prospect";

interface Line {
  speaker: Speaker;
  text: string;
}

function getSpeechRecognitionCtor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type TryWorkspaceDemoProps = {
  /** Controlled open state (e.g. trigger lives in Hero). Omit for self-contained demo with internal toggle. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Renders compact panel for the hero video slot (replaces carousel). */
  variant?: "default" | "heroSlot";
};

export function TryWorkspaceDemo({ open: openProp, onOpenChange, variant = "default" }: TryWorkspaceDemoProps) {
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [prospectDraft, setProspectDraft] = useState("");

  const [listening, setListening] = useState(false);
  const [listenLeft, setListenLeft] = useState(LISTEN_SECONDS);
  const listenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const coachingDemoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(0);

  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [notesLinkedToAi, setNotesLinkedToAi] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /** After pause: invite to preview post-call coaching (demo). */
  const [postCallInviteOpen, setPostCallInviteOpen] = useState(false);
  const [coachingDemoPhase, setCoachingDemoPhase] = useState<"idle" | "running" | "done">("idle");

  const linesRef = useRef(lines);
  const elapsedRef = useRef(elapsedSeconds);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setElapsedSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [listening]);

  const stopListenTimer = useCallback(() => {
    if (listenTimerRef.current) {
      clearInterval(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    const hadActivity =
      elapsedRef.current >= 3 || linesRef.current.length > 0;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
    stopListenTimer();
    setListenLeft(LISTEN_SECONDS);
    if (hadActivity) {
      setPostCallInviteOpen(true);
      setCoachingDemoPhase("idle");
    }
  }, [stopListenTimer]);

  const appendRepLine = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setLines((prev) => [...prev, { speaker: "rep", text: t }]);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    setAiError(null);
    setListenLeft(LISTEN_SECONDS);
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (ev: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript = ev.results[i][0]?.transcript?.trim();
        if (transcript) appendRepLine(transcript);
      }
    };

    rec.onerror = () => {
      setAiError("Mic stopped.");
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) {
        recognitionRef.current = null;
        setListening(false);
        stopListenTimer();
        setListenLeft(LISTEN_SECONDS);
      }
    };

    try {
      rec.start();
      setListening(true);
      setElapsedSeconds(0);
      setPostCallInviteOpen(false);
      setCoachingDemoPhase("idle");
      stopListenTimer();
      listenTimerRef.current = setInterval(() => {
        setListenLeft((s) => {
          if (s <= 1) {
            stopRecognition();
            return LISTEN_SECONDS;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      setAiError("Allow microphone access.");
    }
  }, [appendRepLine, stopListenTimer, stopRecognition]);

  useEffect(() => {
    return () => {
      stopListenTimer();
      if (coachingDemoTimeoutRef.current) {
        clearTimeout(coachingDemoTimeoutRef.current);
        coachingDemoTimeoutRef.current = null;
      }
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, [stopListenTimer]);

  const addProspectLine = useCallback(() => {
    const t = prospectDraft.trim();
    if (!t) return;
    setLines((prev) => [...prev, { speaker: "prospect", text: t }]);
    setProspectDraft("");
  }, [prospectDraft]);

  const fetchAi = useCallback(async () => {
    if (aiUsed >= CLIENT_AI_CAP) {
      setAiError("Limit reached.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchApi("/api/demo/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: lines.map((l) => ({
            speaker: l.speaker === "prospect" ? "prospect" : "user",
            text: l.text,
          })),
          notesContext: notes,
          mode: "answer",
          timeZone: getClientIanaTimeZone(),
        }),
      });
      const data = (await res.json()) as { text?: string; sourceType?: string; error?: string; code?: string };
      if (!res.ok) {
        if (res.status === 429 || data.code === "DEMO_LIMIT") {
          setAiUsed(CLIENT_AI_CAP);
          setAiError(data.error ?? "Limit reached.");
        } else {
          setAiError(data.error ?? "Error.");
        }
        return;
      }
      setAiText(data.text ?? "");
      setAiUsed((u) => Math.min(CLIENT_AI_CAP, u + 1));
    } catch {
      setAiError("Network error.");
    } finally {
      setAiLoading(false);
    }
  }, [aiUsed, lines, notes]);

  const runCoachingDemo = useCallback(() => {
    setCoachingDemoPhase("running");
    if (coachingDemoTimeoutRef.current) clearTimeout(coachingDemoTimeoutRef.current);
    coachingDemoTimeoutRef.current = setTimeout(() => {
      coachingDemoTimeoutRef.current = null;
      setCoachingDemoPhase("done");
    }, 1500);
  }, []);

  const dismissPostCallInvite = useCallback(() => {
    if (coachingDemoTimeoutRef.current) {
      clearTimeout(coachingDemoTimeoutRef.current);
      coachingDemoTimeoutRef.current = null;
    }
    setPostCallInviteOpen(false);
    setCoachingDemoPhase("idle");
  }, []);

  const aiRemaining = Math.max(0, CLIENT_AI_CAP - aiUsed);
  const canGetAnswer = lines.length > 0 && aiRemaining > 0 && !aiLoading;
  const getAnswerDisabled = aiLoading || aiRemaining <= 0 || lines.length === 0;
  const hasTranscript = lines.length > 0;
  const hasResponse = Boolean(aiText && aiText.length > 0);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined && onOpenChange !== undefined;
  const demoOpen = isControlled ? openProp : uncontrolledOpen;
  const setDemoOpen = isControlled ? onOpenChange! : setUncontrolledOpen;

  const isHero = variant === "heroSlot";

  const motionProps = isHero
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      }
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      };

  const inner = (
      <motion.div
        {...motionProps}
        className={cn(
          "mx-auto relative z-10",
          isHero ? "max-w-[88rem] w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6" : "max-w-5xl px-4 sm:px-6"
        )}
      >
        {!isControlled && !isHero && (
          <button
            type="button"
            onClick={() => setDemoOpen(!demoOpen)}
            aria-expanded={demoOpen}
            className={cn(
              "w-full flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors",
              "border-[rgba(255,255,255,0.1)] bg-[#0B0D0D] hover:bg-[rgba(255,255,255,0.03)]",
              demoOpen && "mb-8"
            )}
          >
            <span className="text-base font-semibold tracking-tight" style={{ color: demo.text }}>
              Try it now for free
            </span>
            <svg
              className={cn("h-5 w-5 shrink-0 text-[#7E8888] transition-transform duration-300", demoOpen && "rotate-180")}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isHero ? "grid-rows-[1fr]" : demoOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className={cn(isHero ? "min-h-0" : "overflow-hidden min-h-0")}>
            <header
              className={cn(
                "text-center mx-auto text-balance",
                isHero ? "mb-6 md:mb-8 max-w-3xl" : "mb-8 md:mb-10 max-w-2xl"
              )}
            >
              <h2
                className={cn(
                  "font-semibold tracking-[-0.03em] leading-[1.15]",
                  isHero
                    ? "text-[1.35rem] sm:text-2xl md:text-3xl lg:text-[2rem]"
                    : "text-xl sm:text-2xl md:text-[1.75rem]"
                )}
                style={{ color: demo.text }}
              >
                {isHero ? "See it in action" : "Try the demo"}
              </h2>
              {!isHero && (
                <p
                  className="mt-2 md:mt-2.5 text-sm md:text-[15px] leading-relaxed"
                  style={{ color: demo.textMuted }}
                >
                  Real-time lines from your playbook. No layout tour—just use it.
                </p>
              )}
            </header>

        <div
          className={cn(
            "border overflow-hidden",
            isHero
              ? "border-stone-600/25 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] rounded-[18px] lg:rounded-[20px]"
              : "border-white/10 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] rounded-[18px]"
          )}
          style={{ backgroundColor: demo.bgElevated }}
        >
          {/* Matches components/app/Header.tsx */}
          <div className="h-12 sm:h-14 flex items-center justify-between gap-3 px-4 sm:px-5 bg-background-elevated/35 backdrop-blur-2xl border-b border-border/10">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      listening ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-text-dim/50"
                    )}
                  />
                  {listening && (
                    <div className="absolute inset-0 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping opacity-60" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap">
                  {listening ? "Recording" : "Paused"}
                </span>
              </div>
              <div className="h-3.5 w-px bg-border/12 shrink-0" />
              <span className="text-xs sm:text-sm text-text-muted/80 font-mono tracking-wider tabular-nums">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => (listening ? stopRecognition() : startListening())}
              disabled={!listening && speechSupported === false}
              className={cn(
                "group relative overflow-hidden rounded-lg px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold tracking-tight transition-colors duration-200 flex items-center gap-1.5 shrink-0",
                listening
                  ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15 shadow-sm"
                  : "border border-stone-500/40 bg-[color:var(--landing-moss)] text-stone-100 hover:bg-[color:var(--landing-moss-hover)] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              )}
            >
              {listening ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <span className="relative z-[1]">Start Call</span>
                  <span
                    className="relative z-[1] inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300/35"
                    aria-hidden
                  />
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {postCallInviteOpen && !listening ? (
              <motion.div
                key="post-call-coaching-invite"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-stone-800/40 to-[#050505]"
              >
                <div className="px-3 py-3 sm:px-4 sm:py-3.5">
                  {coachingDemoPhase === "idle" ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-dim">
                          After the call
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-primary leading-snug">
                          Preview post-call coaching
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
                          Sample debrief from this session—no signup.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:shrink-0">
                        <button
                          type="button"
                          onClick={runCoachingDemo}
                          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-transparent bg-[#20D3A6] px-4 py-2 text-[13px] font-semibold text-[#04110D] shadow-[0_4px_24px_rgba(32,211,166,0.22)] transition-[filter,transform] hover:brightness-[1.05] active:scale-[0.99]"
                        >
                          Run coaching demo
                        </button>
                        <button
                          type="button"
                          onClick={dismissPostCallInvite}
                          className="text-center text-[12px] font-medium text-text-muted underline-offset-2 hover:text-text-secondary hover:underline sm:px-2"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : coachingDemoPhase === "running" ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6 sm:py-8">
                      <div className="h-9 w-9 rounded-full border-2 border-green-primary/30 border-t-green-primary animate-spin" />
                      <p className="text-sm font-medium text-text-primary">Analyzing your transcript…</p>
                      <p className="max-w-md text-center text-[12px] text-text-muted">
                        In the app, this runs on the full saved call.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-green-accent/90">
                            Coaching preview
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-text-primary">
                            Debrief for this demo session
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={dismissPostCallInvite}
                          className="self-start text-[12px] font-medium text-text-muted underline-offset-2 hover:text-text-secondary hover:underline"
                        >
                          Close
                        </button>
                      </div>
                      <ul className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                        {COACHING_DEMO_INSIGHTS.map((row, i) => (
                          <motion.li
                            key={row.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.06 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2.5"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-primary/90">
                              {row.label}
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{row.text}</p>
                          </motion.li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-text-dim">
                        <a
                          href="/sign-in"
                          className="font-medium text-green-accent underline-offset-2 hover:underline"
                        >
                          Sign in
                        </a>{" "}
                        for real coaching on every saved conversation.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Matches Workspace default layout: left stack (follow-up, transcript), right notes */}
          <div className="p-3 sm:p-4 bg-[#050505] border-t border-white/[0.04]">
            <div
              className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 lg:items-stretch",
                isHero ? "min-h-[min(48vh,440px)] lg:min-h-[380px]" : "min-h-[min(72vh,560px)] lg:min-h-[480px]"
              )}
            >
              <div className="flex flex-col gap-3 min-h-0">
                {/* What to say next — FollowUp panel */}
                <motion.div
                  className="flex flex-col flex-1 min-h-0 rounded-2xl border border-white/10 bg-background-surface/28 overflow-hidden"
                  animate={
                    notesLinkedToAi
                      ? {
                          boxShadow: [
                            `0 0 0 0 ${demo.accentGlow}`,
                            `0 0 24px -8px ${demo.accentGlow}`,
                            `0 0 0 0 ${demo.accentGlow}`,
                          ],
                        }
                      : { boxShadow: "none" }
                  }
                  transition={{ duration: 1.2, times: [0, 0.5, 1] }}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-green-primary/20 bg-green-primary/10">
                    <div className="w-6 h-6 rounded-xl bg-green-primary/20 border border-green-primary/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary tracking-tight">What to say next</h3>
                  </div>
                  <div className="flex flex-col flex-1 min-h-0 p-3">
                    <p
                      className={cn("text-[11px] sm:text-xs mb-2", COL_HEADER_DESC_LINES)}
                      style={{ color: demo.textMuted }}
                    >
                      Tap Get answer. Pulls from your notes and the transcript.
                    </p>
                    <div
                      className={cn(
                        MAIN_PANEL_FOLLOW,
                        "rounded-xl px-3 py-2.5 text-[13px] leading-relaxed mb-3 border transition-[border-color,box-shadow] duration-300"
                      )}
                      style={{
                        color: demo.text,
                        backgroundColor: demo.bgPanel,
                        borderColor: hasResponse ? demo.accentBorder : demo.actionBorder,
                        boxShadow: hasResponse ? "0 0 28px -14px rgba(32, 211, 166, 0.12)" : undefined,
                      }}
                    >
                      {aiLoading ? (
                        <span className="animate-pulse" style={{ color: demo.textSecondary }}>
                          …
                        </span>
                      ) : hasResponse ? (
                        <p className="whitespace-pre-wrap">{aiText}</p>
                      ) : (
                        <span style={{ color: demo.textMuted }}>
                          Your next line appears here.
                        </span>
                      )}
                    </div>
                    {aiError ? (
                      <p className="text-[11px] mb-2" style={{ color: "rgb(248 113 113 / 0.95)" }}>
                        {aiError}
                      </p>
                    ) : null}
                    <div className="mt-auto space-y-2">
                      <motion.button
                        type="button"
                        onClick={fetchAi}
                        disabled={getAnswerDisabled}
                        whileHover={canGetAnswer ? { scale: 1.02 } : {}}
                        whileTap={canGetAnswer ? { scale: 0.98 } : {}}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className={cn(
                          "w-full min-h-[40px] rounded-lg border py-2.5 text-[13px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed",
                          getAnswerDisabled && !aiLoading
                            ? "border-white/[0.08] bg-[#0a0c0c] text-[#7E8888] opacity-90"
                            : "border-transparent bg-[#20D3A6] text-[#04110D] hover:bg-[#19BE95] shadow-[0_4px_24px_rgba(32,211,166,0.18)]"
                        )}
                      >
                        {aiRemaining <= 0 ? "Limit reached" : aiLoading ? "…" : "Get answer"}
                      </motion.button>
                      <p className="text-center tabular-nums text-[10px]" style={{ color: demo.textMuted }}>
                        {aiRemaining}/{CLIENT_AI_CAP} demo replies ·{" "}
                        <a
                          href="/sign-in"
                          className="font-medium underline-offset-2 hover:underline"
                          style={{ color: demo.textSecondary }}
                        >
                          Full app
                        </a>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Live transcript */}
                <motion.div
                  className={cn(
                    "flex flex-col flex-1 min-h-0 rounded-2xl border border-white/10 bg-background-surface/28 overflow-hidden",
                    listening && "ring-1 ring-green-primary/20"
                  )}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/20">
                    <svg className="w-4 h-4 text-amber-500/80 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                    </svg>
                    <h3 className="text-sm font-medium text-text-primary tracking-tight">Live transcript</h3>
                  </div>
                  <div className="flex flex-col flex-1 min-h-0 p-3">
                    <p className={cn("text-[11px] sm:text-xs mb-2", COL_HEADER_DESC_LINES)} style={{ color: demo.textMuted }}>
                      Start Call to capture audio, or type a prospect line below.
                    </p>
                    <div
                      className={cn(
                        MAIN_PANEL_TRANSCRIPT,
                        "rounded-xl px-3 py-2.5 text-[12px] leading-relaxed mb-3 border md:text-[13px]"
                      )}
                      style={{
                        backgroundColor: demo.bgPanel,
                        borderColor: hasTranscript ? demo.accentBorder : demo.actionBorder,
                        color: demo.textSecondary,
                        boxShadow: hasTranscript ? `0 0 0 1px ${demo.accentGlow}` : undefined,
                      }}
                    >
                      {!hasTranscript ? (
                        <span style={{ color: demo.textMuted }}>Transcript lines appear here.</span>
                      ) : (
                        lines.map((l, i) => (
                          <p key={i} className="mb-1.5 last:mb-0">
                            <span
                              className="font-medium"
                              style={{ color: l.speaker === "rep" ? demo.accent : demo.textMuted }}
                            >
                              {l.speaker === "rep" ? "You" : "Other"}
                            </span>{" "}
                            <span style={{ color: demo.textSecondary }}>{l.text}</span>
                          </p>
                        ))
                      )}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <input
                        value={prospectDraft}
                        onChange={(e) => setProspectDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProspectLine())}
                        placeholder="Other speaker line (optional)"
                        className="min-w-0 flex-1 rounded-lg border border-border/50 bg-background-elevated/60 px-3 py-2 text-[12px] text-text-primary placeholder:text-text-dim/50 focus:outline-none focus:ring-1 focus:ring-green-primary/40 md:text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={addProspectLine}
                        className="shrink-0 rounded-lg border border-green-primary/30 bg-green-primary/10 px-3 py-2 text-[12px] font-medium text-green-300 hover:bg-green-primary/15 md:text-[13px]"
                      >
                        Add
                      </button>
                    </div>
                    {speechSupported === false && (
                      <p className="mt-2 text-[10px]" style={{ color: demo.textMuted }}>
                        Mic capture: use Chrome or Edge for Start Call.
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Notes — matches Notes panel column */}
              <motion.div
                className="flex flex-col min-h-[280px] lg:min-h-0 rounded-2xl border border-white/10 bg-background-surface/18 overflow-hidden"
                animate={
                  notesLinkedToAi
                    ? {
                        boxShadow: [
                          `0 0 0 0 ${demo.accentGlow}`,
                          `0 0 28px -10px ${demo.accentGlow}`,
                          `0 0 0 0 ${demo.accentGlow}`,
                        ],
                      }
                    : { boxShadow: "none" }
                }
                transition={{ duration: 1.2, delay: 0.08, times: [0, 0.5, 1] }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/20">
                  <div className="w-6 h-6 rounded-xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary tracking-tight">Notes</h3>
                </div>
                <div className="flex flex-col flex-1 min-h-0 p-3">
                  <p className={cn("text-[11px] sm:text-xs mb-2", COL_HEADER_DESC_LINES)} style={{ color: demo.textMuted }}>
                    Your playbook: pricing, objections, talk tracks.
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                    placeholder="Paste notes, bullets, or snippets you would use on a real call…"
                    className={cn(
                      "w-full flex-1 min-h-[200px] lg:min-h-0 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed resize-none border transition-[border-color,box-shadow] duration-200",
                      "placeholder:text-text-dim/60 focus:outline-none focus:ring-1 focus:ring-green-primary/35 md:text-[14px]"
                    )}
                    style={{
                      color: demo.text,
                      backgroundColor: demo.bgPanel,
                      borderColor: notesLinkedToAi ? demo.accentBorder : "rgba(255,255,255,0.12)",
                    }}
                  />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="tabular-nums text-[11px]" style={{ color: demo.textMuted }}>
                      {notes.length}/{MAX_NOTES}
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => setNotesLinkedToAi(true)}
                      disabled={notesLinkedToAi}
                      whileHover={notesLinkedToAi ? undefined : { scale: 1.02 }}
                      whileTap={notesLinkedToAi ? undefined : { scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className={cn(
                        "inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-medium sm:w-auto",
                        notesLinkedToAi
                          ? "cursor-default border border-green-primary/35 bg-green-primary/12 text-green-300"
                          : "border border-green-primary/40 bg-green-primary/10 text-green-300 hover:bg-green-primary/16"
                      )}
                    >
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-green-primary/40 text-[10px]"
                      >
                        {notesLinkedToAi ? "✓" : "↗"}
                      </span>
                      {notesLinkedToAi ? "Connected" : "Connect with AI"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

            <p
              className={cn("text-center text-[11px] leading-relaxed", isHero ? "mt-5 md:mt-6" : "mt-6 md:mt-8")}
              style={{ color: demo.textMuted }}
            >
              Browser demo · {CLIENT_AI_CAP} replies / day
            </p>
          </div>
        </div>
      </motion.div>
  );

  return createElement(isHero ? "div" : Section, {
    className: isHero
      ? "w-full overflow-visible rounded-2xl border border-white/12 bg-[#050505] shadow-2xl ring-1 ring-white/5"
      : cn(
          "relative overflow-hidden bg-[#050505]",
          isControlled && !demoOpen && "py-0 border-0",
          isControlled && demoOpen && "py-14 md:py-20 border-y border-[rgba(255,255,255,0.06)]",
          !isControlled && "border-y border-[rgba(255,255,255,0.06)]",
          !isControlled && (demoOpen ? "py-16 md:py-24" : "py-10 md:py-12")
        ),
    children: inner,
  });
}
