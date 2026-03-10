import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatBlockProps {
  value: string;
  label: string;
  className?: string;
}

export function StatBlock({ value, label, className }: StatBlockProps) {
  return (
    <div className={cn("text-center group", className)}>
      <div className="text-5xl lg:text-6xl xl:text-7xl font-bold text-green-primary mb-3 tracking-tight group-hover:scale-105 transition-transform duration-300">
        {value}
      </div>
      <div className="text-text-muted text-sm lg:text-base font-medium">{label}</div>
    </div>
  );
}
