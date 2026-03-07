"use client";

import { useState, useLayoutEffect, useRef, useEffect } from "react";
import Link from "next/link";
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
  { id: "transcript", label: "Live Transcript" },
  { id: "aiSuggestions", label: "AI Suggestions" },
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
    aiSuggestions: { x: pad + leftWidth + gap, y: pad, width: rightWidth, height: topHeight },
    script: { x: pad, y: pad + topHeight + gap, width: leftWidth, height: bottomHeight },
    notes: { x: pad + leftWidth + gap, y: pad + topHeight + gap, width: rightWidth, height: bottomHeight },
  };
}

const DEFAULT_LAYOUT = computeLayout(1280, 800);

function HidePanelButton({ onHide }: { onHide: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onHide(); }}
      className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-colors text-text-dim/70 hover:text-text-primary"
      title="Hide panel"
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

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 200) return;
    setPanelPositions(computeLayout(rect.width, rect.height));
  }, []);

  const handlePositionChange = (id: string, position: PanelPosition) => {
    setPanelPositions((prev) => ({ ...prev, [id]: position }));
  };

  const setVisible = (id: PanelId, visible: boolean) => {
    setPanelVisibility((prev) => ({ ...prev, [id]: visible }));
  };

  const visibleCount = Object.values(panelVisibility).filter(Boolean).length;

  return (
    <div ref={containerRef} className="workspace-container relative h-full w-full min-h-0 min-w-0 bg-transparent overflow-hidden border-b border-border">
      <LiveTranscription />
      <AISuggestionsFetcher />
      {visibleCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-text-muted text-sm">All panels hidden. Use <strong className="text-text-primary">Panels</strong> in the header to show one.</p>
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
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary group" title="Download">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <HidePanelButton onHide={() => setVisible("transcript", false)} />
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary" title="More">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
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
          <>
            <HidePanelButton onHide={() => setVisible("aiSuggestions", false)} />
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary" title="More">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </>
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
        header={<h2 className="text-sm font-medium text-text-primary tracking-tight">Script</h2>}
        actions={
          <>
            <Link href="/dashboard/scripts" className="px-4 py-2 text-xs font-medium text-green-primary/90 hover:bg-green-primary/8 rounded-2xl transition-all duration-300 flex items-center gap-2" title="Manage scripts">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <HidePanelButton onHide={() => setVisible("script", false)} />
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary" title="More">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </>
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
        header={<h2 className="text-sm font-medium text-text-primary tracking-tight">Notes</h2>}
        actions={
          <>
            <Link href="/dashboard/notes" className="px-3 py-2 text-xs font-medium text-green-primary/90 hover:bg-green-primary/8 rounded-2xl transition-all duration-300 flex items-center gap-2" title="Manage notes">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <HidePanelButton onHide={() => setVisible("notes", false)} />
            <button className="p-2.5 hover:bg-background-surface/30 rounded-2xl transition-all duration-300 text-text-dim/70 hover:text-text-primary" title="More">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </>
        }
      >
        <NotesPanel />
      </DraggableResizablePanel>
      )}
    </div>
  );
}
