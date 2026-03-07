"use client";

import { useSession } from "@/components/app/contexts/SessionContext";

function getInitials(name: string | undefined, speaker: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  }
  return speaker === "user" ? "You" : "??";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function TranscriptPanel() {
  const { transcript, isRecording } = useSession();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-text-muted">
              {isRecording
                ? "Speaking will appear here as you talk…"
                : "Start recording to see the live transcript."}
            </p>
          </div>
        ) : (
          transcript.map((message) => (
            <div key={message.id} className="flex gap-4 group">
              <div
                className={
                  message.speaker === "user"
                    ? "w-12 h-12 rounded-3xl bg-gradient-to-br from-green-primary/20 to-green-primary/8 border border-green-primary/15 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                    : "w-12 h-12 rounded-3xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                }
              >
                <span
                  className={
                    message.speaker === "user"
                      ? "text-green-primary text-xs font-semibold"
                      : "text-text-muted text-xs font-semibold"
                  }
                >
                  {getInitials(message.name, message.speaker)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs font-medium text-text-primary">
                    {message.name ?? (message.speaker === "user" ? "You" : "Prospect")}
                  </span>
                  <span className="text-[10px] text-text-dim/60 font-mono tracking-wider">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary/90 leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
