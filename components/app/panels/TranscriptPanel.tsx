"use client";

import { useState } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

const isElectron = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);

/** Only requests mic from the OS (no token/Deepgram). Use this to get the app to appear in System Settings → Microphone. */
async function requestMicrophoneOnly(): Promise<{ ok: boolean; message: string }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, message: "Microphone not supported here." };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, message: "Microphone access granted. You can start recording now." };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
    if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.includes("permission") || msg.includes("denied")) {
      return { ok: false, message: "Access denied. After you allow the app in System Settings → Microphone, click Request access again." };
    }
    if (name === "NotFoundError" || msg.includes("not found")) {
      return { ok: false, message: "No microphone found." };
    }
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

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
  const { transcript, isRecording, micError, setMicError, setRecording } = useSession();
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const handleRetryMic = () => {
    setMicError(null);
    setRequestStatus(null);
    setRecording(false);
    setTimeout(() => setRecording(true), 200);
  };

  const handleRequestAccess = async () => {
    setRequestStatus("Requesting…");
    const result = await requestMicrophoneOnly();
    setRequestStatus(result.message);
    if (result.ok) setMicError(null);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {micError && (
        <div className="flex-shrink-0 mx-4 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-3">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{micError}</p>
          <p className="text-xs text-text-muted">
            {isElectron ? (
              <>
                <strong>Desktop app:</strong> When you run from a terminal (Cursor or Terminal.app), macOS asks the <strong>terminal</strong> for mic access, not this app. To have <strong>Persuaid</strong> ask: run <code className="text-[11px] bg-amber-500/10 px-1 rounded">npm run pack</code>, then open <strong>Persuaid.app</strong> from the <code className="text-[11px] bg-amber-500/10 px-1 rounded">dist</code> folder in Finder. The mic prompt will go to Persuaid. Or use the app in your browser at <strong>localhost:3000</strong> for development.
              </>
            ) : (
              <>
                <strong>Browser:</strong> Click the lock or info icon in the address bar and set <strong>Microphone</strong> to Allow, or use your browser settings for this site.
              </>
            )}
          </p>
          {requestStatus && <p className="text-xs text-text-secondary">{requestStatus}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRequestAccess}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              Request microphone access
            </button>
            <button
              type="button"
              onClick={handleRetryMic}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
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
