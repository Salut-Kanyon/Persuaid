"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

export function Header() {
  const { isRecording, setRecording, audioInputDeviceId, setAudioInputDeviceId } = useSession();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0);
      return;
    }
    const t = setInterval(() => setElapsedSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

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

  return (
    <header className="h-14 bg-background-elevated/35 backdrop-blur-2xl border-b border-border/8 flex items-center justify-between px-5">
      <div className="flex items-center gap-4 flex-wrap">
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
        <div className="hidden sm:flex items-center gap-2">
          <label htmlFor="header-audio-input" className="text-xs text-text-dim/80 whitespace-nowrap">
            Listen from:
          </label>
          <select
            id="header-audio-input"
            name="audioInputDevice"
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
            "group relative overflow-hidden rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold tracking-tight transition-[filter,box-shadow] duration-300 flex items-center gap-1.5",
            isRecording
              ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15 shadow-md"
              : [
                  "border border-white/25 bg-gradient-to-br from-[#5eead4] via-[#20D3A6] to-[#0f766e] text-[#04110D]",
                  "shadow-[0_4px_18px_rgba(32,211,166,0.35),0_0_24px_-8px_rgba(45,212,191,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
                  "ring-1 ring-[#20D3A6]/50 ring-offset-1 ring-offset-background",
                  "hover:brightness-[1.05] hover:shadow-[0_6px_26px_rgba(32,211,166,0.45),0_0_32px_-4px_rgba(45,212,191,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]",
                ]
          )}
        >
          {isRecording ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <span
                className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <span className="relative z-[1]">Start Call</span>
              <span
                className="relative z-[1] inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#04110D]/30"
                aria-hidden
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-[#04110D]/25" />
              </span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
