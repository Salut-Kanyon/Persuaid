"use client";

import { useEffect, useCallback, useState, useRef, useMemo, type RefObject, type Ref } from "react";
import type { CSSProperties } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";
import { cn } from "@/lib/utils";
import { getClientIanaTimeZone } from "@/lib/client-timezone";
import { fetchApi } from "@/lib/api-fetch";

const DEBUG = process.env.NODE_ENV !== "production";

function CallOverlayKeycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-md border border-white/[0.22] bg-white/[0.10] px-1.5 text-[11px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {children}
    </kbd>
  );
}

/** Same Answer layout as idle; cycles “.” → “…” for loading. */
function CallOverlayAnswerLoading({
  labelCls,
  anchorRef,
}: {
  labelCls: string;
  anchorRef: RefObject<HTMLDivElement | null>;
}) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 4), 420);
    return () => window.clearInterval(id);
  }, []);
  const ell = (["", ".", "..", "..."] as const)[phase]!;
  return (
    <div ref={anchorRef as Ref<HTMLDivElement>} className="space-y-2.5" role="status" aria-live="polite" aria-busy="true">
      <p className={labelCls}>Answer</p>
      <p className="min-h-[1.55em] text-[14px] font-normal leading-[1.55] tracking-tight text-white/[0.88]">
        Answering<span className="inline-block min-w-[2.75ch] tabular-nums text-white/90">{ell}</span>
      </p>
      <p className="text-[11px] leading-relaxed text-white/34">Using transcript and notes</p>
    </div>
  );
}

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

/** Locate a substring in notes that overlaps the answer (highlights “from your notes” provenance). */
function findNotesHighlightSpan(notes: string, answer: string): { start: number; end: number } | null {
  const n = notes;
  if (!n.trim() || !answer.trim()) return null;
  const lowerN = n.toLowerCase();
  const words = answer
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
  for (let len = Math.min(16, words.length); len >= 3; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      if (phrase.length < (len >= 4 ? 10 : 14)) continue;
      const idx = lowerN.indexOf(phrase);
      if (idx !== -1) return { start: idx, end: idx + phrase.length };
    }
  }
  for (const w of words) {
    if (w.length < 5) continue;
    const idx = lowerN.indexOf(w);
    if (idx !== -1) return { start: idx, end: idx + w.length };
  }
  return null;
}

/**
 * Prefer a span in the user’s notes; if the model used the AI-connected layer, try to map a match
 * from that text back into `userNotes` so highlighting still works on “My notes” view.
 */
function findNotesHighlightSpanWithFallback(
  userNotes: string,
  aiNotes: string | undefined,
  answer: string
): { start: number; end: number } | null {
  const u = userNotes;
  const ans = answer.trim();
  if (!u.trim() || !ans) return null;

  let span = findNotesHighlightSpan(u, ans);
  if (span) return span;

  const ai = aiNotes?.trim() ?? "";
  if (!ai) return null;

  span = findNotesHighlightSpan(ai, ans);
  if (!span) return null;

  const frag = ai.slice(span.start, span.end).trim();
  if (frag.length < 4) return null;

  const lowerU = u.toLowerCase();
  let idx = lowerU.indexOf(frag.toLowerCase());
  if (idx !== -1) return { start: idx, end: idx + frag.length };

  const fragWords = frag
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);

  for (let len = Math.min(fragWords.length, 12); len >= 2; len--) {
    for (let i = 0; i + len <= fragWords.length; i++) {
      const phrase = fragWords.slice(i, i + len).join(" ");
      if (phrase.length < 8) continue;
      const j = lowerU.indexOf(phrase);
      if (j !== -1) return { start: j, end: j + phrase.length };
    }
  }

  return null;
}

function scrollNotesHighlightIntoView(scroller: HTMLDivElement | null) {
  if (!scroller) return;
  const mark = scroller.querySelector('[data-notes-highlight="true"]');
  if (!(mark instanceof HTMLElement)) return;

  const sr = scroller.getBoundingClientRect();
  const mr = mark.getBoundingClientRect();
  const relativeTop = mr.top - sr.top + scroller.scrollTop;
  const targetScroll = relativeTop - sr.height / 2 + mr.height / 2;
  const top = Math.max(0, Math.min(targetScroll, scroller.scrollHeight - sr.height));
  scroller.scrollTo({ top, behavior: "smooth" });
}

/** Must match `CallSessionOverlay` fixed card height. */
const OVERLAY_CARD_H_PX = 680;

type FollowUpPanelVariant = "default" | "callOverlay";

export function FollowUpPanel({ variant = "default" }: { variant?: FollowUpPanelVariant }) {
  const overlay = variant === "callOverlay";
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
    notesUserPlain,
  } = useSession();
  const { canUseAiCoach, openUpgradeModal } = useEntitlements();

  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  type UiMode = "idle" | "loading" | "answered" | "error";
  const [uiMode, setUiMode] = useState<UiMode>("idle");
  const [lockedAnswer, setLockedAnswer] = useState<string>("");
  const [lockedAnswerSource, setLockedAnswerSource] = useState<string>("");

  const answerSectionRef = useRef<HTMLDivElement>(null);
  const followUpSectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const notesScrollRef = useRef<HTMLDivElement>(null);
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
      if (overlay) {
        // Live-call card: never use scrollIntoView here — it scrolls the inner panel to align the
        // Answer block with the scrollport top and strips away py-4 padding (looks “cut off” on some Macs).
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
      } else {
        answerSectionRef.current?.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
      }
    });
  }, [lockedAnswer, overlay]);

  // New answer request: snap scroll to top so the full-panel thinking state is fully visible.
  useEffect(() => {
    if (answerText === "…") {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [answerText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.altKey || e.ctrlKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;

      if (overlay && e.metaKey) {
        e.preventDefault();
        if (!canUseAiCoach) {
          openUpgradeModal();
          return;
        }
        requestFollowUp("answer");
        return;
      }

      if (e.metaKey) return;

      e.preventDefault();
      if (!canUseAiCoach) {
        openUpgradeModal();
        return;
      }
      requestFollowUp("answer");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestFollowUp, canUseAiCoach, openUpgradeModal, overlay]);

  const handleSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) {
      if (!canUseAiCoach) {
        openUpgradeModal();
        return;
      }
      requestFollowUp("answer");
      return;
    }
    if (!canUseAiCoach) {
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
      const res = await fetchApi("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          notesContext: notesContext?.trim() ?? "",
          timeZone: getClientIanaTimeZone(),
        }),
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
    canUseAiCoach,
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
    if (!canUseAiCoach) return;
    if (overlay) return;
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
    canUseAiCoach,
    requestFollowUp,
    overlay,
  ]);

  /** Copilot / chat is fetching a new answer — show one unified thinking UI (not stale sections). */
  const isGeneratingNewAnswer = answerText === "…" || sending;
  const questionLoading = suggestedFollowUpText === "…";
  const showSuggestedBody =
    suggestedFollowUpText && suggestedFollowUpText !== "…";

  const assistVisualActive =
    isGeneratingNewAnswer || sending || (uiMode === "answered" && !!lockedAnswer.trim());

  const overlayBlur: CSSProperties = {
    WebkitBackdropFilter: "saturate(180%) blur(22px)",
    backdropFilter: "saturate(180%) blur(22px)",
  };

  const overlayLabel = "text-[9px] font-semibold uppercase tracking-[0.16em] text-white/38";

  const idleAnswerCopy = hasTranscript
    ? "Waiting for a clearer moment — let the prospect ask a question or raise an objection, then press Return or Enter."
    : "When someone speaks, you’ll see lines here. Press Return or Enter for what to say next, or type a specific question in the box below.";

  /** Call overlay always shows My notes — never the AI-connected rewrite (`notesContext` is still sent to APIs). */
  const overlayNotesBody = useMemo(() => {
    if (!overlay) return { kind: "skip" as const };
    const raw = notesUserPlain.trim();
    if (!raw) return { kind: "empty" as const };
    const highlight =
      uiMode === "answered" && lockedAnswerSource === "your notes" && !!lockedAnswer.trim();
    if (!highlight) {
      return {
        kind: "text" as const,
        node: <span className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/58">{notesUserPlain}</span>,
      };
    }
    const span = findNotesHighlightSpanWithFallback(notesUserPlain, notesContext, lockedAnswer);
    if (!span) {
      return {
        kind: "text" as const,
        node: <span className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/58">{notesUserPlain}</span>,
      };
    }
    const { start, end } = span;
    return {
      kind: "text" as const,
      node: (
        <>
          <span className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/58">{notesUserPlain.slice(0, start)}</span>
          <mark
            data-notes-highlight="true"
            className="whitespace-pre-wrap rounded-sm bg-emerald-400/25 px-0.5 py-px text-[12px] leading-relaxed text-white/95 shadow-[0_0_14px_rgba(52,211,153,0.12)] ring-2 ring-emerald-400/35 [box-decoration-break:clone]"
          >
            {notesUserPlain.slice(start, end)}
          </mark>
          <span className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/58">{notesUserPlain.slice(end)}</span>
        </>
      ),
    };
  }, [overlay, notesUserPlain, notesContext, uiMode, lockedAnswerSource, lockedAnswer]);

  useEffect(() => {
    if (!overlay) return;
    if (lockedAnswerSource !== "your notes") return;
    if (uiMode !== "answered") return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const raf = { outer: 0, inner: 0 };

    const run = () => {
      if (!cancelled) scrollNotesHighlightIntoView(notesScrollRef.current);
    };

    raf.outer = requestAnimationFrame(() => {
      raf.inner = requestAnimationFrame(() => {
        if (cancelled) return;
        run();
        timeouts.push(setTimeout(run, 50));
        timeouts.push(setTimeout(run, 200));
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.outer);
      cancelAnimationFrame(raf.inner);
      timeouts.forEach(clearTimeout);
    };
  }, [overlay, lockedAnswer, lockedAnswerSource, notesUserPlain, notesContext, uiMode]);

  if (overlay) {
    return (
      <div
        className={cn(
          "flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.82)] text-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.38)] transition-[box-shadow] duration-300 ease-out",
          assistVisualActive && "shadow-[0_12px_40px_rgba(0,0,0,0.38),inset_0_0_0_1px_rgba(52,211,153,0.1)]"
        )}
        style={{ ...overlayBlur, height: OVERLAY_CARD_H_PX }}
      >
        <div
          ref={scrollContainerRef}
          className="h-[200px] shrink-0 overflow-y-auto overscroll-contain scroll-pt-4 border-b border-white/[0.06] px-4 py-4"
        >
          {isGeneratingNewAnswer ? (
            <CallOverlayAnswerLoading labelCls={overlayLabel} anchorRef={answerSectionRef} />
          ) : uiMode === "idle" ? (
            <div ref={answerSectionRef} className="space-y-2.5">
              <p className={overlayLabel}>Answer</p>
              <p className="text-[14px] font-normal leading-[1.55] tracking-tight text-white/[0.92]">{idleAnswerCopy}</p>
            </div>
          ) : (
            <>
              <div ref={answerSectionRef} className="space-y-2.5">
                <p className={overlayLabel}>Answer</p>
                {lockedAnswerSource ? (
                  <p className="text-[10px] text-white/30">From {lockedAnswerSource}</p>
                ) : null}
                <p className="text-[14px] font-normal leading-[1.55] tracking-tight text-white/[0.92]">{lockedAnswer || "…"}</p>
              </div>
              {uiMode === "error" ? (
                <div className="mt-4 rounded-xl border border-amber-400/18 bg-amber-400/[0.07] px-3.5 py-3 text-[13px] text-amber-100/90">
                  Something went wrong. Try again.
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col border-b border-white/[0.06] px-4 pb-3 pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={overlayLabel}>Your notes</span>
            {lockedAnswerSource === "your notes" && uiMode === "answered" ? (
              <span className="text-[9px] font-medium uppercase tracking-wider text-emerald-400/70">Used in answer</span>
            ) : null}
          </div>
          <div
            ref={notesScrollRef}
            className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/[0.07] bg-[rgba(10,10,12,0.65)] px-3.5 py-3"
          >
            {overlayNotesBody.kind === "empty" ? (
              <p className="text-[12px] leading-relaxed text-white/38">
                <span className="font-medium text-white/50">Nothing in My notes</span>. Add text in the Notes panel. If you use
                Connect with AI, we still use that for context — this view is always your wording only.
              </p>
            ) : overlayNotesBody.kind === "text" ? (
              overlayNotesBody.node
            ) : null}
          </div>
        </div>

        <div className="shrink-0 px-4 pb-4 pt-3">
          <div
            className={cn(
              "flex h-11 items-center gap-2 rounded-xl border px-3",
              "border-white/10 bg-[rgba(12,12,14,0.55)]",
              assistVisualActive && "border-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.05)]"
            )}
          >
            <input
              id="follow-up-chat-input"
              name="followUpMessage"
              type="text"
              autoComplete="off"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                if (e.metaKey) {
                  e.preventDefault();
                  if (!canUseAiCoach) {
                    openUpgradeModal();
                    return;
                  }
                  requestFollowUp("answer");
                  return;
                }
                handleSend();
              }}
              placeholder="Type a specific question…"
              className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-[13px] text-white/88 placeholder:text-white/30 focus:outline-none focus:ring-0 disabled:opacity-50"
              disabled={sending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/25",
                assistVisualActive
                  ? "bg-emerald-600/88 text-white shadow-[0_2px_10px_rgba(0,0,0,0.28)] hover:bg-emerald-600"
                  : "border border-white/10 bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-45"
              )}
              aria-label={sending ? "Sending" : "Send"}
            >
              {sending ? (
                <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-white/70" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39 1.15L4.25 12l-2.24 7.25a.992.992 0 001.39 1.15z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {/* Generating must win over idle: answerText can flip to "…" before uiMode effect runs */}
        {isGeneratingNewAnswer ? (
          <div
            className="flex min-h-[min(320px,50vh)] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-neutral-950 px-6 py-10 text-center shadow-lg"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="inline-flex gap-1.5">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-zinc-500" />
            </span>
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-semibold text-zinc-100">Generating a new answer…</p>
              <p className="text-xs leading-relaxed text-zinc-400">
                Using your latest transcript. Your suggested follow-up will appear right after.
              </p>
            </div>
          </div>
        ) : uiMode === "idle" ? (
          <div className="rounded-2xl border border-border/20 bg-background-elevated/40 p-4 text-sm text-text-dim/80">
            {hasTranscript
              ? "Press Return or Enter to generate what to say next."
              : "Start the call, then press Return or Enter for an answer."}
          </div>
        ) : (
          <>
            <div ref={answerSectionRef} className="scroll-mt-2 space-y-3 pb-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 bg-clip-text text-xs font-bold uppercase tracking-wider text-transparent">
                  Answer
                </h3>
              </div>
              <div className="rounded-2xl border border-border/30 bg-background-elevated/55 p-4 text-sm">
                <p className="whitespace-pre-wrap leading-7 text-text-primary/95">{lockedAnswer || "…"}</p>
              </div>
              {lockedAnswerSource ? (
                <p className="pl-1 text-xs text-text-dim/90">From: {lockedAnswerSource}</p>
              ) : null}
            </div>

            <div ref={followUpSectionRef} className="mt-1 space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim/75">Suggested follow-up</h3>
              <div className="rounded-2xl border border-border/15 bg-background-elevated/25 p-4 text-sm">
                {questionLoading ? (
                  <div className="flex items-center gap-2 text-sm text-text-dim">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-green-primary/70 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-green-primary/70 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-green-primary/70" />
                    </span>
                    <span>Thinking…</span>
                  </div>
                ) : showSuggestedBody ? (
                  <p className="whitespace-pre-wrap leading-relaxed italic text-text-secondary/90">{suggestedFollowUpText}</p>
                ) : (
                  <p className="leading-relaxed text-text-dim/90">A suggested question will appear here shortly.</p>
                )}
                {suggestedFollowUpSource ? (
                  <p className="pt-2 text-xs text-text-dim/90">From: {suggestedFollowUpSource}</p>
                ) : null}
              </div>
            </div>

            {uiMode === "error" ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                Something went wrong. Try again.
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex-shrink-0 space-y-2 border-t border-border/30 bg-background-surface/50 p-3">
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
            className="min-w-0 flex-1 rounded-lg border border-border/50 bg-background-elevated/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none focus:ring-1 focus:ring-green-primary/40"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex-shrink-0 rounded-lg border border-green-primary/30 bg-green-primary/20 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-primary/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-300"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
