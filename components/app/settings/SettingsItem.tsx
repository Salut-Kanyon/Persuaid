"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsItem({
  label,
  description,
  control,
  className,
}: {
  label: string;
  description?: string;
  control?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-6 py-2", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description ? (
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
        ) : null}
      </div>
      {control ? <div className="flex-shrink-0">{control}</div> : null}
    </div>
  );
}

