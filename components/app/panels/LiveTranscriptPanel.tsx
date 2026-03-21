"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/app/contexts/SessionContext";
import { loadSettings } from "@/lib/settings";
import { supabase } from "@/lib/supabase/client";

function getTranscriptText(transcript: { speaker: string; text: string }[]): string {
  return transcript
    .map((m) => `${m.speaker === "prospect" ? "Other" : "You"}: ${m.text}`)
    .join("\n");
}

/** Shows the live transcript that is fed into the follow-up AI. Use to verify the conversation is being captured. */
export function LiveTranscriptPanel() {
  const {
    transcript,
    interimTranscript,
    interimSpeakerId,
    diarizationSpeakerIds,
    diarizationMeSpeakerId,
    setDiarizationMeSpeakerId,
    clearTranscript,
  } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [savingForAnalyze, setSavingForAnalyze] = useState(false);
  const [saveAnalyzeError, setSaveAnalyzeError] = useState<string | null>(null);
  const [justSavedSessionId, setJustSavedSessionId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript.length, interimTranscript]);

  const handleSaveToFile = useCallback(() => {
    if (transcript.length === 0) return;
    const exportFormat = (() => {
      try {
        return loadSettings().defaultExportFormat;
      } catch {
        return "txt";
      }
    })();
    const text = getTranscriptText(transcript);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript]);

  const handleSave = useCallback(async () => {
    if (transcript.length === 0) return;
    setSaveAnalyzeError(null);
    setJustSavedSessionId(null);
    setSavingForAnalyze(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveAnalyzeError("Sign in to save.");
        return;
      }
      const text = getTranscriptText(transcript);
      const title = `Call ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`;
      const { data: sessionData, error: insertErr } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          title,
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          duration_minutes: 0,
          transcript_full: text,
        })
        .select("id")
        .single();
      if (insertErr || !sessionData?.id) {
        setSaveAnalyzeError("Could not save transcript.");
        return;
      }
      setJustSavedSessionId(sessionData.id);
    } catch {
      setSaveAnalyzeError("Something went wrong.");
    } finally {
      setSavingForAnalyze(false);
    }
  }, [transcript]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-border/30 flex items-center justify-between gap-2">
        {diarizationSpeakerIds.length >= 2 ? (
          <select
            id="diarization-me-speaker"
            name="diarizationMeSpeakerId"
            value={diarizationMeSpeakerId === null ? "" : String(diarizationMeSpeakerId)}
            onChange={(e) =>
              setDiarizationMeSpeakerId(e.target.value === "" ? null : Number(e.target.value))
            }
            title="Choose which voice is you so we label the transcript correctly"
            className="rounded-lg border border-border/60 bg-background-elevated/60 px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:ring-1 focus:ring-green-primary/40"
            aria-label="Which speaker are you?"
          >
            <option value="">Auto</option>
            {diarizationSpeakerIds.map((id, i) => (
              <option key={id} value={String(id)}>I&apos;m the {i === 0 ? "first" : "second"} speaker</option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          onClick={clearTranscript}
          disabled={transcript.length === 0 && !interimTranscript}
          className="text-[11px] font-medium text-text-dim hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          title="Clear transcript"
        >
          Clear
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-1.5 min-h-0"
      >
        {transcript.length === 0 && !interimTranscript ? (
          <p className="text-sm text-text-dim/70">No speech yet. Start the call to see the live transcript.</p>
        ) : (
          <>
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className="text-sm leading-snug"
              >
                <span className={msg.speaker === "prospect" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-green-700 dark:text-green-400 font-medium"}>
                  {msg.speaker === "prospect" ? "Other" : "You"}:
                </span>{" "}
                <span className="text-text-primary">{msg.text}</span>
              </div>
            ))}
            {interimTranscript ? (
              <div className="text-sm text-text-dim/80 italic leading-snug">
                <span className="text-text-dim font-medium">
                  {(() => {
                    if (diarizationMeSpeakerId !== null && typeof interimSpeakerId === "number") {
                      return interimSpeakerId === diarizationMeSpeakerId ? "You:" : "Other:";
                    }
                    return "…";
                  })()}
                </span>{" "}
                <span className="line-clamp-3">{interimTranscript}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
      {(transcript.length > 0 || interimTranscript) ? (
        <div className="flex-shrink-0 px-4 pb-2 pt-1 space-y-1">
          {justSavedSessionId ? (
            <>
              <p className="text-xs text-green-accent font-medium">Done saving.</p>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/analyze?session=${justSavedSessionId}`)}
                className="w-full px-3 py-2 rounded-xl bg-green-primary/20 border border-green-primary/40 text-green-accent text-sm font-medium hover:bg-green-primary/30 transition-colors"
              >
                Go to AI Coach
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={savingForAnalyze || transcript.length === 0}
                className="flex-1 px-3 py-2 rounded-xl bg-green-primary/20 border border-green-primary/40 text-green-accent text-sm font-medium hover:bg-green-primary/30 transition-colors disabled:opacity-50"
              >
                {savingForAnalyze ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleSaveToFile}
                disabled={transcript.length === 0}
                className="flex-1 px-3 py-2 rounded-xl bg-background-surface/60 border border-border/50 text-sm font-medium text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Save to file
              </button>
            </div>
          )}
          {saveAnalyzeError && (
            <p className="text-xs text-amber-400">{saveAnalyzeError}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
