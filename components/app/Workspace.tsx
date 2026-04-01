"use client";

import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { DraggableResizablePanel } from "./DraggableResizablePanel";
import { FollowUpPanel } from "./panels/FollowUpPanel";
import { LiveTranscriptPanel } from "./panels/LiveTranscriptPanel";
import { NotesPanel } from "./panels/NotesPanel";
import { LiveTranscription } from "./LiveTranscription";
import { FollowUpFetcher } from "./FollowUpFetcher";
import { DealContextFetcher } from "./DealContextFetcher";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";
interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PanelId = "followUp" | "transcript" | "notes";

export const WORKSPACE_PANELS: { id: PanelId; label: string }[] = [
  { id: "followUp", label: "Follow-up" },
  { id: "transcript", label: "Live transcript" },
  { id: "notes", label: "Notes" },
];

export const DEFAULT_PANEL_VISIBILITY: Record<PanelId, boolean> = { followUp: true, transcript: false, notes: true };

function computeLayout(containerWidth: number, containerHeight: number) {
  const pad = 16;
  const gap = 16;
  const w = Math.max(400, containerWidth - pad * 2);
  const h = Math.max(300, containerHeight - pad * 2);
  const leftWidth = (w - gap) * 0.5;
  const rightWidth = (w - gap) * 0.5;
  const totalLeft = h - gap;
  const topH = totalLeft * 0.52;
  const bottomH = totalLeft * 0.48;
  return {
    followUp: { x: pad, y: pad, width: leftWidth, height: topH },
    transcript: { x: pad, y: pad + topH + gap, width: leftWidth, height: bottomH },
    notes: { x: pad + leftWidth + gap, y: pad, width: rightWidth, height: h },
  };
}

const DEFAULT_LAYOUT = computeLayout(1280, 800);

function MinimizeButton({ onMinimize }: { onMinimize: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onMinimize(); }}
      className="rounded-xl p-2 text-text-dim/65 transition-colors duration-300 ease-out hover:bg-white/[0.06] hover:text-text-primary"
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
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-normal text-text-primary transition-colors duration-300 ease-out",
          "bg-white/[0.06] hover:bg-white/[0.09]"
        )}
        title="Toggle panels"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Panels ({visibleCount}/3)
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-white/[0.08] bg-background-elevated/92 py-1 backdrop-blur-2xl">
          {WORKSPACE_PANELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanelVisibility((prev) => ({ ...prev, [id]: !prev[id] }))}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm font-normal text-text-primary transition-colors duration-200 ease-out hover:bg-white/[0.06]"
            >
              <span className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", panelVisibility[id] ? "border-white/25 bg-white/[0.08]" : "border-border")}>
                {panelVisibility[id] && <svg className="w-2.5 h-2.5 text-text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
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
  const { isRecording } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelPositions, setPanelPositions] = useState<Record<string, PanelPosition>>(DEFAULT_LAYOUT);
  const [minimizedPanels, setMinimizedPanels] = useState<Record<PanelId, boolean>>({
    followUp: false,
    transcript: false,
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
      className="workspace-container relative h-full min-h-0 w-full min-w-0 overflow-hidden bg-transparent"
      onDoubleClick={isRecording ? handleBackgroundDoubleClick : undefined}
    >
      <LiveTranscription />
      <FollowUpFetcher />
      <DealContextFetcher />

      {visibleCount === 0 && isRecording && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-text-muted text-sm">All panels hidden. Double-click the background to show panels.</p>
        </div>
      )}

      {/* Panel Picker - appears on double-click */}
      {panelPickerOpen && isRecording && (
        <div 
          ref={panelPickerRef}
          className="absolute inset-0 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-[320px] max-w-md rounded-2xl border border-white/[0.1] bg-background-elevated/88 p-5 backdrop-blur-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-medium tracking-tight text-text-primary">Panels</h3>
              <button
                type="button"
                onClick={() => setPanelPickerOpen(false)}
                className="rounded-lg p-1.5 text-text-dim/60 transition-colors duration-300 ease-out hover:bg-white/[0.06] hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {WORKSPACE_PANELS.map(({ id, label }) => (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors duration-300 ease-out hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-white/[0.12]", panelVisibility[id] ? "bg-white/[0.06]" : "border-white/[0.08] bg-transparent")}>
                      {panelVisibility[id] && <svg className="w-2.5 h-2.5 text-text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </span>
                    <span className="text-sm font-normal text-text-primary">{label}</span>
                    {panelVisibility[id] && minimizedPanels[id] && (
                      <span className="text-xs text-text-dim/60">(Minimized)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {panelVisibility[id] && (
                      <button
                        type="button"
                        onClick={() => toggleMinimize(id)}
                        className="rounded-lg p-1.5 text-text-dim/60 transition-colors duration-300 ease-out hover:bg-white/[0.06] hover:text-text-primary"
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
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-normal transition-colors duration-300 ease-out",
                        panelVisibility[id]
                          ? "text-red-400/85 hover:bg-red-500/[0.08]"
                          : "text-text-secondary hover:bg-white/[0.06]"
                      )}
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

      {/* Pre-call: fixed layout (not draggable). Stays mounted but `hidden` during a call so NotesPanel state is preserved. */}
      <div
        className={cn(
          "absolute inset-0 z-[5] flex min-h-0 flex-col px-3 py-3 sm:px-6 sm:py-4",
          isRecording && "hidden"
        )}
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[min(88rem,calc(100vw-1.75rem))] flex-col gap-3 sm:gap-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-background-surface/12 backdrop-blur-3xl backdrop-saturate-150 sm:rounded-[1.25rem]">
            <div className="flex shrink-0 flex-col gap-0.5 px-4 py-2.5 sm:px-6 sm:py-3">
              <h2 className="text-sm font-medium tracking-tight text-text-primary">Add Your Knowledge</h2>
              <p className="text-xs leading-snug text-text-muted">
                Notes on policies, pricing notes, rates, and more.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <NotesPanel />
            </div>
          </div>
        </div>
      </div>

      {/* During a call the main dashboard is hidden; these panels stay mounted for a smooth return to pre-call. */}
      {isRecording && (
        <>
          {panelVisibility.followUp && (
            <DraggableResizablePanel
              id="followUp"
              position={panelPositions.followUp}
              minWidth={280}
              minHeight={200}
              onPositionChange={(pos) => handlePositionChange("followUp", pos)}
              className="bg-background-surface/12"
              minimized={minimizedPanels.followUp}
              onMinimizeToggle={() => toggleMinimize("followUp")}
              header={
                <>
                  <svg className="h-4 w-4 shrink-0 text-text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="text-sm font-medium tracking-tight text-text-primary">What to say next</h2>
                </>
              }
              actions={<MinimizeButton onMinimize={() => toggleMinimize("followUp")} />}
            >
              <FollowUpPanel />
            </DraggableResizablePanel>
          )}

          {panelVisibility.transcript && (
            <DraggableResizablePanel
              id="transcript"
              position={panelPositions.transcript}
              minWidth={280}
              minHeight={160}
              onPositionChange={(pos) => handlePositionChange("transcript", pos)}
              className="bg-background-surface/12"
              minimized={minimizedPanels.transcript}
              onMinimizeToggle={() => toggleMinimize("transcript")}
              header={
                <>
                  <svg className="h-4 w-4 text-text-dim/55" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                  <h2 className="text-sm font-medium tracking-tight text-text-primary">Live transcript</h2>
                </>
              }
              actions={<MinimizeButton onMinimize={() => toggleMinimize("transcript")} />}
            >
              <LiveTranscriptPanel />
            </DraggableResizablePanel>
          )}
        </>
      )}
    </div>
  );
}
