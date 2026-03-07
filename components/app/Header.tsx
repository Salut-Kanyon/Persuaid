"use client";

import { useState } from "react";

export function Header() {
  const [isRecording, setIsRecording] = useState(true);

  return (
    <header className="h-16 bg-background-elevated border-b border-border/50 flex items-center justify-between px-6">
      {/* Left: Session info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={isRecording ? "w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" : "w-2.5 h-2.5 bg-text-dim rounded-full"}></div>
            <span className="text-sm font-medium text-text-primary">
              {isRecording ? "Recording" : "Paused"}
            </span>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <span className="text-sm text-text-dim font-mono">02:34:12</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="text-sm text-text-secondary">
          <span className="text-text-dim">Call with</span>{" "}
          <span className="font-medium text-text-primary">Sarah Chen</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-surface rounded-lg transition-colors">
          Pause
        </button>
        <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-surface rounded-lg transition-colors">
          End Call
        </button>
        <div className="h-6 w-px bg-border/50"></div>
        <button className="px-4 py-2 bg-green-primary text-white text-sm font-semibold rounded-lg hover:bg-green-dark transition-all duration-200 shadow-button hover:shadow-button-hover">
          Export
        </button>
      </div>
    </header>
  );
}
