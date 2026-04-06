"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";
import { isElectronApp } from "@/lib/electron-client";
import { RequestMicAccessButton } from "@/components/app/RequestMicAccessButton";
import { FREE_PLAN_MONTHLY_MINUTES } from "@/lib/usage";

/** Live Session hub only (`/dashboard`). Hide mic + Start PersuAId on Notes, Calls, Analytics, Settings. */
function isLiveSessionRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === "/dashboard";
}

export function Header() {
  const pathname = usePathname();
  const {
    isRecording,
    setRecording,
    audioInputDeviceId,
    setAudioInputDeviceId,
    notesDraftHasContent,
    hasAiNotesLayer,
  } = useSession();
  const { canStartLiveSession, usageLoading, openUpgradeModal, plan, remainingLiveMinutes } = useEntitlements();
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [startButtonHover, setStartButtonHover] = useState(false);

  const refreshAudioInputs = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter((d) => d.kind === "audioinput"));
    } catch (_) {}
  }, []);

  useEffect(() => {
    void refreshAudioInputs();
  }, [isRecording, refreshAudioInputs]);

  const limitTitle =
    usageLoading || canStartLiveSession
      ? undefined
      : plan === "pro"
        ? "Pro monthly listening limit reached — upgrade to Team or wait until next month"
        : plan === "team"
          ? "Team monthly limit reached — your allowance resets next month"
          : "You’ve used your included time this month — upgrade for more";

  const mustConnectAiBeforeStart =
    canStartLiveSession && notesDraftHasContent && !hasAiNotesLayer;

  const limitButtonLabel = (() => {
    if (usageLoading) return "Checking…";
    if (canStartLiveSession) return "Start Call";
    if (plan === "pro") return "View Team upgrade";
    if (plan === "team") return "Limit reached";
    return "Upgrade to continue";
  })();

  const startButtonTitle = (() => {
    if (usageLoading) return "Checking your plan allowance…";
    if (mustConnectAiBeforeStart)
      return "Press Connect to AI on your notes to start";
    return limitTitle;
  })();

  const startDisabled = usageLoading || mustConnectAiBeforeStart;
  const showStartHelpTooltip = startDisabled && startButtonHover;
  const startHelpTooltipId = "header-start-persuaid-help";

  const handleAudioInputChange = (deviceId: string) => {
    setAudioInputDeviceId(deviceId === "" ? null : deviceId);
    if (isRecording) {
      if (!canStartLiveSession) {
        if (!usageLoading) openUpgradeModal();
        return;
      }
      setRecording(false);
      setTimeout(() => setRecording(true), 200);
    }
  };

  if (isRecording) {
    return null;
  }

  if (!isLiveSessionRoute(pathname)) {
    return (
      <header
        className="h-12 shrink-0 bg-background-near-black sm:h-[3.25rem]"
        aria-hidden
      />
    );
  }

  return (
    <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 bg-background-near-black px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 justify-self-start sm:gap-3">
        {isElectronApp() && plan === "free" && !usageLoading && (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 tabular-nums text-[12px] font-medium text-text-primary/90"
            title={
              remainingLiveMinutes != null
                ? `${remainingLiveMinutes} min of live listening left this month (desktop). Countdown runs during a call.`
                : `Free plan: up to ${FREE_PLAN_MONTHLY_MINUTES} minutes of live listening per month on desktop.`
            }
            aria-hidden
          >
            <svg className="h-3.5 w-3.5 text-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
            {remainingLiveMinutes != null ? remainingLiveMinutes : FREE_PLAN_MONTHLY_MINUTES}:00
          </span>
        )}
      </div>

      <div className="flex min-w-0 justify-self-center">
        <div className="flex flex-col items-center gap-2.5">
          <span
            className="relative inline-flex"
            onMouseEnter={() => setStartButtonHover(true)}
            onMouseLeave={() => setStartButtonHover(false)}
          >
            <button
              type="button"
              disabled={startDisabled}
              aria-describedby={startDisabled ? startHelpTooltipId : undefined}
              onClick={() => {
                if (usageLoading || mustConnectAiBeforeStart) return;
                if (!canStartLiveSession) {
                  openUpgradeModal();
                  return;
                }
                // Default to the computer/system mic to avoid triggering phone/Bluetooth connection popups.
                setAudioInputDeviceId(null);
                setRecording(true);
              }}
              className={cn(
                "relative inline-flex shrink-0 items-center overflow-hidden rounded-full px-8 py-3.5 text-[18px] font-semibold tracking-tight text-white",

                // Brand-aligned green gradient (depth without “neon UI kit”)
                "bg-gradient-to-b from-[#2bbf96] via-[#1a9d78] to-[#136b55]",

                // Soft top sheen — one layer only
                "before:pointer-events-none before:absolute before:inset-0 before:rounded-full",
                "before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-[0.55]",

                "border border-white/15",

                // Inset highlight + soft drop shadow (no colored glow)
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_12px_rgba(0,0,0,0.35)]",

                "transition-all duration-200 ease-out",

                "hover:brightness-[1.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_4px_18px_rgba(0,0,0,0.42)]",

                "active:scale-[0.98] active:brightness-[0.97]",

                "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background-near-black",

                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
              )}
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-2.5">
                <span>{limitButtonLabel}</span>
              </span>
            </button>
            {startDisabled && (
              <div
                id={startHelpTooltipId}
                role="tooltip"
                aria-hidden={!showStartHelpTooltip}
                className={cn(
                  "pointer-events-none absolute right-0 top-full z-[200] mt-1.5 w-max max-w-[min(12rem,calc(100vw-1rem))] rounded-[10px] border border-white/[0.14] px-2.5 py-1.5 text-center shadow-[0_4px_24px_rgba(0,0,0,0.28)]",
                  "bg-[rgba(22,22,23,0.55)] text-[11px] font-medium leading-snug text-white/92 backdrop-blur-xl backdrop-saturate-150",
                  showStartHelpTooltip ? "opacity-100" : "opacity-0"
                )}
              >
                {startButtonTitle}
              </div>
            )}
          </span>

          <div className="flex items-center justify-center gap-2">
            <label
              htmlFor="header-audio-input"
              className="shrink-0 whitespace-nowrap text-[11px] font-normal tracking-label text-text-dim/70"
            >
              Listen from:
            </label>
            <select
              id="header-audio-input"
              name="audioInputDevice"
              value={audioInputDeviceId ?? ""}
              onChange={(e) => handleAudioInputChange(e.target.value)}
              className="min-w-0 max-w-[min(100%,220px)] rounded-lg border border-white/[0.08] !bg-background-near-black py-1.5 pl-2 pr-1 text-[11px] font-normal text-text-primary focus:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/10 sm:max-w-[260px] sm:px-2.5 sm:text-xs"
            >
              <option value="">Default</option>
              {audioInputs.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
            <RequestMicAccessButton variant="header" onAfterRequest={refreshAudioInputs} />
          </div>
        </div>
      </div>

      <div className="min-w-0 justify-self-end" aria-hidden />
    </header>
  );
}
