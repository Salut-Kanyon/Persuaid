"use client";

import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableResizablePanelProps {
  id: string;
  children: ReactNode;
  position: PanelPosition;
  minWidth?: number;
  minHeight?: number;
  onPositionChange?: (position: PanelPosition) => void;
  className?: string;
  header: ReactNode;
  actions?: ReactNode;
  minimized?: boolean;
  onMinimizeToggle?: () => void;
  headerClassName?: string;
}

export function DraggableResizablePanel({
  children,
  position: positionProp,
  minWidth = 300,
  minHeight = 200,
  onPositionChange,
  className,
  header,
  actions,
  minimized = false,
  onMinimizeToggle,
  headerClassName,
}: DraggableResizablePanelProps) {
  const [livePosition, setLivePosition] = useState<PanelPosition>(positionProp);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingRef = useRef<PanelPosition | null>(null);
  const latestPositionRef = useRef<PanelPosition>(positionProp);

  const isInteracting = isDragging || isResizing;
  const displayPosition = isInteracting ? livePosition : positionProp;
  latestPositionRef.current = displayPosition;

  useLayoutEffect(() => {
    if (!isInteracting) setLivePosition(positionProp);
  }, [positionProp.x, positionProp.y, positionProp.width, positionProp.height, isInteracting]);

  const flush = () => {
    if (pendingRef.current === null) return;
    const next = pendingRef.current;
    pendingRef.current = null;
    latestPositionRef.current = next;
    setLivePosition(next);
  };

  const schedule = (next: PanelPosition) => {
    pendingRef.current = next;
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      flush();
    });
  };

  const handleMouseDown = (e: React.MouseEvent, type: "drag" | string) => {
    if (type === "drag") {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - positionProp.x, y: e.clientY - positionProp.y };
      setLivePosition(positionProp);
    } else {
      setIsResizing(type);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setLivePosition(positionProp);
    }
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const container = panelRef.current.closest(".workspace-container") || panelRef.current.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pos = latestPositionRef.current;
      const inset = 2;
      const maxX = Math.max(0, rect.width - inset);
      const maxY = Math.max(0, rect.height - inset);

      if (isDragging) {
        const newX = Math.max(inset, Math.min(e.clientX - dragStartRef.current.x, maxX - pos.width));
        const newY = Math.max(inset, Math.min(e.clientY - dragStartRef.current.y, maxY - pos.height));
        schedule({
          ...pos,
          x: newX,
          y: newY,
          width: Math.min(pos.width, maxX - newX),
          height: Math.min(pos.height, maxY - newY),
        });
      } else if (isResizing) {
        const dX = e.clientX - dragStartRef.current.x;
        const dY = e.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        let w = pos.width, h = pos.height, x = pos.x, y = pos.y;
        if (isResizing.includes("right")) w = Math.max(minWidth, Math.min(pos.width + dX, maxX - pos.x));
        if (isResizing.includes("left")) {
          const c = Math.max(-(pos.width - minWidth), Math.min(dX, pos.x - inset));
          w = pos.width - c;
          x = pos.x + c;
        }
        if (isResizing.includes("bottom")) h = Math.max(minHeight, Math.min(pos.height + dY, maxY - pos.y));
        if (isResizing.includes("top")) {
          const c = Math.max(inset - pos.y, Math.min(dY, pos.height - minHeight));
          h = pos.height - c;
          y = pos.y + c;
        }
        x = Math.max(inset, Math.min(x, maxX - minWidth));
        y = Math.max(inset, Math.min(y, maxY - minHeight));
        w = Math.max(minWidth, Math.min(w, maxX - x));
        h = Math.max(minHeight, Math.min(h, maxY - y));
        schedule({ x, y, width: w, height: h });
      }
    };

    const handleMouseUp = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      flush();
      onPositionChange?.(latestPositionRef.current);
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = isDragging ? "move" : "nwse-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, isResizing, minWidth, minHeight]);

  const minimizedHeight = 52; // Height when minimized (just header), matches h-[3.25rem]

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute will-change-transform",
        "bg-background-surface/12 backdrop-blur-3xl backdrop-saturate-150",
        "overflow-hidden rounded-2xl border border-white/[0.08] z-10",
        "shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
        !isInteracting && "transition-[transform,box-shadow] duration-300 ease-out",
        isDragging && "z-30 shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
        isResizing && "z-30",
        className
      )}
      style={{
        left: `${displayPosition.x}px`,
        top: `${displayPosition.y}px`,
        width: minimized ? `${Math.max(200, displayPosition.width)}px` : `${displayPosition.width}px`,
        height: minimized ? `${minimizedHeight}px` : `${displayPosition.height}px`,
      }}
    >
      <div
        className={cn(
          "flex h-[3.25rem] cursor-move select-none items-center justify-between border-b border-white/[0.06] px-4",
          "transition-colors duration-300 ease-out hover:bg-white/[0.03]",
          isDragging && "bg-white/[0.04]",
          minimized && "border-b-0",
          headerClassName || "bg-transparent"
        )}
        onMouseDown={(e) => handleMouseDown(e, "drag")}
      >
        <div className="flex items-center gap-3 flex-1">{header}</div>
        {actions && (
          <div className="flex items-center gap-1.5">
            {minimized && onMinimizeToggle ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimizeToggle();
                }}
                className="rounded-xl p-2 text-text-dim/65 transition-colors duration-300 ease-out hover:bg-white/[0.06] hover:text-text-primary"
                title="Expand panel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ) : (
              actions
            )}
          </div>
        )}
      </div>
      {!minimized && (
        <>
          <div className="flex-1 overflow-hidden" style={{ height: "calc(100% - 3.25rem)" }}>
            {children}
          </div>
          {/* Full-edge resize handles (full width/height, 8px grab zone) */}
          <div className="absolute inset-x-0 top-0 h-2 min-h-[8px] cursor-ns-resize z-20 hover:bg-white/[0.06]" style={{ marginTop: 0 }} onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-top"); }} />
          <div className="absolute inset-x-0 bottom-0 h-2 min-h-[8px] cursor-ns-resize z-20 hover:bg-white/[0.06]" style={{ marginBottom: 0 }} onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-bottom"); }} />
          <div className="absolute inset-y-0 left-0 w-2 min-w-[8px] cursor-ew-resize z-20 hover:bg-white/[0.06]" style={{ marginLeft: 0 }} onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-left"); }} />
          <div className="absolute inset-y-0 right-0 w-2 min-w-[8px] cursor-ew-resize z-20 hover:bg-white/[0.06]" style={{ marginRight: 0 }} onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-right"); }} />
          {/* Corner handles (on top so they take precedence) */}
          <div className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-30 hover:bg-white/[0.06] rounded-tl-3xl" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-top-right"); }} />
          <div className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-30 hover:bg-white/[0.06] rounded-tr-3xl" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-top-left"); }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 hover:bg-white/[0.06] rounded-bl-3xl" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-bottom-right"); }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-30 hover:bg-white/[0.06] rounded-br-3xl" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-bottom-left"); }} />
        </>
      )}
    </div>
  );
}
