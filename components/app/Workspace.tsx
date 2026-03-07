"use client";

import { useState, useEffect, useRef } from "react";
import { DraggableResizablePanel } from "./DraggableResizablePanel";
import { TranscriptPanel } from "./panels/TranscriptPanel";
import { AISuggestionsPanel } from "./panels/AISuggestionsPanel";
import { ScriptPanel } from "./panels/ScriptPanel";
import { NotesPanel } from "./panels/NotesPanel";

interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Workspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelPositions, setPanelPositions] = useState<Record<string, PanelPosition>>({
    transcript: { x: 40, y: 40, width: 600, height: 500 },
    aiSuggestions: { x: 680, y: 40, width: 400, height: 500 },
    script: { x: 40, y: 580, width: 500, height: 300 },
    notes: { x: 580, y: 580, width: 500, height: 300 },
  });

  useEffect(() => {
    // Calculate initial positions based on container size
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Transcript: Core live tool - larger, more prominent
      const transcriptWidth = Math.min(700, Math.max(500, containerWidth * 0.52));
      const transcriptHeight = Math.min(600, Math.max(450, containerHeight * 0.65));
      
      // AI Suggestions: Core live tool - prominent but slightly smaller
      const aiWidth = Math.min(450, Math.max(350, containerWidth * 0.38));
      const aiHeight = Math.min(600, Math.max(450, containerHeight * 0.65));
      
      // Script: Secondary support tool - smaller
      const scriptWidth = Math.min(450, Math.max(320, containerWidth * 0.42));
      const scriptHeight = Math.min(280, Math.max(220, containerHeight * 0.32));
      
      // Notes: Secondary support tool - smaller, lighter
      const notesWidth = Math.min(450, Math.max(320, containerWidth * 0.42));
      const notesHeight = Math.min(280, Math.max(220, containerHeight * 0.32));

      setPanelPositions({
        transcript: {
          x: 32,
          y: 32,
          width: transcriptWidth,
          height: transcriptHeight,
        },
        aiSuggestions: {
          x: 32 + transcriptWidth + 24,
          y: 32,
          width: aiWidth,
          height: aiHeight,
        },
        script: {
          x: 32,
          y: 32 + transcriptHeight + 24,
          width: scriptWidth,
          height: scriptHeight,
        },
        notes: {
          x: 32 + scriptWidth + 24,
          y: 32 + transcriptHeight + 24,
          width: notesWidth,
          height: notesHeight,
        },
      });
    }
  }, []);

  const handlePositionChange = (id: string, position: PanelPosition) => {
    setPanelPositions((prev) => ({
      ...prev,
      [id]: position,
    }));
  };

  return (
    <div ref={containerRef} className="workspace-container relative h-full w-full bg-transparent overflow-hidden">
      {/* Floating panels */}
      <DraggableResizablePanel
        id="transcript"
        defaultPosition={panelPositions.transcript}
        minWidth={450}
        minHeight={400}
        onPositionChange={(pos) => handlePositionChange("transcript", pos)}
        className="bg-background-surface/28"
        header={
          <>
            <div className="relative">
              <div className="w-2 h-2 bg-green-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-primary rounded-full animate-ping opacity-60"></div>
            </div>
            <h2 className="text-sm font-medium text-text-primary tracking-tight">Live Transcript</h2>
          </>
        }
        actions={
          <>
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary group">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </>
        }
      >
        <TranscriptPanel />
      </DraggableResizablePanel>

      <DraggableResizablePanel
        id="aiSuggestions"
        defaultPosition={panelPositions.aiSuggestions}
        minWidth={320}
        minHeight={400}
        onPositionChange={(pos) => handlePositionChange("aiSuggestions", pos)}
        className="bg-background-surface/28"
        header={
          <>
            <div className="w-6 h-6 rounded-2xl bg-green-primary/12 border border-green-primary/15 flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-green-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-text-primary tracking-tight">AI Suggestions</h2>
          </>
        }
        actions={
          <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        }
      >
        <AISuggestionsPanel />
      </DraggableResizablePanel>

      <DraggableResizablePanel
        id="script"
        defaultPosition={panelPositions.script}
        minWidth={280}
        minHeight={200}
        onPositionChange={(pos) => handlePositionChange("script", pos)}
        className="bg-background-surface/20"
        header={
          <h2 className="text-sm font-medium text-text-primary tracking-tight">Script</h2>
        }
        actions={
          <>
            <button className="px-4 py-2 text-xs font-medium text-green-primary/90 hover:bg-green-primary/8 rounded-2xl transition-all duration-300 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </>
        }
      >
        <ScriptPanel />
      </DraggableResizablePanel>

      <DraggableResizablePanel
        id="notes"
        defaultPosition={panelPositions.notes}
        minWidth={280}
        minHeight={200}
        onPositionChange={(pos) => handlePositionChange("notes", pos)}
        className="bg-background-surface/18"
        header={
          <h2 className="text-sm font-medium text-text-primary tracking-tight">Notes</h2>
        }
        actions={
          <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        }
      >
        <NotesPanel />
      </DraggableResizablePanel>
    </div>
  );
}
