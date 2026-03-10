"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function AnalyticsCard({ label, value, icon, className }: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-background-surface/60 border border-border/50 p-5 transition-shadow hover:shadow-card",
        className
      )}
    >
      {icon ? (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-semibold text-text-primary mt-1 tabular-nums">{value}</p>
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-primary/10 border border-green-primary/20 flex items-center justify-center text-green-accent">
            {icon}
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-text-primary mt-1 tabular-nums">{value}</p>
        </>
      )}
    </div>
  );
}
