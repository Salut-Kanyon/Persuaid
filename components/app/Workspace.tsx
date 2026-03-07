"use client";

import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { DraggableResizablePanel } from "./DraggableResizablePanel";
import { TranscriptPanel } from "./panels/TranscriptPanel";
import { AISuggestionsPanel } from "./panels/AISuggestionsPanel";
import { ScriptPanel } from "./panels/ScriptPanel";
import { NotesPanel } from "./panels/NotesPanel";
import { LiveTranscription } from "./LiveTranscription";
import { AISuggestionsFetcher } from "./AISuggestionsFetcher";
import { cn } from "@/lib/utils";

interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PanelId = "transcript" | "aiSuggestions" | "script" | "notes";

export const WORKSPACE_PANELS: { id: PanelId; label: string }[] = [
  { id: "transcript", label: "Q&A" },
  { id: "aiSuggestions", label: "Suggestions" },
  { id: "script", label: "Script" },
  { id: "notes", label: "Notes" },
];

export const DEFAULT_PANEL_VISIBILITY: Record<PanelId, boolean> = { transcript: true, aiSuggestions: true, script: true, notes: true };

function computeLayout(containerWidth: number, containerHeight: number) {
  const pad = 16;
  const gap = 16;
  const w = Math.max(400, containerWidth - pad * 2);
  const h = Math.max(300, containerHeight - pad * 2);
  const topHeight = (h - gap) * 0.6;
  const bottomHeight = (h - gap) * 0.4;
  const leftWidth = (w - gap) * 0.5;
  const rightWidth = (w - gap) * 0.5;

  return {
    transcript: { x: pad, y: pad, width: leftWidth, height: topHeight },
    script: { x: pad + leftWidth + gap, y: pad, width: rightWidth, height: topHeight },
    aiSuggestions: { x: pad, y: pad + topHeight + gap, width: leftWidth, height: bottomHeight },
    notes: { x: pad + leftWidth + gap, y: pad + topHeight + gap, width: rightWidth, height: bottomHeight },
  };
}

const DEFAULT_LAYOUT = computeLayout(1280, 800);

function MinimizeButton({ onMinimize }: { onMinimize: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onMinimize(); }}
      className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-colors text-text-dim/70 hover:text-text-primary"
      title="Minimize panel"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    </button>
  );
}

export function WorkspacePanelsControl({
  panelVisibility,
  setPanelVisibility,
}: {
  panelVisibility: Record<PanelId, boolean>;
  setPanelVisibility: React.Dispatch<React.SetStateAction<Record<PanelId, boolean>>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visibleCount = Object.values(panelVisibility).filter(Boolean).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
          "bg-background-surface/60 hover:bg-background-surface/80 border border-border/50 text-text-primary"
        )}
        title="Toggle panels"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Panels ({visibleCount}/4)
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 py-1.5 min-w-[180px] rounded-xl bg-background-elevated border border-border shadow-lg z-50">
          {WORKSPACE_PANELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanelVisibility((prev) => ({ ...prev, [id]: !prev[id] }))}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-text-primary hover:bg-background-surface/50 transition-colors"
            >
              <span className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", panelVisibility[id] ? "bg-green-primary/20 border-green-primary/50" : "border-border")}>
                {panelVisibility[id] && <svg className="w-2.5 h-2.5 text-green-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface WorkspaceProps {
  panelVisibility: Record<PanelId, boolean>;
  setPanelVisibility: React.Dispatch<React.SetStateAction<Record<PanelId, boolean>>>;
}

export function Workspace({ panelVisibility, setPanelVisibility }: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelPositions, setPanelPositions] = useState<Record<string, PanelPosition>>(DEFAULT_LAYOUT);
  const [minimizedPanels, setMinimizedPanels] = useState<Record<PanelId, boolean>>({
    transcript: false,
    aiSuggestions: false,
    script: false,
    notes: false,
  });
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const panelPickerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 200) return;
    setPanelPositions(computeLayout(rect.width, rect.height));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelPickerRef.current && !panelPickerRef.current.contains(e.target as Node)) {
        setPanelPickerOpen(false);
      }
    };
    if (panelPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [panelPickerOpen]);

  const handlePositionChange = (id: string, position: PanelPosition) => {
    setPanelPositions((prev) => ({ ...prev, [id]: position }));
  };

  const setVisible = (id: PanelId, visible: boolean) => {
    setPanelVisibility((prev) => ({ ...prev, [id]: visible }));
  };

  const toggleMinimize = (id: PanelId) => {
    setMinimizedPanels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBackgroundDoubleClick = (e: React.MouseEvent) => {
    // Only open if clicking directly on the background (not on a panel)
    if (e.target === e.currentTarget) {
      setPanelPickerOpen(true);
    }
  };

  const visibleCount = Object.values(panelVisibility).filter(Boolean).length;

  return (
    <div 
      ref={containerRef} 
      className="workspace-container relative h-full w-full min-h-0 min-w-0 bg-transparent overflow-hidden border-b border-border"
      onDoubleClick={handleBackgroundDoubleClick}
    >
      <LiveTranscription />
      <AISuggestionsFetcher />
      {visibleCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-text-muted text-sm">All panels hidden. Double-click the background to show panels.</p>
        </div>
      )}

      {/* Panel Picker - appears on double-click */}
      {panelPickerOpen && (
        <div 
          ref={panelPickerRef}
          className="absolute inset-0 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-background-elevated/95 backdrop-blur-2xl border border-border/20 rounded-3xl shadow-2xl p-6 min-w-[320px] max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Panel Manager</h3>
              <button
                type="button"
                onClick={() => setPanelPickerOpen(false)}
                className="p-2 hover:bg-background-surface/30 rounded-xl transition-colors text-text-dim/70 hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {WORKSPACE_PANELS.map(({ id, label }) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 rounded-xl bg-background-surface/30 border border-border/15 hover:bg-background-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", panelVisibility[id] ? "bg-green-primary/20 border-green-primary/50" : "border-border")}>
                      {panelVisibility[id] && <svg className="w-2.5 h-2.5 text-green-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{label}</span>
                    {panelVisibility[id] && minimizedPanels[id] && (
                      <span className="text-xs text-text-dim/60">(Minimized)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {panelVisibility[id] && (
                      <button
                        type="button"
                        onClick={() => toggleMinimize(id)}
                        className="p-1.5 hover:bg-background-surface/50 rounded-lg transition-colors text-text-dim/70 hover:text-text-primary"
                        title={minimizedPanels[id] ? "Expand" : "Minimize"}
                      >
                        {minimizedPanels[id] ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setVisible(id, !panelVisibility[id]);
                        if (panelVisibility[id]) {
                          setMinimizedPanels((prev) => ({ ...prev, [id]: false }));
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: panelVisibility[id] ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: panelVisibility[id] ? "rgb(248, 113, 113)" : "rgb(16, 185, 129)",
                      }}
                    >
                      {panelVisibility[id] ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {panelVisibility.transcript && (
      <DraggableResizablePanel
        id="transcript"
        position={panelPositions.transcript}
        minWidth={280}
        minHeight={200}
        onPositionChange={(pos) => handlePositionChange("transcript", pos)}
        className="bg-background-surface/28"
        minimized={minimizedPanels.transcript}
        onMinimizeToggle={() => toggleMinimize("transcript")}
        headerClassName="bg-green-primary/10 border-green-primary/20"
        header={
          <>
            <svg className="w-4 h-4 text-green-primary animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">AI Live Transcript</h2>
          </>
        }
        actions={
          <>
            {!minimizedPanels.transcript && (
              <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary group" title="Download">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            <MinimizeButton onMinimize={() => toggleMinimize("transcript")} />
          </>
        }
      >
        <TranscriptPanel />
      </DraggableResizablePanel>
      )}

      {panelVisibility.aiSuggestions && (
      <DraggableResizablePanel
        id="aiSuggestions"
        position={panelPositions.aiSuggestions}
        minWidth={280}
        minHeight={200}
        onPositionChange={(pos) => handlePositionChange("aiSuggestions", pos)}
        className="bg-background-surface/28"
        minimized={minimizedPanels.aiSuggestions}
        onMinimizeToggle={() => toggleMinimize("aiSuggestions")}
        header={
          <>
            <div className="w-6 h-6 rounded-xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-text-primary tracking-tight">Suggestions</h2>
          </>
        }
        actions={
          <MinimizeButton onMinimize={() => toggleMinimize("aiSuggestions")} />
        }
      >
        <AISuggestionsPanel />
      </DraggableResizablePanel>
      )}

      {panelVisibility.script && (
      <DraggableResizablePanel
        id="script"
        position={panelPositions.script}
        minWidth={240}
        minHeight={160}
        onPositionChange={(pos) => handlePositionChange("script", pos)}
        className="bg-background-surface/20"
        minimized={minimizedPanels.script}
        onMinimizeToggle={() => toggleMinimize("script")}
        header={
          <>
            <div className="w-6 h-6 rounded-xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-text-primary tracking-tight">Script</h2>
          </>
        }
        actions={
          <MinimizeButton onMinimize={() => toggleMinimize("script")} />
        }
      >
        <ScriptPanel />
      </DraggableResizablePanel>
      )}

      {panelVisibility.notes && (
      <DraggableResizablePanel
        id="notes"
        position={panelPositions.notes}
        minWidth={240}
        minHeight={160}
        onPositionChange={(pos) => handlePositionChange("notes", pos)}
        className="bg-background-surface/18"
        minimized={minimizedPanels.notes}
        onMinimizeToggle={() => toggleMinimize("notes")}
        header={
          <>
            <div className="w-6 h-6 rounded-xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-text-primary tracking-tight">Notes</h2>
          </>
        }
        actions={
          <MinimizeButton onMinimize={() => toggleMinimize("notes")} />
        }
      >
        <NotesPanel />
      </DraggableResizablePanel>
      )}
    </div>
  );
}
