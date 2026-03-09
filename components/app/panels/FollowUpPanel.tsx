"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";

function formatTranscriptForSave(messages: { speaker: string; text: string }[]): string {
  return messages
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

/** Parses ## Section headers and returns [{ title, body }]. */
function parseStructuredSections(text: string): { title: string; body: string }[] {
  if (!text.includes("## ")) return [];
  const raw = text.split(/##\s+/);
  return raw
    .map((block) => {
      const firstLine = block.indexOf("\n");
      const title = firstLine === -1 ? block.trim() : block.slice(0, firstLine).trim();
      const body = firstLine === -1 ? "" : block.slice(firstLine + 1).trim();
      return { title, body };
    })
    .filter((s) => s.title.length > 0);
}

const FOCUS_OPTIONS: { id: "what_to_say" | "questions" | "key_points"; label: string }[] = [
  { id: "what_to_say", label: "What to say" },
  { id: "questions", label: "Questions to ask" },
  { id: "key_points", label: "Key points" },
];

export function FollowUpPanel() {
  const { transcript, followUpText, requestFollowUp, followUpFocus, setFollowUpFocus } = useSession();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      e.preventDefault();
      requestFollowUp();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestFollowUp]);

  const handleFilterClick = useCallback(
    (focus: "what_to_say" | "questions" | "key_points") => {
      setFollowUpFocus(focus);
      requestFollowUp();
    },
    [setFollowUpFocus, requestFollowUp]
  );

  const handleSaveTranscript = useCallback(() => {
    if (transcript.length === 0) return;
    const text = formatTranscriptForSave(transcript);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript]);

  const hasTranscript = transcript.length > 0;
  const sections = followUpText && followUpText !== "…" ? parseStructuredSections(followUpText) : [];
  const showStructured = sections.length > 0;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FOCUS_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleFilterClick(id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                followUpFocus === id
                  ? "bg-green-primary/25 text-green-800 dark:text-green-300 border border-green-primary/40"
                  : "bg-background-surface/60 border border-border/50 text-text-primary hover:bg-background-surface"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-text-muted mb-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-background-elevated border border-border/50 font-mono text-xs">Enter</kbd> for <span className="text-text-primary">{FOCUS_OPTIONS.find((o) => o.id === followUpFocus)?.label ?? "suggestions"}</span>. Uses your notes and script.
        </p>
        <div
          className={cn(
            "flex-1 min-h-[120px] rounded-xl border overflow-y-auto",
            "bg-background-elevated/40 border-border/30 text-text-primary",
            followUpText === "…" && "animate-pulse"
          )}
        >
          {followUpText === "…" ? (
            <div className="p-4 text-sm text-text-dim">Getting suggestions…</div>
          ) : showStructured ? (
            <div className="p-4 space-y-4 text-sm">
              {sections.map(({ title, body }) => (
                <section key={title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim/90 mb-1.5 border-b border-border/30 pb-1">
                    {title}
                  </h3>
                  <div className="whitespace-pre-wrap text-text-primary leading-relaxed">{body}</div>
                </section>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm whitespace-pre-wrap">
              {followUpText || (hasTranscript ? "Press Enter for a follow-up." : "Start the call and press Enter when you need suggestions.")}
            </div>
          )}
        </div>
      </div>
      {hasTranscript && (
        <div className="flex-shrink-0 px-4 pb-4">
          <button
            type="button"
            onClick={handleSaveTranscript}
            className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border/50 text-sm font-medium text-text-primary hover:bg-background-surface transition-colors"
          >
            Save transcript
          </button>
        </div>
      )}
    </div>
  );
}
