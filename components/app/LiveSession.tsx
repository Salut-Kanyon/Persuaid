"use client";

import { useState, useRef, useEffect } from "react";
import { TranscriptPanel } from "./panels/TranscriptPanel";
import { AISuggestionsPanel } from "./panels/AISuggestionsPanel";
import { ScriptPanel } from "./panels/ScriptPanel";
import { NotesPanel } from "./panels/NotesPanel";
import { cn } from "@/lib/utils";

export function LiveSession() {
  const [leftWidth, setLeftWidth] = useState(45); // Percentage for left column (transcript + script)
  const [topHeight, setTopHeight] = useState(55); // Percentage for top row (transcript + AI suggestions)
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (direction: "vertical" | "horizontal") => {
    setIsResizing(direction);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    if (isResizing === "vertical") {
      const newLeftWidth = (x / width) * 100;
      setLeftWidth(Math.max(30, Math.min(70, newLeftWidth)));
    } else if (isResizing === "horizontal") {
      const newTopHeight = (y / height) * 100;
      setTopHeight(Math.max(30, Math.min(70, newTopHeight)));
    }
  };

  const handleMouseUp = () => {
    setIsResizing(null);
  };

  useEffect(() => {
    const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
    const mouseUpHandler = () => handleMouseUp();

    if (isResizing) {
      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
      document.body.style.cursor = isResizing === "vertical" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const rightWidth = 100 - leftWidth;
  const bottomHeight = 100 - topHeight;

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex flex-col bg-background-near-black"
    >
      {/* Top Row */}
      <div className="flex min-h-0" style={{ height: `${topHeight}%` }}>
        {/* Transcript Panel */}
        <div className="h-full flex flex-col" style={{ width: `${leftWidth}%` }}>
          <TranscriptPanel />
        </div>

        {/* Vertical Resizer */}
        <div
          className={cn(
            "w-1 bg-border/50 hover:bg-green-primary/40 cursor-col-resize transition-colors relative group flex-shrink-0",
            isResizing === "vertical" && "bg-green-primary/60"
          )}
          onMouseDown={() => handleMouseDown("vertical")}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 -ml-4"></div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="h-full flex flex-col" style={{ width: `${rightWidth}%` }}>
          <AISuggestionsPanel />
        </div>
      </div>

      {/* Horizontal Resizer */}
      <div
        className={cn(
          "h-1 bg-border/50 hover:bg-green-primary/40 cursor-row-resize transition-colors relative group flex-shrink-0",
          isResizing === "horizontal" && "bg-green-primary/60"
        )}
        onMouseDown={() => handleMouseDown("horizontal")}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 -mt-4"></div>
      </div>

      {/* Bottom Row */}
      <div className="flex min-h-0" style={{ height: `${bottomHeight}%` }}>
        {/* Script Panel */}
        <div className="h-full flex flex-col" style={{ width: `${leftWidth}%` }}>
          <ScriptPanel />
        </div>

        {/* Vertical Resizer Spacer */}
        <div className="w-1 flex-shrink-0"></div>

        {/* Notes Panel */}
        <div className="h-full flex flex-col" style={{ width: `${rightWidth}%` }}>
          <NotesPanel />
        </div>
      </div>
    </div>
  );
}
