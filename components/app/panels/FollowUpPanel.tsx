"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";
import { cn } from "@/lib/utils";

const DEBUG = process.env.NODE_ENV !== "production";

function normalizeForCompare(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.?!…]+$/g, "");
}

/** True when text should not be shown as the main Answer (coaching question, empty, or duplicate of follow-up). */
function isBadAnswer(text: string, ctx?: { compareToSuggested?: string }): boolean {
  const t = text.trim();
  if (!t || t === "…") return true;

  const lower = t.toLowerCase();

  const coachingStarts = [
    "how does your current understanding",
    "how does your understanding",
    "can you tell me more",
    "would you like",
    "are you interested",
    "do you want to learn more",
  ];
  if (coachingStarts.some((p) => lower.startsWith(p))) return true;

  if (ctx?.compareToSuggested) {
    const sug = ctx.compareToSuggested.trim();
    if (sug && sug !== "…") {
      const a = normalizeForCompare(t);
      const b = normalizeForCompare(sug);
      if (a.length > 12 && b.length > 12) {
        if (a === b) return true;
        const n = Math.min(48, a.length, b.length);
        if (n >= 12 && a.slice(0, n) === b.slice(0, n)) return true;
        if (a.length <= 90 && b.length <= 90 && (a.includes(b) || b.includes(a))) return true;
      }
    }
  }

  // Short reflective-coaching questions (not domain “is this covered?” style)
  if (t.endsWith("?")) {
    const words = t.split(/\s+/).length;
    if (words <= 22) {
      const reflective =
        /\b(your (current )?understanding|your decision|decision-making|affect your|help you think|walk me through your thought)\b/i.test(
          t
        );
      const startsCoachy = /^(how does|why does|what would|can you|could you|would you|are you|do you)\b/i.test(t);
      if (reflective && startsCoachy) return true;
    }
  }

  return false;
}

/** Max N sentences; does not strip declarative content (used when sanitizeAnswer over-strips). */
function truncateToMaxSentences(raw: string, max: number): string {
  const t = raw.trim().replace(/\s+/g, " ");
  const parts = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return t;
  return parts.slice(0, max).join(" ").trim();
}

/** Strip salesy follow-up questions from the answer; keep 1–3 concise sentences, declarative only. */
function sanitizeAnswer(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return t;

  const softPitch =
    /^(are you interested|would you like|can you tell me|do you want|shall we|how does that sound|want to know more|anything else|what questions do you have|is there anything|does that help|sound good)/i;
  const softPitchAnywhere =
    /are you interested|would you like to know|would you like me to|can you tell me more|tell me more about|if you'd like to know|let me know if you/i;

  const trailingSoftPitch =
    /\s+(are you interested(?: in [^.!?]*)?|would you like to know(?: more)?(?: about [^.!?]*)?|can you tell me more(?: about [^.!?]*)?|do you want to learn more(?: about [^.!?]*)?)\s*[.!?…]*\s*$/i;
  const trimmed = t.replace(trailingSoftPitch, "").trim();

  const parts = (trimmed || t).split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return t;

  let kept = [...parts];
  while (kept.length > 0) {
    const last = kept[kept.length - 1]!;
    const stripped = last.replace(/^["'“”]|[\"'“”]$/g, "").trim();
    const isQuestion = stripped.endsWith("?");
    const isSoft =
      isQuestion &&
      (softPitch.test(stripped) || softPitchAnywhere.test(stripped));
    if (isSoft) {
      kept.pop();
      continue;
    }
    break;
  }

  kept = kept.slice(0, 3);
  const out = kept.join(" ").trim();
  return out || t.slice(0, 400).trim();
}

export function FollowUpPanel() {
  const {
    transcript,
    answerText,
    setAnswerText,
    answerSource,
    setAnswerSource,
    suggestedFollowUpText,
    suggestedFollowUpSource,
    setSuggestedFollowUpText,
    setSuggestedFollowUpSource,
    requestFollowUp,
    isRecording,
    notesContext,
  } = useSession();
  const { canUseProFeatures, openUpgradeModal } = useEntitlements();

  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  type UiMode = "idle" | "loading" | "answered" | "error";
  const [uiMode, setUiMode] = useState<UiMode>("idle");
  const [lockedAnswer, setLockedAnswer] = useState<string>("");
  const [lockedAnswerSource, setLockedAnswerSource] = useState<string>("");

  const answerSectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevSanitizedAnswerRef = useRef<string>("");
  const lockedAnswerRef = useRef("");
  const suggestedFollowUpTextRef = useRef("");

  useEffect(() => {
    lockedAnswerRef.current = lockedAnswer;
  }, [lockedAnswer]);

  suggestedFollowUpTextRef.current = suggestedFollowUpText;

  const hasTranscript = transcript.length > 0;

  useEffect(() => {
    if (!isRecording) {
      setUiMode("idle");
      setLockedAnswer("");
      setLockedAnswerSource("");
      prevSanitizedAnswerRef.current = "";
    }
  }, [isRecording]);

  useEffect(() => {
    const next = lockedAnswer.trim();
    if (!next || next === "…") return;
    if (next === prevSanitizedAnswerRef.current) return;
    prevSanitizedAnswerRef.current = next;
    requestAnimationFrame(() => {
      answerSectionRef.current?.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
    });
  }, [lockedAnswer]);

  // New answer request: snap scroll to top so the full-panel thinking state is fully visible.
  useEffect(() => {
    if (answerText === "…") {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [answerText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      e.preventDefault();
      if (!canUseProFeatures) {
        openUpgradeModal();
        return;
      }
      requestFollowUp("answer");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestFollowUp, canUseProFeatures, openUpgradeModal]);

  const handleSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) {
      if (!canUseProFeatures) {
        openUpgradeModal();
        return;
      }
      requestFollowUp("answer");
      return;
    }
    if (!canUseProFeatures) {
      openUpgradeModal();
      return;
    }
    setChatInput("");
    setSending(true);
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug("[Persuaid][FollowUpPanel] request started: answer (chat /api/ai/answer)");
    }
    setUiMode((m) => (m === "answered" ? "loading" : "loading"));
    setSuggestedFollowUpText("");
    setSuggestedFollowUpSource("");
    setAnswerText("…");
    setAnswerSource("");
    try {
      const res = await fetch("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, notesContext: notesContext?.trim() ?? "" }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (res.ok && typeof data.answer === "string") {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUpPanel] request completed: answer (chat)", {
            rawAnswer: data.answer,
          });
        }
        setAnswerText(data.answer);
        setAnswerSource("the web");
      } else {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUpPanel] answer (chat) error", { error: data.error });
        }
        setAnswerText(data.error || "Something went wrong. Try again.");
        setAnswerSource("");
      }
    } catch {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug("[Persuaid][FollowUpPanel] answer (chat) fetch failed");
      }
      setAnswerText("Request failed. Try again.");
      setAnswerSource("");
    } finally {
      setSending(false);
    }
  }, [
    chatInput,
    setAnswerText,
    setAnswerSource,
    setSuggestedFollowUpText,
    setSuggestedFollowUpSource,
    requestFollowUp,
    canUseProFeatures,
    openUpgradeModal,
  ]);

  // Answer panel reads only session `answerText` (and chat path writes the same). Follow-up never touches this field.
  useEffect(() => {
    if (answerText === "…") {
      setUiMode("loading");
      return;
    }

    if (!answerText.trim()) {
      return;
    }

    const looksLikeError =
      answerText.toLowerCase().includes("request failed") ||
      answerText.toLowerCase().includes("something went wrong");

    if (looksLikeError) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug("[Persuaid][FollowUpPanel] answer channel error text", { answerText });
      }
      setUiMode(lockedAnswerRef.current.trim() ? "answered" : "error");
      return;
    }

    const raw = answerText;
    const compareSuggested = suggestedFollowUpTextRef.current;
    const sanitized = sanitizeAnswer(raw);
    let candidate = sanitized;

    if (
      isBadAnswer(sanitized, { compareToSuggested: compareSuggested }) &&
      !isBadAnswer(raw, { compareToSuggested: compareSuggested })
    ) {
      candidate = truncateToMaxSentences(raw, 3);
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug("[Persuaid][FollowUpPanel] sanitize looked bad; using truncated raw", {
          raw,
          sanitized,
          candidate,
        });
      }
    }

    const bad = isBadAnswer(candidate, { compareToSuggested: compareSuggested });
    if (bad) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug("[Persuaid][FollowUpPanel] isBadAnswer rejected answer", {
          raw,
          sanitized: candidate,
          suggestedFollowUp: compareSuggested,
          answerSourceUsed: answerSource,
        });
      }
      setUiMode(lockedAnswerRef.current.trim() ? "answered" : "error");
      return;
    }

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug("[Persuaid][FollowUpPanel] answer accepted", {
        rawAnswer: raw,
        sanitizedAnswer: candidate,
        isBadAnswerRejected: false,
        answerSourceUsed: answerSource,
        suggestedFollowUpSourceUsed: suggestedFollowUpTextRef.current ? "(see session)" : "",
      });
    }

    setLockedAnswer(candidate);
    setLockedAnswerSource(answerSource);
    setUiMode("answered");
    // Intentionally only answerText/answerSource: follow-up updates must not re-validate or replace the Answer.
  }, [answerText, answerSource]);

  // Auto-generate suggested follow-up after a valid answer (separate request + separate state).
  useEffect(() => {
    if (!canUseProFeatures) return;
    if (uiMode !== "answered") return;
    if (!hasTranscript) return;
    if (!lockedAnswer.trim()) return;
    if (suggestedFollowUpText === "…") return;
    if (suggestedFollowUpText.trim().length > 0) return;
    requestFollowUp("follow_up_question");
  }, [
    uiMode,
    lockedAnswer,
    suggestedFollowUpText,
    hasTranscript,
    canUseProFeatures,
    requestFollowUp,
  ]);

  /** Copilot / chat is fetching a new answer — show one unified thinking UI (not stale sections). */
  const isGeneratingNewAnswer = answerText === "…" || sending;
  const questionLoading = suggestedFollowUpText === "…";
  const showSuggestedBody =
    suggestedFollowUpText && suggestedFollowUpText !== "…";

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto p-4",
          "flex flex-col gap-3"
        )}
      >
        {/* Generating must win over idle: answerText can flip to "…" before uiMode effect runs */}
        {isGeneratingNewAnswer ? (
          <div
            className={cn(
              "flex-1 min-h-[min(320px,50vh)] flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-2xl",
              "border border-white/10 bg-neutral-950 shadow-lg",
              "text-center"
            )}
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="inline-flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 animate-bounce" />
            </span>
            <div className="space-y-2 max-w-sm">
              <p className="text-sm font-semibold text-zinc-100">
                Generating a new answer…
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Using your latest transcript. Your suggested follow-up will appear right after.
              </p>
            </div>
          </div>
        ) : uiMode === "idle" ? (
          <div className="rounded-xl bg-background-elevated/40 border border-border/20 p-4 text-sm text-text-dim/80">
            {hasTranscript
              ? "Press Enter to generate what to say next."
              : "Start the call, then press Enter for an answer."}
          </div>
        ) : (
          <>
            <div ref={answerSectionRef} className="space-y-3 scroll-mt-2 pb-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
                  Answer
                </h3>
              </div>
              <div className="rounded-xl bg-background-elevated/55 border border-border/30 p-4 text-sm">
                <p className="text-text-primary/95 leading-7 whitespace-pre-wrap">
                  {lockedAnswer || "…"}
                </p>
              </div>
              {lockedAnswerSource ? (
                <p className="text-xs text-text-dim/90 pl-1">From: {lockedAnswerSource}</p>
              ) : null}
            </div>

            <div className="space-y-2 mt-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim/75">
                Suggested follow-up
              </h3>
              <div className="rounded-xl bg-background-elevated/25 border border-border/15 p-4 text-sm">
                {questionLoading ? (
                  <div className="flex items-center gap-2 text-sm text-text-dim">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce" />
                    </span>
                    <span>Thinking…</span>
                  </div>
                ) : showSuggestedBody ? (
                  <p className="text-text-secondary/90 leading-relaxed whitespace-pre-wrap italic">
                    {suggestedFollowUpText}
                  </p>
                ) : (
                  <p className="text-text-dim/90 leading-relaxed">
                    A suggested question will appear here shortly.
                  </p>
                )}
                {suggestedFollowUpSource ? (
                  <p className="text-xs text-text-dim/90 pt-2">From: {suggestedFollowUpSource}</p>
                ) : null}
              </div>
            </div>

            {uiMode === "error" ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
                Something went wrong. Try again.
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border/30 bg-background-surface/50 p-3 space-y-2">
        <div className="flex gap-2">
          <input
            id="follow-up-chat-input"
            name="followUpMessage"
            type="text"
            autoComplete="off"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a question or objection…"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-background-elevated/60 border border-border/50 text-text-primary placeholder:text-text-dim/50 focus:outline-none focus:ring-1 focus:ring-green-primary/40"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
              "bg-green-primary/20 text-green-700 dark:text-green-300 border border-green-primary/30",
              "hover:bg-green-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
