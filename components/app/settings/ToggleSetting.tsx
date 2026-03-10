"use client";

import { SettingsItem } from "./SettingsItem";
import { cn } from "@/lib/utils";

export function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SettingsItem
      label={label}
      description={description}
      control={
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            checked
              ? "bg-green-primary/25 border-green-primary/40"
              : "bg-background-elevated/60 border-border/50"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-text-primary transition-transform",
              checked ? "translate-x-5" : "translate-x-1"
            )}
          />
        </button>
      }
    />
  );
}

