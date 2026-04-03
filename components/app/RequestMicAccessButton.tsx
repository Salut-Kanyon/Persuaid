"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { requestMicrophoneAccessFull } from "@/lib/mic-onboarding";

export type RequestMicAccessButtonVariant = "header" | "hud" | "panel";

const variantClass: Record<RequestMicAccessButtonVariant, string> = {
  header:
    "shrink-0 rounded-lg border border-white/[0.12] bg-background-elevated/30 px-2 py-1.5 text-[10px] font-medium text-text-secondary hover:bg-background-elevated/50 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary/35 disabled:cursor-wait disabled:opacity-60 sm:px-2.5 sm:text-[11px]",
  hud: "shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-white/75 transition-colors hover:bg-white/[0.1] hover:text-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 disabled:cursor-wait disabled:opacity-60",
  panel:
    "shrink-0 rounded-lg border border-white/[0.12] bg-background-elevated/30 px-2.5 py-1.5 text-[10px] font-medium text-text-secondary hover:bg-background-elevated/50 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary/35 disabled:cursor-wait disabled:opacity-60 sm:text-[11px]",
};

const TITLE =
  "Request microphone access (macOS: system + in-app). Use if Persuaid does not appear under System Settings → Microphone.";

export function RequestMicAccessButton({
  variant = "header",
  onAfterRequest,
  className,
  label = "Request mic access",
}: {
  variant?: RequestMicAccessButtonVariant;
  /** e.g. refresh `enumerateDevices` after a successful prompt */
  onAfterRequest?: () => void | Promise<void>;
  className?: string;
  /** Shorter label for HUD */
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(async () => {
    setBusy(true);
    try {
      await requestMicrophoneAccessFull();
      await onAfterRequest?.();
    } finally {
      setBusy(false);
    }
  }, [onAfterRequest]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleClick()}
      className={cn(variantClass[variant], className)}
      title={TITLE}
    >
      {busy ? "Requesting…" : label}
    </button>
  );
}
