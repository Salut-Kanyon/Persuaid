"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";

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
    audioInputDeviceId,
    setAudioInputDeviceId,
    callParticipantName,
    setCallParticipantName,
  } = useSession();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0);
      return;
    }
    const t = setInterval(() => setElapsedSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && !callParticipantName) setCallParticipantName("Prospect");
  }, [isRecording, callParticipantName, setCallParticipantName]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (mounted) setAudioInputs(devices.filter((d) => d.kind === "audioinput"));
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, [isRecording]);

  const handleAudioInputChange = (deviceId: string) => {
    setAudioInputDeviceId(deviceId === "" ? null : deviceId);
    if (isRecording) {
      setRecording(false);
      setTimeout(() => setRecording(true), 200);
    }
  };

  const startEditName = () => {
    setNameInput(callParticipantName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const saveEditName = () => {
    const trimmed = nameInput.trim();
    setCallParticipantName(trimmed || "Prospect");
    setEditingName(false);
  };

  return (
    <header className="h-14 bg-background-elevated/35 backdrop-blur-2xl border-b border-border/8 flex items-center justify-between px-5">
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/"
          className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
        >
          ← Landing
        </Link>
        <div className="h-3.5 w-px bg-border/12" />
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-dim/60">Call with</span>
          {isRecording ? (
            editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveEditName}
                onKeyDown={(e) => e.key === "Enter" && saveEditName()}
                className="w-28 px-2 py-0.5 text-sm font-medium rounded bg-background-surface border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-green-primary/40"
                placeholder="Name"
              />
            ) : (
              <button
                type="button"
                onClick={startEditName}
                className="text-sm font-medium text-text-primary hover:underline"
              >
                {callParticipantName || "Prospect"}
              </button>
            )
          ) : (
            <span className="text-sm text-text-dim/70">—</span>
          )}
        </div>
        <div className="h-3.5 w-px bg-border/12 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2">
          <label htmlFor="header-audio-input" className="text-xs text-text-dim/80 whitespace-nowrap">
            Listen from:
          </label>
          <select
            id="header-audio-input"
            value={audioInputDeviceId ?? ""}
            onChange={(e) => handleAudioInputChange(e.target.value)}
            className="rounded-lg border border-border/60 bg-background-surface/60 px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-primary/40 max-w-[180px]"
          >
            <option value="">Default</option>
            {audioInputs.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setRecording(!isRecording)}
          className={cn(
            "px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg",
            isRecording
              ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15"
              : "bg-black border border-green-primary/60 text-white hover:bg-gray-900 hover:border-green-primary/80 hover:shadow-xl"
          )}
        >
          {isRecording ? (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <img
                src="/PersuaidLogo.png"
                alt="Persuaid"
                className="w-4 h-4 flex-shrink-0 object-contain"
              />
              <span className="text-white">Start Call</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
