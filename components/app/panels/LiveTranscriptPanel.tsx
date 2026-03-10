"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/app/contexts/SessionContext";
import { loadSettings } from "@/lib/settings";
import { supabase } from "@/lib/supabase/client";

function getTranscriptText(transcript: { speaker: string; text: string }[]): string {
  return transcript
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
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

  const handleSaveAndAnalyze = useCallback(async () => {
    if (transcript.length === 0) return;
    setSaveAnalyzeError(null);
    setJustSavedSessionId(null);
    setSavingForAnalyze(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveAnalyzeError("Sign in to save and analyze.");
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
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        setJustSavedSessionId(sessionData.id);
        setSaveAnalyzeError("Saved. Sign in again to generate analysis.");
        return;
      }
      const res = await fetch("/api/ai/analyze-call", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transcript: text }),
      });
      const json = (await res.json()) as { analysis?: string; error?: string };
      if (!res.ok) {
        setJustSavedSessionId(sessionData.id);
        setSaveAnalyzeError(json.error || "Analysis failed. You can view the transcript on Analyze.");
        return;
      }
      if (json.analysis) {
        await supabase
          .from("sessions")
          .update({ analysis: json.analysis })
          .eq("id", sessionData.id);
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
      <div className="flex-shrink-0 px-4 py-2 text-xs text-text-muted border-b border-border/30 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
        <span>This is what’s being sent to the follow-up AI.</span>
        <div className="flex items-center gap-2">
          {diarizationSpeakerIds.length >= 2 ? (
          <label className="flex items-center gap-2 text-[11px] text-text-dim" title="If Rep and Prospect are swapped, choose which speaker is you.">
            I am (Rep):
            <select
              value={diarizationMeSpeakerId === null ? "" : String(diarizationMeSpeakerId)}
              onChange={(e) =>
                setDiarizationMeSpeakerId(e.target.value === "" ? null : Number(e.target.value))
              }
              className="rounded-lg border border-border/60 bg-background-elevated/60 px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:ring-1 focus:ring-green-primary/40"
            >
              <option value="">Auto (Speaker 0 = Rep)</option>
              {diarizationSpeakerIds.map((id) => (
                <option key={id} value={String(id)}>
                  Speaker {id}
                </option>
              ))}
            </select>
          </label>
        ) : null}
            <button
              type="button"
              onClick={clearTranscript}
              disabled={transcript.length === 0 && !interimTranscript}
              className="text-[11px] font-medium text-text-dim hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear transcript"
            >
              Clear transcript
            </button>
          </div>
        </div>
        {diarizationSpeakerIds.length >= 2 && (
          <p className="text-[11px] text-text-dim/80">
            If Rep and Prospect are swapped, choose &quot;I am (Rep): Speaker 1&quot; (or 0) so labels match.
          </p>
        )}
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
      {(transcript.length > 0 || interimTranscript) ? (
        <div className="flex-shrink-0 px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSaveToFile}
              disabled={transcript.length === 0}
              className="px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border/50 text-sm font-medium text-text-primary hover:bg-background-surface transition-colors disabled:opacity-50"
            >
              Save to file
            </button>
            <button
              type="button"
              onClick={handleSaveAndAnalyze}
              disabled={savingForAnalyze || transcript.length === 0}
              className="px-4 py-2.5 rounded-xl bg-green-primary/20 border border-green-primary/40 text-green-accent text-sm font-medium hover:bg-green-primary/30 transition-colors disabled:opacity-50"
            >
              {savingForAnalyze ? "Saving…" : "Save & analyze"}
            </button>
          </div>
          {saveAnalyzeError && (
            <p className="text-xs text-amber-400">{saveAnalyzeError}</p>
          )}
          {justSavedSessionId && !saveAnalyzeError && (
            <p className="text-xs text-green-accent">Saved. Open Analyze to see your coaching feedback.</p>
          )}
          {justSavedSessionId ? (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/analyze?session=${justSavedSessionId}`)}
              className="w-full px-4 py-2 rounded-xl bg-green-primary/15 border border-green-primary/30 text-green-accent text-sm font-medium hover:bg-green-primary/25 transition-colors"
            >
              Go to Analyze
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
