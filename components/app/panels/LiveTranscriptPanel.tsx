"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { loadSettings } from "@/lib/settings";

/** Shows the live transcript that is fed into the follow-up AI. Use to verify the conversation is being captured. */
export function LiveTranscriptPanel() {
  const {
    transcript,
    interimTranscript,
    interimSpeakerId,
    diarizationSpeakerIds,
    diarizationMeSpeakerId,
    setDiarizationMeSpeakerId,
  } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript.length, interimTranscript]);

  const handleSaveTranscript = useCallback(() => {
    if (transcript.length === 0) return;
    const exportFormat = (() => {
      try {
        return loadSettings().defaultExportFormat;
      } catch {
        return "txt";
      }
    })();
    const text = transcript
      .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 py-2 text-xs text-text-muted border-b border-border/30 flex items-center justify-between gap-3">
        <span>This is what’s being sent to the follow-up AI.</span>
        {diarizationSpeakerIds.length >= 2 ? (
          <label className="flex items-center gap-2 text-[11px] text-text-dim">
            I am:
            <select
              value={diarizationMeSpeakerId === null ? "" : String(diarizationMeSpeakerId)}
              onChange={(e) =>
                setDiarizationMeSpeakerId(e.target.value === "" ? null : Number(e.target.value))
              }
              className="rounded-lg border border-border/60 bg-background-elevated/60 px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:ring-1 focus:ring-green-primary/40"
            >
              <option value="">Auto</option>
              {diarizationSpeakerIds.map((id) => (
                <option key={id} value={String(id)}>
                  Speaker {id}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2"
      >
        {transcript.length === 0 && !interimTranscript ? (
          <p className="text-sm text-text-dim/70">No speech yet. Start the call to see the live transcript.</p>
        ) : (
          <>
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className="text-sm"
              >
                <span className={msg.speaker === "prospect" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-green-700 dark:text-green-400 font-medium"}>
                  {msg.speaker === "prospect" ? "Prospect" : "Rep"}:
                </span>{" "}
                <span className="text-text-primary">{msg.text}</span>
              </div>
            ))}
            {interimTranscript ? (
              <div className="text-sm text-text-dim/80 italic">
                <span className="text-text-dim font-medium">
                  {typeof interimSpeakerId === "number" ? `Speaker ${interimSpeakerId} (in progress):` : "In progress:"}
                </span>{" "}
                {interimTranscript}
              </div>
            ) : null}
          </>
        )}
      </div>
      {transcript.length > 0 ? (
        <div className="flex-shrink-0 px-4 pb-3">
          <button
            type="button"
            onClick={handleSaveTranscript}
            className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border/50 text-sm font-medium text-text-primary hover:bg-background-surface transition-colors"
          >
            Save transcript
          </button>
        </div>
      ) : null}
    </div>
  );
}
