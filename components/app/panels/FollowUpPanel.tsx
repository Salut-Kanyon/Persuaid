"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";

export function FollowUpPanel() {
  const { transcript, followUpText, setFollowUpText, requestFollowUp } = useSession();
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [followUpText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      e.preventDefault();
      requestFollowUp("answer");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestFollowUp]);

  const handleSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) {
      requestFollowUp("answer");
      return;
    }
    setChatInput("");
    setSending(true);
    setFollowUpText("…");
    try {
      const res = await fetch("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (res.ok && typeof data.answer === "string") {
        setFollowUpText(data.answer);
      } else {
        setFollowUpText(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setFollowUpText("Request failed. Try again.");
    } finally {
      setSending(false);
    }
  }, [chatInput, setFollowUpText, requestFollowUp]);

  const hasTranscript = transcript.length > 0;
  const hasResponse = followUpText && followUpText !== "…";
  const isLoading = followUpText === "…" || sending;

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
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-dim">
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-green-primary/70 animate-bounce" />
            </span>
            <span>Thinking…</span>
          </div>
        ) : hasResponse ? (
          <div className="rounded-xl bg-background-elevated/50 border border-border/30 p-4 text-sm">
            <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{followUpText}</p>
          </div>
        ) : (
          <div className="rounded-xl bg-background-elevated/40 border border-border/20 p-4 text-sm text-text-dim/80">
            {hasTranscript
              ? "Press Enter for the next line to say back to the prospect. Use Follow-up for one strong question to move the conversation forward."
              : "Start the call, then press Enter for the next line to say, or use Follow-up for a strong question to ask."}
          </div>
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
            placeholder="Type a specific question or objection (Send), or press Enter for the next line to say…"
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
            onClick={() => requestFollowUp("follow_up_question")}
            disabled={isLoading || !hasTranscript}
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
