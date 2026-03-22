"use client";

/**
 * Landing demo: Persuaid value prop in one surface (context → talk → response).
 *
 * Design intent (maintenance):
 * - One elevated panel reads as a single product, not a 3-step wizard.
 * - Accent #20D3A6 matches primary CTAs (Start talking, Request answer) and outlines every
 *   field/control the user must use (type, click, talk) so affordances read as one system.
 * - Typography and spacing carry hierarchy; shell border stays neutral (white/8).
 * - Motion is entry + micro-interaction only — no decorative loops except listening pulse.
 */

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/Section";

const MAX_NOTES = 1200;
const LISTEN_SECONDS = 60;
const CLIENT_AI_CAP = 2;

/** Three columns share the same vertical bands on md+ (header → action row → main panel). */
const COL_HEADER_DESC_LINES = "min-h-[2.5rem] line-clamp-2";
const ACTION_BAND = "flex min-h-[5.5rem] shrink-0 flex-col justify-center gap-2";
const MAIN_PANEL_BOX =
  "h-[220px] min-h-[220px] overflow-y-auto overflow-x-hidden sm:h-[236px] sm:min-h-[236px] md:h-[240px] md:min-h-[240px]";

/** Persuaid demo palette (matches product marketing spec) */
const demo = {
  bgPage: "#050505",
  bgElevated: "#0B0D0D",
  bgPanel: "rgba(255,255,255,0.02)",
  text: "#F5F7F7",
  textSecondary: "#B7C0C0",
  textMuted: "#7E8888",
  accent: "#20D3A6",
  accentHover: "#19BE95",
  accentGlow: "rgba(32, 211, 166, 0.18)",
  accentBorder: "rgba(32, 211, 166, 0.28)",
  /** Outlines for inputs & action controls — same hue as Start talking / Request answer */
  actionBorder: "rgba(32, 211, 166, 0.52)",
  border: "rgba(255,255,255,0.08)",
  btnText: "#04110D",
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

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(0);

  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [notesLinkedToAi, setNotesLinkedToAi] = useState(false);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const stopListenTimer = useCallback(() => {
    if (listenTimerRef.current) {
      clearInterval(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
    stopListenTimer();
    setListenLeft(LISTEN_SECONDS);
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
      const res = await fetch("/api/demo/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: lines.map((l) => ({
            speaker: l.speaker === "prospect" ? "prospect" : "user",
            text: l.text,
          })),
          notesContext: notes,
          mode: "answer",
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
                Demo to see the intelligence
              </h2>
              <p
                className={cn(
                  "mt-2 md:mt-2.5 leading-relaxed",
                  isHero ? "text-sm sm:text-[15px]" : "text-sm md:text-[15px]"
                )}
                style={{ color: demo.textMuted }}
              >
                The real app is faster and more optimized.
              </p>
              <p
                className={cn(
                  "mt-4 text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase",
                  isHero && "mt-5"
                )}
              >
                <span style={{ color: demo.accent }}>Steps</span>
              </p>
            </header>

        {/*
          Unified demo surface: one rounded shell + CSS divide so columns feel connected.
          Desktop: 3 equal columns; mobile: stack with vertical rhythm.
        */}
        <div
          className={cn(
            "border backdrop-blur-[2px] overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
            isHero ? "rounded-[24px] lg:rounded-[28px]" : "rounded-[20px]"
          )}
          style={{
            backgroundColor: demo.bgElevated,
            borderColor: demo.border,
            boxShadow: `0 24px 80px -24px rgba(0,0,0,0.65)`,
          }}
        >
          <div className="relative h-[3px] bg-white/[0.04]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${demo.accent}, transparent)`,
                boxShadow: notesLinkedToAi ? `0 0 16px ${demo.accentGlow}` : "none",
              }}
              initial={false}
              animate={{ width: notesLinkedToAi ? "100%" : "0%" }}
              transition={{ type: "spring", stiffness: 140, damping: 24 }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 md:items-stretch md:divide-x md:divide-[rgba(255,255,255,0.08)]">
            {/* Context */}
            <motion.div
              className={cn(
                "flex min-h-0 flex-col border-b md:h-full md:border-b-0",
                isHero ? "p-6 md:p-8 lg:p-9" : "p-6 md:p-8"
              )}
              style={{ borderColor: demo.border }}
              animate={
                notesLinkedToAi
                  ? { boxShadow: [`0 0 0 0 ${demo.accentGlow}`, `0 0 28px -8px ${demo.accentGlow}`, `0 0 0 0 ${demo.accentGlow}`] }
                  : { boxShadow: "none" }
              }
              transition={{ duration: 1.2, times: [0, 0.5, 1] }}
            >
              <div className="mb-4 shrink-0">
                <h3 className="text-[15px] font-medium tracking-tight" style={{ color: demo.text }}>
                  Context
                </h3>
                <p
                  className={cn("mt-1 text-[12px] leading-snug md:text-[13px]", COL_HEADER_DESC_LINES)}
                  style={{ color: demo.textMuted }}
                >
                  Product knowledge — pricing, objections, notes
                </p>
              </div>

              <div className={ACTION_BAND} aria-hidden />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                placeholder="Example: pricing, common objections, competitor differences, who we help…"
                className={cn(
                  MAIN_PANEL_BOX,
                  "w-full shrink-0 rounded-[12px] px-3.5 py-3 text-[13px] leading-relaxed md:text-[14px] resize-none transition-[border-color,box-shadow] duration-200",
                  "placeholder:text-[#7E8888]/80 focus:outline-none"
                )}
                style={{
                  color: demo.text,
                  backgroundColor: demo.bgPanel,
                  border: `1px solid ${notesLinkedToAi ? demo.accentBorder : demo.actionBorder}`,
                  boxShadow: notesLinkedToAi ? `0 0 0 1px ${demo.accentGlow}` : undefined,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = demo.accent;
                  e.target.style.boxShadow = `0 0 0 1px ${demo.accentGlow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = notesLinkedToAi ? demo.accentBorder : demo.actionBorder;
                  e.target.style.boxShadow = notesLinkedToAi ? `0 0 0 1px ${demo.accentGlow}` : "none";
                }}
              />
              <div className="mt-auto flex flex-col gap-3 pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                      "inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-full px-4 text-[12px] font-medium tracking-tight transition-colors duration-200 sm:w-auto sm:min-w-0",
                      notesLinkedToAi
                        ? "cursor-default border border-[#20D3A6]/35 bg-[#20D3A6]/12 text-[#20D3A6]"
                        : "border border-[#20D3A6]/45 bg-[#20D3A6]/10 text-[#20D3A6] hover:border-[#20D3A6]/60 hover:bg-[#20D3A6]/16"
                    )}
                  >
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]"
                      style={{ borderColor: notesLinkedToAi ? demo.accent : "rgba(32, 211, 166, 0.45)" }}
                    >
                      {notesLinkedToAi ? "✓" : "↗"}
                    </span>
                    {notesLinkedToAi ? "Connected" : "Connect to AI"}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Talk */}
            <motion.div
              className={cn(
                "relative flex min-h-0 flex-col border-b md:h-full md:border-b-0 transition-shadow duration-300",
                isHero ? "p-6 md:p-8 lg:p-9" : "p-6 md:p-8",
                listening && "shadow-[inset_0_0_0_1px_rgba(32,211,166,0.15)]"
              )}
              style={{ borderColor: demo.border }}
              animate={
                listening
                  ? {
                      boxShadow: [
                        `inset 0 0 0 1px ${demo.accentBorder}`,
                        `inset 0 0 24px ${demo.accentGlow}`,
                        `inset 0 0 0 1px ${demo.accentBorder}`,
                      ],
                    }
                  : { boxShadow: "none" }
              }
              transition={listening ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            >
              <div className="mb-4 shrink-0">
                <h3 className="text-[15px] font-medium tracking-tight" style={{ color: demo.text }}>
                  Talk
                </h3>
                <p
                  className={cn("mt-1 text-[12px] leading-snug md:text-[13px]", COL_HEADER_DESC_LINES)}
                  style={{ color: demo.textMuted }}
                >
                  Live transcript — you or them
                </p>
              </div>

              <div className={ACTION_BAND}>
                {!listening ? (
                  <motion.button
                    type="button"
                    onClick={startListening}
                    disabled={speechSupported === false}
                    whileHover={{ scale: speechSupported === false ? 1 : 1.02 }}
                    whileTap={{ scale: speechSupported === false ? 1 : 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="w-full min-h-[44px] rounded-full bg-[#20D3A6] py-3 text-[14px] font-semibold tracking-tight text-[#04110D] shadow-[0_8px_32px_rgba(32,211,166,0.18)] transition-colors hover:bg-[#19BE95] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#20D3A6]"
                  >
                    Start talking
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={stopRecognition}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="w-full min-h-[44px] rounded-full border border-red-500/45 bg-gradient-to-b from-red-500 to-red-600 py-3 text-[14px] font-semibold tracking-tight text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] transition-[filter,box-shadow] duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-[0_6px_24px_rgba(220,38,38,0.4)] active:brightness-95"
                  >
                    Stop · {String(Math.floor(listenLeft / 60)).padStart(2, "0")}:{String(listenLeft % 60).padStart(2, "0")}
                  </motion.button>
                )}
                <p className="text-center text-[11px] leading-snug" style={{ color: demo.textMuted }}>
                  Try: <span style={{ color: demo.textSecondary }}>&ldquo;Too expensive&rdquo;</span>
                </p>
              </div>

              <div
                className={cn(
                  MAIN_PANEL_BOX,
                  "mb-4 shrink-0 rounded-[12px] px-3.5 py-3 text-[12px] leading-relaxed transition-[border-color] duration-300 md:text-[13px]"
                )}
                style={{
                  backgroundColor: demo.bgPanel,
                  border: `1px solid ${hasTranscript ? demo.accentBorder : demo.actionBorder}`,
                  color: demo.textSecondary,
                  ...(hasTranscript ? { boxShadow: `0 0 0 1px ${demo.accentGlow}` } : {}),
                }}
              >
                {!hasTranscript ? (
                  <span style={{ color: demo.textMuted }}>Live lines appear here.</span>
                ) : (
                  lines.map((l, i) => (
                    <p key={i} className="mb-1.5 last:mb-0">
                      <span
                        className="font-medium"
                        style={{ color: l.speaker === "rep" ? demo.accent : demo.textMuted }}
                      >
                        {l.speaker === "rep" ? "You" : "Them"}
                      </span>{" "}
                      <span style={{ color: demo.textSecondary }}>{l.text}</span>
                    </p>
                  ))
                )}
              </div>

              <div className="mt-auto flex gap-2 pt-3">
                <input
                  value={prospectDraft}
                  onChange={(e) => setProspectDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProspectLine())}
                  placeholder="Their line (optional)"
                  className="min-w-0 flex-1 rounded-full border border-[rgba(32,211,166,0.52)] bg-[#050505] px-3 py-2 text-[12px] text-[#B7C0C0] transition-colors placeholder:text-[#7E8888]/80 focus:border-[#20D3A6] focus:outline-none focus:ring-1 focus:ring-[#20D3A6]/35 md:text-[13px]"
                />
                <button
                  type="button"
                  onClick={addProspectLine}
                  className="shrink-0 rounded-full border border-[rgba(32,211,166,0.52)] bg-transparent px-3 py-2 text-[12px] font-medium text-[#20D3A6] transition-colors hover:border-[#20D3A6]/70 hover:bg-[#20D3A6]/10 md:text-[13px]"
                >
                  Add
                </button>
              </div>
              {speechSupported === false && (
                <p className="mt-2 text-[10px]" style={{ color: demo.textMuted }}>
                  Mic: Chrome or Edge
                </p>
              )}
            </motion.div>

            {/* Response */}
            <motion.div
              className={cn("flex min-h-0 flex-col md:h-full", isHero ? "p-6 md:p-8 lg:p-9" : "p-6 md:p-8")}
              animate={
                notesLinkedToAi
                  ? { boxShadow: [`0 0 0 0 ${demo.accentGlow}`, `0 0 32px -10px ${demo.accentGlow}`, `0 0 0 0 ${demo.accentGlow}`] }
                  : { boxShadow: "none" }
              }
              transition={{ duration: 1.2, delay: 0.15, times: [0, 0.5, 1] }}
            >
              <div className="mb-4 shrink-0">
                <h3 className="text-[15px] font-medium tracking-tight" style={{ color: demo.text }}>
                  Response
                </h3>
                <p
                  className={cn("mt-1 text-[12px] leading-snug md:text-[13px]", COL_HEADER_DESC_LINES)}
                  style={{ color: demo.textMuted }}
                >
                  {notesLinkedToAi ? "Notes + live talk → reply" : "Notes + talk → suggested reply"}
                </p>
              </div>

              <div className={ACTION_BAND} aria-hidden />

              <div
                className={cn(
                  MAIN_PANEL_BOX,
                  "mb-4 shrink-0 rounded-[12px] px-3.5 py-3 text-[13px] leading-relaxed transition-[border-color,box-shadow] duration-300 md:text-[14px]"
                )}
                style={{
                  color: demo.text,
                  backgroundColor: demo.bgPanel,
                  border: `1px solid ${hasResponse ? demo.accentBorder : demo.actionBorder}`,
                  ...(hasResponse ? { boxShadow: "0 0 28px -14px rgba(32, 211, 166, 0.12)" } : {}),
                }}
              >
                {aiLoading ? (
                  <span className="animate-pulse" style={{ color: demo.textSecondary }}>
                    …
                  </span>
                ) : hasResponse ? (
                  <p className="whitespace-pre-wrap">{aiText}</p>
                ) : (
                  <span style={{ color: demo.textMuted }}>Suggested reply</span>
                )}
              </div>

              {aiError && (
                <p className="text-[12px] mb-3" style={{ color: "rgb(248 113 113 / 0.95)" }}>
                  {aiError}
                </p>
              )}

              <div className="mt-auto flex flex-col gap-3">
                <motion.button
                  type="button"
                  onClick={fetchAi}
                  disabled={getAnswerDisabled}
                  whileHover={canGetAnswer ? { scale: 1.02 } : {}}
                  whileTap={canGetAnswer ? { scale: 0.98 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className={cn(
                    "w-full min-h-[44px] rounded-full border py-3 text-[14px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed",
                    getAnswerDisabled && !aiLoading
                      ? "border-[rgba(255,255,255,0.08)] bg-[#0a0c0c] text-[#7E8888] opacity-90 ring-1 ring-white/[0.06]"
                      : "border-transparent bg-[#20D3A6] text-[#04110D] hover:bg-[#19BE95] shadow-[0_4px_24px_rgba(32,211,166,0.18)]"
                  )}
                >
                  {aiRemaining <= 0 ? "Limit reached" : aiLoading ? "…" : "Request answer"}
                </motion.button>

                {lines.length === 0 && aiRemaining > 0 && (
                  <p className="text-center text-[10px] leading-relaxed" style={{ color: demo.textMuted }}>
                    Add a line in Talk first.
                  </p>
                )}

                <p className="text-center tabular-nums text-[10px]" style={{ color: demo.textMuted }}>
                  {aiRemaining}/{CLIENT_AI_CAP} demo replies ·{" "}
                  <a href="/sign-in" className="font-medium underline-offset-2 hover:underline" style={{ color: demo.textSecondary }}>
                    Full app
                  </a>
                </p>
              </div>
            </motion.div>
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
