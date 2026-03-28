"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPersuaidMicApi,
  MIC_ONBOARDING_STORAGE_KEY,
  warmMicrophoneStream,
} from "@/lib/mic-onboarding";
import { isElectronApp } from "@/lib/electron-client";

type Phase = "loading" | "prompt" | "denied" | "restricted" | "warm_fail";

/**
 * First-run macOS (Electron) microphone onboarding: user-triggered TCC prompt, then getUserMedia warm-up.
 * Shown on /welcome and inside the dashboard shell so session→dashboard skips still get the gate.
 */
export function MicMacOnboardingGate() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [busy, setBusy] = useState(false);
  const [warmError, setWarmError] = useState<string | null>(null);

  const finishDone = useCallback(() => {
    try {
      localStorage.setItem(MIC_ONBOARDING_STORAGE_KEY, "done");
    } catch (_) {}
    setVisible(false);
  }, []);

  const finishSkipped = useCallback(() => {
    try {
      localStorage.setItem(MIC_ONBOARDING_STORAGE_KEY, "skipped");
    } catch (_) {}
    setVisible(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (!isElectronApp()) return;
      const api = getPersuaidMicApi();
      if (!api?.getMicStatus || api.platform !== "darwin") return;

      let saved: string | null = null;
      try {
        saved = localStorage.getItem(MIC_ONBOARDING_STORAGE_KEY);
      } catch (_) {}
      if (saved === "done" || saved === "skipped") return;

      const { status } = await api.getMicStatus();
      if (cancelled) return;

      if (status === "granted") {
        const w = await warmMicrophoneStream();
        if (!cancelled && w.ok) finishDone();
        if (!cancelled && !w.ok) {
          setWarmError(w.message);
          setPhase("warm_fail");
          setVisible(true);
        }
        return;
      }

      if (status === "denied") {
        setPhase("denied");
        setVisible(true);
        return;
      }
      if (status === "restricted") {
        setPhase("restricted");
        setVisible(true);
        return;
      }

      setPhase("prompt");
      setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [finishDone]);

  const onEnableMic = async () => {
    const api = getPersuaidMicApi();
    if (!api?.requestMicAccess) return;
    setBusy(true);
    setWarmError(null);
    try {
      const r = await api.requestMicAccess();
      if (r.status === "granted" && r.granted) {
        const w = await warmMicrophoneStream();
        if (w.ok) {
          finishDone();
          return;
        }
        setWarmError(w.message);
        setPhase("warm_fail");
        return;
      }
      if (r.status === "restricted") {
        setPhase("restricted");
        return;
      }
      if (r.status === "denied" || !r.granted) {
        setPhase("denied");
        return;
      }
      setPhase("denied");
    } finally {
      setBusy(false);
    }
  };

  const onOpenSettings = async () => {
    const api = getPersuaidMicApi();
    await api?.openMicSettings?.();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mic-onboarding-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#121214] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-green-primary/[0.07] via-transparent to-transparent pointer-events-none" />
          <div className="relative p-8 sm:p-9">
            {phase === "loading" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-9 h-9 rounded-full border-2 border-green-primary/30 border-t-green-primary animate-spin" />
                <p className="text-text-muted text-sm">Checking microphone access…</p>
              </div>
            )}

            {phase === "prompt" && (
              <>
                <h2 id="mic-onboarding-title" className="text-xl font-semibold text-text-primary tracking-tight mb-2">
                  Enable microphone access
                </h2>
                <p className="text-text-muted text-sm leading-relaxed mb-8">
                  Persuaid listens to your call audio to generate live transcripts and suggest what to say next. macOS will
                  ask for permission when you continue.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onEnableMic()}
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-white text-[15px] bg-green-primary hover:bg-green-dark transition-colors disabled:opacity-50 shadow-button"
                  >
                    {busy ? "Waiting for system…" : "Enable microphone"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={finishSkipped}
                    className="w-full py-3 px-4 rounded-xl font-medium text-text-muted text-sm hover:text-text-primary transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </>
            )}

            {phase === "denied" && (
              <>
                <h2 id="mic-onboarding-title" className="text-xl font-semibold text-text-primary tracking-tight mb-2">
                  Microphone access is off
                </h2>
                <p className="text-text-muted text-sm leading-relaxed mb-2">
                  Turn on microphone access for <span className="text-text-primary font-medium">Persuaid</span> (or{" "}
                  <span className="text-text-primary font-medium">Electron</span> while developing) in System Settings,
                  then <span className="text-text-primary font-medium">fully quit and restart</span> Persuaid.
                </p>
                <p className="text-text-dim text-xs mb-8">System Settings → Privacy &amp; Security → Microphone</p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => void onOpenSettings()}
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-white text-[15px] bg-green-primary hover:bg-green-dark transition-colors shadow-button"
                  >
                    Open Microphone Settings
                  </button>
                  <button
                    type="button"
                    onClick={finishSkipped}
                    className="w-full py-3 px-4 rounded-xl font-medium text-text-muted text-sm hover:text-text-primary transition-colors"
                  >
                    Continue without microphone
                  </button>
                </div>
              </>
            )}

            {phase === "restricted" && (
              <>
                <h2 id="mic-onboarding-title" className="text-xl font-semibold text-text-primary tracking-tight mb-2">
                  Microphone blocked
                </h2>
                <p className="text-text-muted text-sm leading-relaxed mb-8">
                  This Mac is preventing microphone access (for example through device management or Screen Time). An
                  administrator may need to allow Persuaid to use the microphone.
                </p>
                <button
                  type="button"
                  onClick={finishSkipped}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white text-[15px] bg-white/10 hover:bg-white/[0.14] transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {phase === "warm_fail" && (
              <>
                <h2 id="mic-onboarding-title" className="text-xl font-semibold text-text-primary tracking-tight mb-2">
                  Couldn&apos;t open the microphone
                </h2>
                <p className="text-text-muted text-sm leading-relaxed mb-8">{warmError}</p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => void onOpenSettings()}
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-white text-[15px] bg-green-primary hover:bg-green-dark transition-colors shadow-button"
                  >
                    Open Microphone Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("prompt");
                      setWarmError(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-medium text-text-muted text-sm hover:text-text-primary transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
