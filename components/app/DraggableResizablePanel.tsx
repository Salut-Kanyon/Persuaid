"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
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
  defaultPosition: PanelPosition;
  minWidth?: number;
  minHeight?: number;
  onPositionChange?: (position: PanelPosition) => void;
  className?: string;
  header: ReactNode;
  actions?: ReactNode;
}

export function DraggableResizablePanel({
  id,
  children,
  defaultPosition,
  minWidth = 300,
  minHeight = 200,
  onPositionChange,
  className,
  header,
  actions,
}: DraggableResizablePanelProps) {
  const [position, setPosition] = useState<PanelPosition>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(position);
    }
  }, [position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent, type: "drag" | string) => {
    if (type === "drag") {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    } else {
      setIsResizing(type);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    }
    e.preventDefault();
  };

  useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!panelRef.current) return;

    const container = panelRef.current.closest('.workspace-container') || panelRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        setPosition((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(newX, containerRect.width - prev.width)),
          y: Math.max(0, Math.min(newY, containerRect.height - prev.height)),
        }));
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setPosition((prev) => {
          let newWidth = prev.width;
          let newHeight = prev.height;
          let newX = prev.x;
          let newY = prev.y;

          // Handle right edge resizing
          if (isResizing.includes("right")) {
            const maxWidth = containerRect.width - prev.x;
            newWidth = Math.max(minWidth, Math.min(prev.width + deltaX, maxWidth));
          }
          
          // Handle left edge resizing
          if (isResizing.includes("left")) {
            const widthChange = deltaX;
            const minX = 0;
            const maxWidthChange = prev.width - minWidth;
            const constrainedChange = Math.max(-maxWidthChange, Math.min(widthChange, prev.x - minX));
            newWidth = prev.width - constrainedChange;
            newX = prev.x + constrainedChange;
          }
          
          // Handle bottom edge resizing
          if (isResizing.includes("bottom")) {
            const maxHeight = containerRect.height - prev.y;
            newHeight = Math.max(minHeight, Math.min(prev.height + deltaY, maxHeight));
          }
          
          // Handle top edge resizing
          if (isResizing.includes("top")) {
            const heightChange = deltaY;
            const minY = 0;
            const maxHeightChange = prev.height - minHeight;
            const constrainedChange = Math.max(-maxHeightChange, Math.min(heightChange, prev.y - minY));
            newHeight = prev.height - constrainedChange;
            newY = prev.y + constrainedChange;
          }

          return {
            x: Math.max(0, Math.min(newX, containerRect.width - minWidth)),
            y: Math.max(0, Math.min(newY, containerRect.height - minHeight)),
            width: Math.max(minWidth, Math.min(newWidth, containerRect.width)),
            height: Math.max(minHeight, Math.min(newHeight, containerRect.height)),
          };
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = isDragging ? "move" : isResizing?.includes("right") || isResizing?.includes("left") ? "ew-resize" : isResizing?.includes("bottom") || isResizing?.includes("top") ? "ns-resize" : "nwse-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, isResizing, dragStart, minWidth, minHeight]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute",
        "bg-background-surface/25 backdrop-blur-2xl",
        "border border-border/12",
        "rounded-3xl",
        "shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)]",
        "overflow-hidden",
        "transition-all duration-300",
        "z-10",
        isDragging && "shadow-[0_20px_64px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] z-30 scale-[1.005]",
        isResizing && "z-30",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
    >
      {/* Header with drag handle */}
      <div
        className={cn(
          "h-14 px-5 border-b border-border/8 flex items-center justify-between bg-background-elevated/15 backdrop-blur-xl cursor-move select-none",
          "hover:bg-background-elevated/20 transition-colors duration-200",
          isDragging && "bg-background-elevated/25"
        )}
        onMouseDown={(e) => handleMouseDown(e, "drag")}
      >
        <div className="flex items-center gap-3 flex-1">{header}</div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ height: `calc(100% - 3.5rem)` }}>
        {children}
      </div>

      {/* Resize handles - corners */}
      <div
        className="absolute top-0 right-0 w-3 h-3 cursor-nwse-resize z-30 hover:bg-green-primary/8 rounded-tl-3xl transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-top-right"); }}
      />
      <div
        className="absolute top-0 left-0 w-3 h-3 cursor-nesw-resize z-30 hover:bg-green-primary/8 rounded-tr-3xl transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-top-left"); }}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-30 hover:bg-green-primary/8 rounded-bl-3xl transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-bottom-right"); }}
      />
      <div
        className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-30 hover:bg-green-primary/8 rounded-br-3xl transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-bottom-left"); }}
      />
      {/* Resize handles - edges */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 cursor-ns-resize z-30 hover:bg-green-primary/8 rounded-full transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-top"); }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 cursor-ns-resize z-30 hover:bg-green-primary/8 rounded-full transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-bottom"); }}
      />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-12 cursor-ew-resize z-30 hover:bg-green-primary/8 rounded-full transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-left"); }}
      />
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-12 cursor-ew-resize z-30 hover:bg-green-primary/8 rounded-full transition-colors opacity-0 hover:opacity-100"
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-right"); }}
      />
    </div>
  );
}
