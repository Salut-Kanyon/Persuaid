"use client";

import { useEffect, useState } from "react";
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
  const { isRecording, setRecording } = useSession();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0);
      return;
    }
    const t = setInterval(() => setElapsedSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  return (
    <header className="h-14 bg-background-elevated/35 backdrop-blur-2xl border-b border-border/8 flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
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
        <div className="text-sm text-text-secondary/75">
          <span className="text-text-dim/60">Call with</span>{" "}
          <span className="font-medium text-text-primary">Sarah Chen</span>
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
