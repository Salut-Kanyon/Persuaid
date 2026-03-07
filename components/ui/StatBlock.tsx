import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatBlockProps {
  value: string;
  label: string;
  className?: string;
}

export function StatBlock({ value, label, className }: StatBlockProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-4xl lg:text-5xl font-bold text-green-primary mb-2">
        {value}
      </div>
      <div className="text-text-muted text-sm lg:text-base">{label}</div>
    </div>
  );
}
