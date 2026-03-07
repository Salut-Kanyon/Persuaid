"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";

function getSttProxyUrl(): string {
  if (typeof window !== "undefined" && (window as unknown as { persuaid?: { sttProxyUrl?: string } }).persuaid?.sttProxyUrl) {
    return (window as unknown as { persuaid: { sttProxyUrl: string } }).persuaid.sttProxyUrl.replace(/\/$/, "");
  }
  if (typeof process.env.NEXT_PUBLIC_STT_WS_PROXY === "string") {
    return process.env.NEXT_PUBLIC_STT_WS_PROXY.replace(/\/$/, "").replace(/^http:/, "ws:");
  }
  return "";
}
const KEEPALIVE_INTERVAL_MS = 2000;

function connectWebSocket(url: string, protocols?: string[]): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch (_) {}
      reject(new Error("WebSocket timeout"));
    }, 15000);
    const ws = new WebSocket(url, protocols);
    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timeout);
      try {
        ws.close();
      } catch (_) {}
      reject(new Error("WebSocket failed"));
    };
    ws.onclose = (ev) => {
      clearTimeout(timeout);
      if (ev.code !== 1000 && ev.code !== 1005) reject(new Error("WebSocket closed"));
    };
  });
}

interface DeepgramResult {
  type?: string;
  channel?: {
    alternatives?: Array<{ transcript?: string }>;
  };
  speech_final?: boolean;
  is_final?: boolean;
}

export function LiveTranscription() {
  const { isRecording, appendTranscript, setSessionId, setMicError, recentSpeechRef, registerClearBuffer, audioInputDeviceId } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionErrorShownRef = useRef(false);
  const phraseBufferRef = useRef("");
  const flushPhraseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isRecording) {
      setMicError(null);
      phraseBufferRef.current = "";
      reconnectAttemptedRef.current = false;
      if (flushPhraseTimeoutRef.current) {
        clearTimeout(flushPhraseTimeoutRef.current);
        flushPhraseTimeoutRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current);
        keepaliveRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let mounted = true;
    connectionErrorShownRef.current = false;
    registerClearBuffer(() => {
      phraseBufferRef.current = "";
    });

    (async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          const msg = "Microphone not supported in this environment.";
          appendTranscript({ speaker: "user", text: `[${msg}]` });
          setMicError(msg);
          return;
        }

        const audioConstraints: MediaTrackConstraints = audioInputDeviceId
          ? {
              deviceId: { exact: audioInputDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
            };
        const stream = await navigator.mediaDevices
          .getUserMedia({ audio: audioConstraints })
          .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }));
        setMicError(null);
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const params = new URLSearchParams({
          punctuate: "true",
          smart_format: "true",
          interim_results: "true",
          utterance_end_ms: "1000",
        });
        const query = params.toString();
        const proxyUrl = getSttProxyUrl();

        let ws: WebSocket;

        if (proxyUrl) {
          try {
            ws = await connectWebSocket(`${proxyUrl}/v1/listen?${query}`);
          } catch {
            ws = null!;
          }
        } else {
          const tokenRes = await fetch("/api/stt/token");
          if (!mounted) return;
          if (!tokenRes.ok) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            let msg = "Transcription service error.";
            if (tokenRes.status === 503) msg = "Transcription service not configured. Add DEEPGRAM_API_KEY to .env.local and restart.";
            else if (tokenRes.status === 404) msg = "Transcription isn't available in the standalone app. Add your Deepgram key to the app's .env (see README) or use the browser with npm run dev.";
            else {
              try {
                const body = (await tokenRes.json()) as { error?: string };
                if (body?.error) msg = body.error;
              } catch (_) {}
            }
            appendTranscript({ speaker: "user", text: `[${msg}]` });
            setMicError(msg);
            return;
          }
          const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
          const access_token = tokenData.access_token ?? null;
          if (!access_token || !mounted) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            if (tokenData.error) {
              appendTranscript({ speaker: "user", text: `[${tokenData.error}]` });
              setMicError(tokenData.error);
            }
            return;
          }
          try {
            ws = await connectWebSocket(`${DEEPGRAM_WS_URL}?${query}`, ["bearer", access_token]);
          } catch {
            if (!mounted) return;
            if (getSttProxyUrl()) {
              try {
                ws = await connectWebSocket(`${getSttProxyUrl()}/v1/listen?${query}`);
              } catch {
                ws = null!;
              }
            } else {
              ws = null!;
            }
          }
        }
        if (!mounted) return;
        if (!ws) {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          const msg = "Transcription connection failed. Check your network and try again.";
          appendTranscript({ speaker: "user", text: `[${msg}]` });
          setMicError(msg);
          return;
        }
        wsRef.current = ws;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data);
          }
        };

        const showConnectionError = (detail: string) => {
          if (!mounted || connectionErrorShownRef.current) return;
          connectionErrorShownRef.current = true;
          const msg = `Transcription connection failed. ${detail}`;
          appendTranscript({ speaker: "user", text: `[${msg}]` });
          setMicError(msg);
        };

        if (mounted) {
          setSessionId((id) => id || crypto.randomUUID());
          mediaRecorder.start(250);
          keepaliveRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "KeepAlive" }));
            }
          }, KEEPALIVE_INTERVAL_MS);
        }

        const PHRASE_FLUSH_MS = 2500;
        const flushBuffer = () => {
          if (flushPhraseTimeoutRef.current) {
            clearTimeout(flushPhraseTimeoutRef.current);
            flushPhraseTimeoutRef.current = null;
          }
          const last = phraseBufferRef.current.trim();
          if (last) recentSpeechRef.current = last;
          phraseBufferRef.current = "";
        };

        const handleMessage = (event: MessageEvent) => {
          if (!mounted) return;
          try {
            const raw = typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
            const data = JSON.parse(raw) as DeepgramResult;
            const transcript = data.channel?.alternatives?.[0]?.transcript?.trim();
            if (!transcript) return;
            const isFinal = data.speech_final ?? data.is_final ?? false;
            const prev = phraseBufferRef.current;
            if (prev && transcript.length > 0 && transcript.toLowerCase().includes(prev.toLowerCase().slice(-30))) {
              phraseBufferRef.current = transcript;
            } else {
              phraseBufferRef.current = prev ? `${prev} ${transcript}` : transcript;
            }
            recentSpeechRef.current = phraseBufferRef.current;
            if (isFinal) {
              if (flushPhraseTimeoutRef.current) clearTimeout(flushPhraseTimeoutRef.current);
              flushPhraseTimeoutRef.current = setTimeout(flushBuffer, PHRASE_FLUSH_MS);
            }
          } catch (_) {}
        };

        const tryReconnect = async () => {
          let newWs: WebSocket | null = null;
          try {
            if (getSttProxyUrl()) {
              newWs = await connectWebSocket(`${getSttProxyUrl()}/v1/listen?${query}`);
            } else {
              const tokenRes = await fetch("/api/stt/token");
              if (!mounted || !tokenRes.ok) return;
              const tokenData = (await tokenRes.json()) as { access_token?: string };
              const tok = tokenData.access_token;
              if (!tok || !mounted) return;
              newWs = await connectWebSocket(`${DEEPGRAM_WS_URL}?${query}`, ["bearer", tok]);
            }
            if (!mounted || !newWs) return;
            wsRef.current = newWs;
            if (keepaliveRef.current) clearInterval(keepaliveRef.current);
            keepaliveRef.current = setInterval(() => {
              if (newWs!.readyState === WebSocket.OPEN) newWs!.send(JSON.stringify({ type: "KeepAlive" }));
            }, KEEPALIVE_INTERVAL_MS);
            newWs.onmessage = handleMessage;
            newWs.onerror = () => showConnectionError("Check your network and try again.");
            newWs.onclose = handleClose;
          } catch (_) {}
          if (!newWs || !mounted) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            showConnectionError("Connection dropped. Try again.");
          }
        };

        const handleClose = (ev: CloseEvent) => {
          if (flushPhraseTimeoutRef.current) {
            clearTimeout(flushPhraseTimeoutRef.current);
            flushPhraseTimeoutRef.current = null;
          }
          phraseBufferRef.current = "";
          recentSpeechRef.current = "";
          if (keepaliveRef.current) {
            clearInterval(keepaliveRef.current);
            keepaliveRef.current = null;
          }
          const unexpected = ev.code !== 1000 && ev.code !== 1005;
          if (unexpected && mounted && !reconnectAttemptedRef.current) {
            reconnectAttemptedRef.current = true;
            tryReconnect();
            return;
          }
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
          if (!mounted) return;
          if (unexpected) {
            const reason = (ev.reason || "").trim();
            if (ev.code === 1008 && (reason.includes("DATA") || reason.includes("decode"))) {
              showConnectionError("Audio format was rejected. Try again.");
            } else if (ev.code === 1011 && (reason.includes("NET") || reason.includes("timeout"))) {
              showConnectionError("Connection timed out. Check network and try again.");
            } else if (ev.code === 4401 || ev.code === 4403) {
              showConnectionError("Authentication failed. Try again.");
            }
          }
        };

        ws.onmessage = handleMessage;
        ws.onerror = () => showConnectionError("Check your network and try again.");
        ws.onclose = handleClose;
      } catch (err) {
        if (!mounted) return;
        console.error("LiveTranscription error:", err);
        const name = err instanceof Error ? err.name : "";
        const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
        const isPermission =
          name === "NotAllowedError" ||
          name === "PermissionDeniedError" ||
          name === "SecurityError" ||
          message.includes("permission") ||
          message.includes("denied") ||
          message.includes("not allowed");
        const isNotFound = name === "NotFoundError" || message.includes("not found");
        const isOverconstrained = name === "OverconstrainedError" || message.includes("constraint");
        let userMsg: string;
        if (isPermission) {
          userMsg = "Microphone access denied. Use the steps below to allow access, then click Try again.";
        } else if (audioInputDeviceId && (isNotFound || isOverconstrained)) {
          userMsg = "Selected input unavailable. Choose another device or Default in Listen from, then try again.";
        } else if (isNotFound) {
          userMsg = "No microphone found. Connect a microphone and click Try again.";
        } else {
          userMsg = "Could not start microphone. Check permissions and try again.";
        }
        appendTranscript({ speaker: "user", text: `[${userMsg}]` });
        setMicError(userMsg);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isRecording, audioInputDeviceId, appendTranscript, setSessionId, setMicError]);

  return null;
}
