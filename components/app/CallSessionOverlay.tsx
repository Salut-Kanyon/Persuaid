"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";
import { LiveMicWaveform } from "@/components/app/LiveMicWaveform";
import { FollowUpPanel } from "@/components/app/panels/FollowUpPanel";
import { isElectronApp } from "@/lib/electron-client";
import { FREE_PLAN_ELECTRON_CALL_MAX_SECONDS, FREE_PLAN_MONTHLY_MINUTES } from "@/lib/usage";

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const blurGlass: CSSProperties = {
  WebkitBackdropFilter: "saturate(180%) blur(22px)",
  backdropFilter: "saturate(180%) blur(22px)",
};

type PersuaidApi = {
  syncCallHudSize?: (size: { height: number }) => void;
};

function getPersuaidApi(): PersuaidApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { persuaid?: PersuaidApi }).persuaid;
}

/**
 * Live-call HUD: inset from window edges. Hide removes the follow-up card and shortcut line — only the top pill stays;
 * in the desktop app the native window height shrinks so the blurred/vibrant background matches.
 */
export function CallSessionOverlay() {
  const { setRecording, callStartedAtIso } = useSession();
  const { plan, remainingLiveMinutes } = useEntitlements();
  const approxStartRef = useRef(Date.now());
  const startMs =
    typeof callStartedAtIso === "string" && callStartedAtIso
      ? Date.parse(callStartedAtIso)
      : approxStartRef.current;
  const freeDesktopCountdown = isElectronApp() && plan === "free";
  /** Seconds allowed this session: free desktop caps per session; paid uses remaining monthly minutes. */
  const sessionCapSecRef = useRef<number | null>(null);
  const lastCallStartedIsoRef = useRef<string | null>(null);
  if (callStartedAtIso !== lastCallStartedIsoRef.current) {
    lastCallStartedIsoRef.current = callStartedAtIso;
    sessionCapSecRef.current = null;
  }
  if (sessionCapSecRef.current === null) {
    const remMin = remainingLiveMinutes ?? FREE_PLAN_MONTHLY_MINUTES;
    const remSec = Math.max(0, remMin) * 60;
    sessionCapSecRef.current =
      isElectronApp() && plan === "free"
        ? Math.min(FREE_PLAN_ELECTRON_CALL_MAX_SECONDS, remSec)
        : remSec;
  }
  const sessionCapSec = sessionCapSecRef.current;
  const [tick, setTick] = useState(0);
  const [mainHidden, setMainHidden] = useState(false);
  const hudMeasureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const remainingFreeSec = Math.max(0, sessionCapSec - elapsedSec);

  useEffect(() => {
    if (!freeDesktopCountdown) return;
    if (remainingFreeSec > 0) return;
    setRecording(false);
  }, [freeDesktopCountdown, remainingFreeSec, setRecording]);

  useLayoutEffect(() => {
    const el = hudMeasureRef.current;
    const api = getPersuaidApi();
    if (!el || !api?.syncCallHudSize) return;

    const raf = { outer: 0, inner: 0 };
    const pushSize = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) void api.syncCallHudSize!({ height: h });
    };

    const schedule = () => {
      cancelAnimationFrame(raf.outer);
      cancelAnimationFrame(raf.inner);
      raf.outer = requestAnimationFrame(() => {
        raf.inner = requestAnimationFrame(pushSize);
      });
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    schedule();

    return () => {
      cancelAnimationFrame(raf.outer);
      cancelAnimationFrame(raf.inner);
      ro.disconnect();
    };
  }, [mainHidden]);

  const pillGlass = cn(
    "border border-white/10",
    "bg-[rgba(20,20,20,0.78)]",
    "shadow-[0_2px_16px_rgba(0,0,0,0.4)]"
  );

  const dragRegion = { WebkitAppRegion: "drag" } as CSSProperties;
  const noDrag = { WebkitAppRegion: "no-drag" } as CSSProperties;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[500] flex flex-col items-center overflow-hidden bg-transparent"
      role="region"
      aria-label="Live call"
    >
      <div
        id="call-hud-measure-root"
        ref={hudMeasureRef}
        className="pointer-events-none flex w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-col items-stretch gap-2 px-3 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4"
      >
        <div
          className={cn(
            "pointer-events-auto flex w-full shrink-0 items-center justify-between gap-3 rounded-full px-3 py-1.5 pl-3",
            pillGlass
          )}
          style={{ ...blurGlass, ...dragRegion }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
              <img
                src={PERSUAID_MARK_PNG}
                alt=""
                className="h-5 w-5 object-contain opacity-95"
                width={20}
                height={20}
              />
            </div>
            <LiveMicWaveform className="min-w-[52px]" />
            <p
              className={cn(
                "truncate text-[11px] font-medium tabular-nums tracking-wide",
                freeDesktopCountdown
                  ? remainingFreeSec <= 30
                    ? "text-amber-300/95"
                    : "text-white/80"
                  : "text-white/55"
              )}
              title={
                freeDesktopCountdown
                  ? "Time remaining on Free plan (desktop)"
                  : "Call duration"
              }
            >
              {freeDesktopCountdown ? formatClock(remainingFreeSec) : formatClock(elapsedSec)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1" style={noDrag}>
            <button
              type="button"
              onClick={() => setMainHidden((h) => !h)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white/92"
            >
              {mainHidden ? (
                <>
                  <span>Show</span>
                  <svg className="h-3.5 w-3.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Hide</span>
                  <svg className="h-3.5 w-3.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRecording(false)}
              className="shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-semibold tracking-tight text-red-400 transition-colors hover:bg-red-500/18 hover:text-red-300"
              aria-label="End call"
            >
              End Call
            </button>
          </div>
        </div>

        {!mainHidden ? (
          <div className="pointer-events-auto w-full shrink-0">
            <FollowUpPanel variant="callOverlay" />
          </div>
        ) : null}

        {!mainHidden ? (
          <p className="pointer-events-none px-1 pt-1 text-center text-[10px] leading-relaxed text-white/32">
            Ask about the conversation, or press Return or Enter.
          </p>
        ) : null}
      </div>
    </div>
  );
}
