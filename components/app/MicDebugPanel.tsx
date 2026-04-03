"use client";

import { useCallback, useEffect, useState } from "react";
import { isElectronApp } from "@/lib/electron-client";
import { getPersuaidMicApi, warmMicrophoneStream } from "@/lib/mic-onboarding";

/**
 * Temporary microphone / TCC debug HUD for packaged macOS builds.
 * Enable with `?micDebug=1` or `localStorage.persuaid_mic_debug = "1"` then reload.
 * Pair with main-process [MIC_DEBUG] lines in ~/Library/Application Support/Persuaid/debug.log
 */
export function MicDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("—");
  const [lastRequest, setLastRequest] = useState("—");
  const [gum, setGum] = useState("—");
  const [platform, setPlatform] = useState("—");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("micDebug");
    let ls = false;
    try {
      ls = localStorage.getItem("persuaid_mic_debug") === "1";
    } catch {
      /* ignore */
    }
    if (q === "1" || ls) {
      try {
        localStorage.setItem("persuaid_mic_debug", "1");
      } catch {
        /* ignore */
      }
      setVisible(true);
    }
  }, []);

  const refresh = useCallback(async () => {
    const api = getPersuaidMicApi();
    setPlatform(api?.platform ?? "no window.persuaid preload");
    if (!api?.getMicStatus) {
      setStatus("no getMicStatus");
      return;
    }
    const r = await api.getMicStatus();
    setStatus(JSON.stringify(r));
  }, []);

  useEffect(() => {
    if (!visible) return;
    void refresh();
    const t = setInterval(() => void refresh(), 2000);
    return () => clearInterval(t);
  }, [visible, refresh]);

  const onRequest = async () => {
    const api = getPersuaidMicApi();
    if (!api?.requestMicAccess) {
      setLastRequest(JSON.stringify({ error: "no requestMicAccess" }));
      return;
    }
    const r = await api.requestMicAccess();
    setLastRequest(JSON.stringify(r));
    void refresh();
  };

  const onGum = async () => {
    const w = await warmMicrophoneStream();
    setGum(JSON.stringify(w));
    void refresh();
  };

  /** Main askForMediaAccess + renderer getUserMedia; logs [MIC_DIAG] in main. */
  const onFullDiag = async () => {
    const api = getPersuaidMicApi();
    if (!api?.micDiagnosticMain) {
      setGum(JSON.stringify({ error: "no micDiagnosticMain (update preload)" }));
      return;
    }
    try {
      const mainRes = await api.micDiagnosticMain();
      setLastRequest(JSON.stringify({ step: "mic:diagnostic-main", mainRes }));
    } catch (e) {
      setLastRequest(JSON.stringify({ step: "mic:diagnostic-main", error: e instanceof Error ? e.message : String(e) }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((t) => t.stop());
      await api.micDiagnosticLogGum?.({
        ok: true,
        name: "OK",
        message: "getUserMedia({ audio: true, video: false }) succeeded; tracks stopped",
      });
      setGum(JSON.stringify({ ok: true, getUserMedia: "success" }));
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      await api.micDiagnosticLogGum?.({
        ok: false,
        name: err.name,
        message: err.message,
      });
      setGum(JSON.stringify({ ok: false, name: err.name, message: err.message }));
    }
    void refresh();
  };

  if (!visible || !isElectronApp()) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-[500] max-w-[22rem] rounded-lg border border-amber-500/50 bg-[#0c0c0e]/95 p-3 font-mono text-[11px] leading-snug text-amber-100 shadow-2xl backdrop-blur-sm">
      <div className="mb-1.5 font-bold text-amber-400">MIC DEBUG</div>
      <p className="mb-2 text-[10px] text-amber-200/80">Add ?micDebug=1 — logs also in ~/Library/Application Support/Persuaid/debug.log</p>
      <div className="space-y-1 break-all">
        <div>
          <span className="text-amber-200/70">platform:</span> {platform}
        </div>
        <div>
          <span className="text-amber-200/70">mic:get-status:</span> {status}
        </div>
        <div>
          <span className="text-amber-200/70">last mic:request-access:</span> {lastRequest}
        </div>
        <div>
          <span className="text-amber-200/70">getUserMedia warm-up:</span> {gum}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-amber-600/35 px-2 py-1 text-[10px] font-semibold hover:bg-amber-600/50"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
        <button
          type="button"
          className="rounded bg-amber-600/35 px-2 py-1 text-[10px] font-semibold hover:bg-amber-600/50"
          onClick={() => void onRequest()}
        >
          request-access
        </button>
        <button
          type="button"
          className="rounded bg-amber-600/35 px-2 py-1 text-[10px] font-semibold hover:bg-amber-600/50"
          onClick={() => void onGum()}
        >
          getUserMedia
        </button>
        <button
          type="button"
          className="rounded bg-amber-500/40 px-2 py-1 text-[10px] font-semibold hover:bg-amber-500/55"
          title="Runs mic:diagnostic-main then getUserMedia — check logs for [MIC_DIAG]"
          onClick={() => void onFullDiag()}
        >
          Full diag (main+GUM)
        </button>
      </div>
    </div>
  );
}
