"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";
import { supabase } from "@/lib/supabase/client";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

export function Header() {
  const {
    isRecording,
    setRecording,
    elapsedSeconds,
    setElapsedSeconds,
    transcript,
  } = useSession();
  const [takingNotes, setTakingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => {
      setElapsedSeconds((n) => n + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRecording, setElapsedSeconds]);

  return (
    <header className="h-14 bg-background-elevated/35 backdrop-blur-2xl border-b border-border/8 flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  isRecording
                    ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    : "bg-text-dim/50"
                )}
              />
              {isRecording && (
                <div className="absolute inset-0 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping opacity-60" />
              )}
            </div>
            <span className="text-sm font-medium text-text-primary">
              {isRecording ? "Recording" : "Paused"}
            </span>
          </div>
          <div className="h-3.5 w-px bg-border/12" />
          <span className="text-sm text-text-muted/70 font-mono tracking-wider">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
        <div className="h-3.5 w-px bg-border/12" />
        <div className="text-sm text-text-secondary/75">
          <span className="text-text-dim/60">Call with</span>{" "}
          <span className="font-medium text-text-primary">Sarah Chen</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRecording(!isRecording)}
          className="px-3.5 py-1.5 text-sm font-medium text-text-secondary/75 hover:text-text-primary hover:bg-background-surface/25 rounded-xl transition-all duration-300"
        >
          {isRecording ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRecording(false);
            setElapsedSeconds(0);
          }}
          className="px-3.5 py-1.5 text-sm font-medium text-text-secondary/75 hover:text-text-primary hover:bg-background-surface/25 rounded-xl transition-all duration-300"
        >
          End Call
        </button>
        <div className="h-4 w-px bg-border/12" />
        <button
          type="button"
          disabled={transcript.length === 0 || takingNotes}
          onClick={async () => {
            setTakingNotes(true);
            setNotesMessage(null);
            try {
              const { data: { session: sess } } = await supabase.auth.getSession();
              if (!sess?.access_token) {
                setNotesMessage("Sign in required");
                return;
              }
              const res = await fetch("/api/ai/notes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sess.access_token}`,
                },
                body: JSON.stringify({
                  transcript: transcript.map((m) => ({ speaker: m.speaker, text: m.text })),
                }),
              });
              if (!res.ok) {
                setNotesMessage("Failed to generate notes");
                return;
              }
              const data = (await res.json()) as { items?: unknown[] };
              const count = Array.isArray(data.items) ? data.items.length : 0;
              setNotesMessage(count > 0 ? `${count} notes added` : "No notes generated");
              window.dispatchEvent(new CustomEvent("persuaid-notes-updated"));
              setTimeout(() => setNotesMessage(null), 3000);
            } catch {
              setNotesMessage("Failed to generate notes");
            } finally {
              setTakingNotes(false);
            }
          }}
          className="px-3.5 py-1.5 bg-green-primary/90 text-white text-sm font-medium rounded-xl hover:bg-green-primary transition-all duration-300 shadow-[0_6px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {takingNotes ? "Taking notes…" : "Take notes"}
        </button>
        {notesMessage && (
          <span className="text-xs text-text-muted animate-in fade-in">
            {notesMessage}
          </span>
        )}
        <div className="h-4 w-px bg-border/12" />
        <button
          type="button"
          className="px-3.5 py-1.5 text-sm font-medium text-text-secondary/75 hover:text-text-primary hover:bg-background-surface/25 rounded-xl transition-all duration-300"
        >
          Export
        </button>
      </div>
    </header>
  );
}
