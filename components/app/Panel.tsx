import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  actions?: ReactNode;
}

export function Panel({ children, className, header, actions }: PanelProps) {
  return (
    <div
      className={cn(
        "h-full flex flex-col",
        "bg-background-surface/40 backdrop-blur-xl",
        "border border-border/30",
        "rounded-2xl",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
        "overflow-hidden",
        className
      )}
    >
      {header && (
        <div className="h-16 px-6 border-b border-border/20 flex items-center justify-between bg-background-elevated/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">{header}</div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
