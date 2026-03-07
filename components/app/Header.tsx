"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const [isRecording, setIsRecording] = useState(true);

  return (
    <header className="h-14 bg-background-elevated/35 backdrop-blur-2xl border-b border-border/8 flex items-center justify-between px-5">
      {/* Left: Session info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                isRecording 
                  ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                  : "bg-text-dim/50"
              )}></div>
              {isRecording && (
                <div className="absolute inset-0 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping opacity-60"></div>
              )}
            </div>
            <span className="text-sm font-medium text-text-primary">
              {isRecording ? "Recording" : "Paused"}
            </span>
          </div>
          <div className="h-3.5 w-px bg-border/12"></div>
          <span className="text-sm text-text-muted/70 font-mono tracking-wider">02:34:12</span>
        </div>
        <div className="h-3.5 w-px bg-border/12"></div>
        <div className="text-sm text-text-secondary/75">
          <span className="text-text-dim/60">Call with</span>{" "}
          <span className="font-medium text-text-primary">Sarah Chen</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <button className="px-3.5 py-1.5 text-sm font-medium text-text-secondary/75 hover:text-text-primary hover:bg-background-surface/25 rounded-xl transition-all duration-300">
          Pause
        </button>
        <button className="px-3.5 py-1.5 text-sm font-medium text-text-secondary/75 hover:text-text-primary hover:bg-background-surface/25 rounded-xl transition-all duration-300">
          End Call
        </button>
        <div className="h-4 w-px bg-border/12"></div>
        <button className="px-3.5 py-1.5 bg-green-primary/90 text-white text-sm font-medium rounded-xl hover:bg-green-primary transition-all duration-300 shadow-[0_6px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)]">
          Export
        </button>
      </div>
    </header>
  );
}
