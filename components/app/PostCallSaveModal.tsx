"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/app/contexts/SessionContext";

function formatTranscriptFull(transcript: { speaker: string; text: string }[]) {
  return transcript
    .map((m) => `${m.speaker === "prospect" ? "Other" : "You"}: ${m.text}`)
    .join("\n");
}

function minutesBetween(startIso: string, endIso: string) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

export function PostCallSaveModal() {
  const router = useRouter();
  const { isRecording, transcript, callStartedAtIso, callEndedAtIso, resetCall } = useSession();

  const prevRecordingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const hasTranscript = transcript.length > 0;
  const defaultTitle = useMemo(() => {
    const d = new Date();
    return `Call ${d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }, []);

  useEffect(() => {
    const prev = prevRecordingRef.current;
    prevRecordingRef.current = isRecording;
    if (prev && !isRecording && hasTranscript) {
      setTitle(defaultTitle);
      setError(null);
      setOpen(true);
    }
  }, [defaultTitle, hasTranscript, isRecording]);

  const close = () => {
    setOpen(false);
    setSaving(false);
    setError(null);
  };

  const handleDiscard = () => {
    resetCall();
    close();
  };

  const handleSave = async () => {
    if (!hasTranscript || saving) return;
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sign in to save.");
        setSaving(false);
        return;
      }

      const started_at = callStartedAtIso ?? new Date().toISOString();
      const ended_at = callEndedAtIso ?? new Date().toISOString();
      const duration_minutes = minutesBetween(started_at, ended_at);
      const transcript_full = formatTranscriptFull(transcript);

      const { data: inserted, error: insertErr } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          title: title.trim() || null,
          started_at,
          ended_at,
          duration_minutes,
          transcript_full,
        })
        .select("id")
        .single();

      if (insertErr || !inserted?.id) {
        setError("Could not save transcript.");
        setSaving(false);
        return;
      }

      resetCall();
      close();
      router.push(`/dashboard/calls?session=${encodeURIComponent(inserted.id)}`);
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-call-save-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={close} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl",
          "bg-background-elevated border border-white/[0.08] shadow-2xl"
        )}
      >
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="post-call-save-title" className="text-base font-semibold text-text-primary">
              Save this call?
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Store the transcript so you can generate coaching analysis.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="post-call-title" className="block text-xs font-medium text-text-muted mb-1.5">
              Title (optional)
            </label>
            <input
              id="post-call-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-white/[0.10] text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/35 text-sm"
            />
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
            <p className="text-xs text-text-dim">
              Transcript lines: <span className="tabular-nums text-text-secondary">{transcript.length}</span>
            </p>
          </div>

          {error && <p className="text-xs text-amber-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-white/[0.06] text-sm font-medium disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-green-primary/20 border border-green-primary/35 text-green-accent text-sm font-medium hover:bg-green-primary/30 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save transcript"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

