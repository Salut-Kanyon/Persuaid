"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-background-surface/40 border border-border/50 overflow-hidden",
        className
      )}
    >
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {description ? (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        ) : null}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

