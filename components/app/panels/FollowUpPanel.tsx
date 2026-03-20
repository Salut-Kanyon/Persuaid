"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";
import { cn } from "@/lib/utils";

export function FollowUpPanel() {
  const {
    transcript,
    followUpText,
    setFollowUpText,
    followUpSource,
    setFollowUpSource,
    requestFollowUp,
    followUpMode,
    notesContext,
  } = useSession();
  const { canUseProFeatures, openUpgradeModal } = useEntitlements();

  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatRequestModeRef = useRef<"answer" | null>(null);

  type UiMode = "idle" | "loading" | "answered" | "error";
  const [uiMode, setUiMode] = useState<UiMode>("idle");
  const [lockedAnswer, setLockedAnswer] = useState<string>("");
  const [lockedAnswerSource, setLockedAnswerSource] = useState<string>("");
  const [suggestedFollowUp, setSuggestedFollowUp] = useState<string>("");
  const [suggestedFollowUpSource, setSuggestedFollowUpSource] = useState<string>("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [definitionsOpen, setDefinitionsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const hasTranscript = transcript.length > 0;
  const hasDefinitions = notesContext.trim().length > 80;
  const definitionsPreview = notesContext.trim().slice(0, 900);

  useEffect(() => {
    // Keep the answer pinned; only scroll when the visible content changes.
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lockedAnswer, suggestedFollowUp, uiMode, questionLoading]);

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
    chatRequestModeRef.current = "answer";
    setUiMode((m) => (m === "answered" ? "loading" : "loading"));
    setFollowUpText("…");
    setFollowUpSource("");
    try {
      const res = await fetch("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (res.ok && typeof data.answer === "string") {
        setFollowUpText(data.answer);
        setFollowUpSource("the web");
      } else {
        setFollowUpText(data.error || "Something went wrong. Try again.");
        setFollowUpSource("");
      }
    } catch {
      setFollowUpText("Request failed. Try again.");
      setFollowUpSource("");
    } finally {
      setSending(false);
    }
  }, [chatInput, setFollowUpText, setFollowUpSource, requestFollowUp, canUseProFeatures, openUpgradeModal]);

  const targetModeForCurrentText: "answer" | "follow_up_question" =
    (chatRequestModeRef.current ?? followUpMode ?? "answer") as "answer" | "follow_up_question";

  useEffect(() => {
    // Explicit mode-based state machine:
    // - answered stays locked until a new answer replaces it
    // - follow-up questions render underneath the locked answer
    if (followUpText === "…") {
      if (targetModeForCurrentText === "answer") {
        setQuestionLoading(false);
        setUiMode("loading");
      } else {
        setQuestionLoading(true);
        setUiMode((m) => (m === "answered" ? "answered" : m));
      }
      return;
    }

    if (!followUpText) {
      // Don't fall back to idle/demo after an answer was produced.
      return;
    }

    const looksLikeError =
      followUpText.toLowerCase().includes("request failed") ||
      followUpText.toLowerCase().includes("something went wrong");

    if (looksLikeError) {
      setQuestionLoading(false);
      setUiMode("error");
      return;
    }

    if (targetModeForCurrentText === "answer") {
      setLockedAnswer(followUpText);
      setLockedAnswerSource(followUpSource);
      setUiMode("answered");
      setQuestionLoading(false);
      // Clear previous follow-up; we'll fetch a fresh one for this answer.
      setSuggestedFollowUp("");
      setSuggestedFollowUpSource("");
      chatRequestModeRef.current = null;
    } else {
      setSuggestedFollowUp(followUpText);
      setSuggestedFollowUpSource(followUpSource);
      setQuestionLoading(false);
      setUiMode((m) => (lockedAnswer ? "answered" : m === "error" ? "error" : "answered"));
    }
  }, [followUpText, followUpSource, targetModeForCurrentText, lockedAnswer]);

  // Auto-generate suggested follow-up after an answer is ready.
  useEffect(() => {
    if (!canUseProFeatures) return;
    if (uiMode !== "answered") return;
    if (!hasTranscript) return;
    if (!lockedAnswer) return;
    if (suggestedFollowUp) return; // already populated
    // Only request a follow-up question; keep the answer locked.
    requestFollowUp("follow_up_question");
  }, [uiMode, lockedAnswer, suggestedFollowUp, hasTranscript, canUseProFeatures, requestFollowUp]);

  const answerIsLoading = uiMode === "loading" && followUpText === "…";

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Main content: next line to say (or chat answer) */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto p-4",
          "flex flex-col gap-3"
        )}
      >
        {uiMode === "idle" ? (
          <div className="rounded-xl bg-background-elevated/40 border border-border/20 p-4 text-sm text-text-dim/80">
            {hasTranscript
              ? "Press Enter to generate what to say next."
              : "Start the call, then press Enter for an answer."}
          </div>
        ) : (
          <>
            {/* Answer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Answer
                </h3>
                {answerIsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-text-dim">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce" />
                    </span>
                    <span>Updating…</span>
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl bg-background-elevated/50 border border-border/30 p-4 text-sm">
                <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                  {lockedAnswer || "…"}
                </p>
              </div>
              {lockedAnswerSource ? (
                <p className="text-xs text-text-dim/90 pl-1">From: {lockedAnswerSource}</p>
              ) : null}
            </div>

            {/* Suggested follow-up */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                Suggested follow-up
              </h3>
              <div className="rounded-xl bg-background-elevated/40 border border-border/20 p-4 text-sm">
                {questionLoading && !suggestedFollowUp ? (
                  <div className="flex items-center gap-2 text-sm text-text-dim">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce" />
                    </span>
                    <span>Thinking…</span>
                  </div>
                ) : suggestedFollowUp ? (
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap italic">{suggestedFollowUp}</p>
                ) : (
                  <p className="text-text-dim/90 leading-relaxed">Press “Follow-up” to generate a question.</p>
                )}
                {suggestedFollowUpSource ? (
                  <p className="text-xs text-text-dim/90 pt-2">From: {suggestedFollowUpSource}</p>
                ) : null}
              </div>
            </div>

            {/* Definitions */}
            {hasDefinitions ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Definitions
                </h3>
                <button
                  type="button"
                  onClick={() => setDefinitionsOpen((o) => !o)}
                  className="w-fit px-3 py-1.5 rounded-lg border border-border/50 bg-background-elevated/40 text-xs font-medium text-text-primary hover:bg-background-elevated/60 transition-colors"
                >
                  {definitionsOpen ? "Hide definitions" : "Show definitions"}
                </button>
                {definitionsOpen ? (
                  <div className="rounded-xl bg-background-elevated/30 border border-border/20 p-4 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                    {definitionsPreview}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Error */}
            {uiMode === "error" ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
                Something went wrong. Try again.
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Chat bar + Follow-up button */}
      <div className="flex-shrink-0 border-t border-border/30 bg-background-surface/50 p-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
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
          <button
            type="button"
            onClick={() => {
              if (!canUseProFeatures) {
                openUpgradeModal();
                return;
              }
              requestFollowUp("follow_up_question");
            }}
            disabled={(questionLoading || (uiMode !== "answered" && !lockedAnswer)) || !hasTranscript}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
              "bg-background-elevated/80 text-text-primary border border-border/50",
              "hover:bg-background-surface hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Generate a follow-up sales question to ask the prospect"
          >
            Follow-up
          </button>
        </div>
      </div>
    </div>
  );
}
