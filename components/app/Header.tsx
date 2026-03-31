"use client";

import { useEffect, useState } from "react";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";

export function Header() {
  const {
    isRecording,
    setRecording,
    audioInputDeviceId,
    setAudioInputDeviceId,
  } = useSession();
  const { canStartLiveSession, usageLoading, openUpgradeModal, plan } = useEntitlements();
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (mounted) setAudioInputs(devices.filter((d) => d.kind === "audioinput"));
      } catch (_) {}
    })();
    return () => {
      mounted = false;
    };
  }, [isRecording]);

  const limitTitle =
    usageLoading || canStartLiveSession
      ? undefined
      : plan === "pro"
        ? "Pro monthly listening limit reached — upgrade to Team or wait until next month"
        : plan === "team"
          ? "Team monthly limit reached — your allowance resets next month"
          : "You’ve used your included time this month — upgrade for more";

  const limitButtonLabel = (() => {
    if (usageLoading) return "Checking…";
    if (canStartLiveSession) return "Start PersuAId";
    if (plan === "pro") return "View Team upgrade";
    if (plan === "team") return "Limit reached";
    return "Upgrade to continue";
  })();

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

  return (
    <header className="grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 bg-white/[0.04] px-3 backdrop-blur-3xl backdrop-saturate-150 sm:h-[3.25rem] sm:gap-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 justify-self-start sm:gap-2.5">
        <label
          htmlFor="header-audio-input"
          className="shrink-0 whitespace-nowrap text-[11px] font-normal tracking-label text-text-dim/70 sm:text-xs"
        >
          Listen from:
        </label>
        <select
          id="header-audio-input"
          name="audioInputDevice"
          value={audioInputDeviceId ?? ""}
          onChange={(e) => handleAudioInputChange(e.target.value)}
          className="min-w-0 max-w-[min(100%,200px)] rounded-lg border border-white/[0.08] bg-white/[0.06] py-1.5 pl-2 pr-1 text-[11px] font-normal text-text-primary backdrop-blur-xl focus:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/10 sm:max-w-[260px] sm:px-2.5 sm:text-xs"
        >
          <option value="">Default</option>
          {audioInputs.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 justify-self-center" aria-hidden />

      <div className="flex shrink-0 justify-self-end">
        <button
          type="button"
          disabled={usageLoading}
          onClick={() => {
            if (usageLoading) return;
            if (!canStartLiveSession) {
              openUpgradeModal();
              return;
            }
            // Default to the computer/system mic to avoid triggering phone/Bluetooth connection popups.
            setAudioInputDeviceId(null);
            setRecording(true);
          }}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full bg-green-primary px-4 py-2 text-[13px] font-semibold tracking-tight text-white",
            "shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
            "transition-[transform,background-color,box-shadow] duration-300 ease-out",
            "hover:bg-green-dark hover:shadow-[0_2px_6px_rgba(0,0,0,0.22)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background-near-black",
            "active:scale-[0.99] sm:gap-2.5 sm:px-5 sm:py-2.5 sm:text-sm",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-primary disabled:hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          )}
          title={
            usageLoading ? "Checking your plan allowance…" : limitTitle
          }
        >
          <span>{limitButtonLabel}</span>
          <img
            src={PERSUAID_MARK_PNG}
            alt=""
            width={32}
            height={32}
            className="h-5 w-5 shrink-0 object-contain brightness-0 invert sm:h-[1.35rem] sm:w-[1.35rem]"
          />
        </button>
      </div>
    </header>
  );
}
