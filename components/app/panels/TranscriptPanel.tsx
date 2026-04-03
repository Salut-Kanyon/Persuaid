"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";
import { RequestMicAccessButton } from "@/components/app/RequestMicAccessButton";
import { isElectronApp, openElectronMicrophonePrivacySettings } from "@/lib/electron-client";
import { requestMicrophoneAccessFull } from "@/lib/mic-onboarding";

function isMacElectronMicPermissionHelpful(micError: string | null): boolean {
  if (!micError || typeof window === "undefined") return false;
  const platform = (window as Window & { persuaid?: { platform?: string } }).persuaid?.platform;
  if (platform !== "darwin" || !isElectronApp()) return false;
  const m = micError.toLowerCase();
  return (
    m.includes("microphone access") ||
    m.includes("permission") ||
    m.includes("denied") ||
    m.includes("blocked") ||
    m.includes("not allowed")
  );
}

function getInitials(name: string | undefined, speaker: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  }
  return speaker === "user" ? "You" : "??";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function TranscriptPanel() {
  const { transcript, isRecording, micError, setMicError, setRecording, audioInputDeviceId, setAudioInputDeviceId, requestSuggestions } = useSession();
  const { canUseAiCoach, canStartLiveSession, usageLoading, openUpgradeModal } = useEntitlements();
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [showNoSpeechHint, setShowNoSpeechHint] = useState(false);

  useEffect(() => {
    if (transcript.length > 0) {
      setShowNoSpeechHint(false);
      return;
    }
    if (!isElectronApp() || !isRecording) {
      setShowNoSpeechHint(false);
      return;
    }
    const t = setTimeout(() => setShowNoSpeechHint(true), 6000);
    return () => clearTimeout(t);
  }, [isRecording, transcript.length]);

  const refreshAudioInputs = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter((d) => d.kind === "audioinput"));
    } catch (_) {}
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        if (mounted) setAudioInputs(inputs);
      } catch (_) {}
    })();
    return () => {
      mounted = false;
    };
  }, [isRecording]);

  const handleRetryMic = () => {
    if (usageLoading) return;
    if (!canStartLiveSession) {
      openUpgradeModal();
      return;
    }
    setMicError(null);
    setRequestStatus(null);
    setRecording(false);
    setTimeout(() => setRecording(true), 200);
  };

  const handleRequestAccess = async () => {
    setRequestStatus("Requesting…");
    const result = await requestMicrophoneAccessFull();
    setRequestStatus(result.ok ? "Microphone access granted." : result.message);
    if (result.ok) {
      setMicError(null);
      await refreshAudioInputs();
    }
  };

  const handleAudioInputChange = (deviceId: string) => {
    const id = deviceId === "" ? null : deviceId;
    setAudioInputDeviceId(id);
    if (isRecording) {
      if (usageLoading) return;
      if (!canStartLiveSession) {
        openUpgradeModal();
        return;
      }
      setRecording(false);
      setMicError(null);
      setTimeout(() => setRecording(true), 200);
    }
  };

  useEffect(() => {
    if (!isRecording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (!canUseAiCoach) {
          openUpgradeModal();
          return;
        }
        requestSuggestions();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, requestSuggestions, canUseAiCoach, openUpgradeModal]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mx-4 mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="audio-input-select" className="text-xs font-medium text-text-secondary">
          Listen from:
        </label>
        <select
          id="audio-input-select"
          name="audioInputDevice"
          value={audioInputDeviceId ?? ""}
          onChange={(e) => handleAudioInputChange(e.target.value)}
          className="rounded-lg border border-white/[0.08] !bg-background-near-black px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-green-primary/40"
        >
          <option value="">Default</option>
          {audioInputs.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${i + 1}`}
            </option>
          ))}
        </select>
        <RequestMicAccessButton variant="panel" onAfterRequest={refreshAudioInputs} />
        <span className="text-[10px] text-text-dim/70">
          Choose the input that receives your phone call (e.g. Phone or Bluetooth).
        </span>
      </div>
      {micError && (
        <div className="flex-shrink-0 mx-4 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-3">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{micError}</p>
          {micError.toLowerCase().includes("microphone") && (
            <p className="text-xs text-text-muted">
              {isElectronApp() ? (
                <>
                  <strong>Desktop app:</strong> When you run from a terminal (Cursor or Terminal.app), macOS asks the <strong>terminal</strong> for mic access, not this app. To have <strong>Persuaid</strong> ask: run <code className="text-[11px] bg-amber-500/10 px-1 rounded">npm run pack</code>, then open <strong>Persuaid.app</strong> from the <code className="text-[11px] bg-amber-500/10 px-1 rounded">dist</code> folder in Finder. Or use the app in your browser at <strong>localhost:3000</strong>.
                </>
              ) : (
                <>
                  <strong>Browser:</strong> Click the lock or info icon in the address bar and set <strong>Microphone</strong> to Allow, or use your browser settings for this site.
                </>
              )}
            </p>
          )}
          {requestStatus && <p className="text-xs text-text-secondary">{requestStatus}</p>}
          <div className="flex flex-wrap gap-2">
            {isMacElectronMicPermissionHelpful(micError) && (
              <button
                type="button"
                onClick={() => void openElectronMicrophonePrivacySettings()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                Open Microphone settings
              </button>
            )}
            <button
              type="button"
              onClick={handleRequestAccess}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              Request microphone access
            </button>
            <button
              type="button"
              onClick={handleRetryMic}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-text-muted">
              {isRecording ? "Listening… Your speech will appear here." : "Start the call. Your speech will appear here."}
            </p>
            {isElectronApp() && isRecording && showNoSpeechHint && !micError && (
              <p className="mt-4 max-w-sm text-xs text-text-dim">
                If nothing appears: ensure the app is built with <strong>NEXT_PUBLIC_STT_PROXY_URL</strong> pointing at your hosted relay, or for local dev run <code className="text-[11px] bg-amber-500/10 px-1 rounded">npm run stt:proxy</code>. Choose your mic in <strong>Listen from</strong> above.
              </p>
            )}
          </div>
        ) : (
          transcript.map((message) => (
            <div key={message.id} className="flex gap-4 group">
              <div
                className={
                  message.speaker === "user"
                    ? "w-12 h-12 rounded-3xl bg-gradient-to-br from-green-primary/20 to-green-primary/8 border border-green-primary/15 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                    : "w-12 h-12 rounded-3xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                }
              >
                <span
                  className={
                    message.speaker === "user"
                      ? "text-green-primary text-xs font-semibold"
                      : "text-text-muted text-xs font-semibold"
                  }
                >
                  {getInitials(message.name, message.speaker)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs font-medium text-text-primary">
                    {message.name ?? (message.speaker === "user" ? "You" : "Other")}
                  </span>
                  <span className="text-[10px] text-text-dim/60 font-mono tracking-wider">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary/90 leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
