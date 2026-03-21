"use client";

import { SettingsItem } from "./SettingsItem";

export function DropdownSetting<T extends string>({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
  id,
  name,
}: {
  label: string;
  description?: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
  /** Stable id for label association and autofill tooling */
  id?: string;
  name?: string;
}) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const fieldId = id ?? `dropdown-setting-${slug}`;
  const fieldName = name ?? slug;

  return (
    <SettingsItem
      label={label}
      description={description}
      control={
        <select
          id={fieldId}
          name={fieldName}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          disabled={disabled}
          className="rounded-xl border border-border/60 bg-background-elevated/60 px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-green-primary/40 disabled:opacity-50"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      }
    />
  );
}

