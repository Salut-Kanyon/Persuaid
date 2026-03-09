"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

// v1 listen. In Electron (packed app), use in-app proxy so no Next.js API needed. In browser, use token from /api/stt/token.
const DEEPGRAM_PARAMS = new URLSearchParams({
  punctuate: "true",
  smart_format: "true",
  interim_results: "true",
  utterance_end_ms: "1000",
});
const DEEPGRAM_WS_URL = `wss://api.deepgram.com/v1/listen?${DEEPGRAM_PARAMS.toString()}`;
const KEEPALIVE_INTERVAL_MS = 2000;

function getSttProxyUrl(): string {
  // When loading from Next.js dev server (localhost:3000), use token path so /api/stt/token works. Use proxy only for packed app.
  if (typeof window !== "undefined" && window.location?.origin?.includes("localhost:3000")) {
    return "";
  }
  if (typeof window !== "undefined" && (window as unknown as { persuaid?: { sttProxyUrl?: string } }).persuaid?.sttProxyUrl) {
    return (window as unknown as { persuaid: { sttProxyUrl: string } }).persuaid.sttProxyUrl.replace(/\/$/, "");
  }
  return "";
}

function connectWebSocket(url: string, protocols?: string[]): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try {
        socket.close();
      } catch (_) {}
      reject(new Error("WebSocket timeout"));
    }, 15000);
    const socket = new WebSocket(url, protocols);
    socket.onopen = () => {
      clearTimeout(timeout);
      resolve(socket);
    };
    socket.onerror = () => {
      clearTimeout(timeout);
      try {
        socket.close();
      } catch (_) {}
      reject(new Error("WebSocket failed"));
    };
    socket.onclose = (ev) => {
      clearTimeout(timeout);
      if (ev.code !== 1000 && ev.code !== 1005) reject(new Error("WebSocket closed"));
    };
  });
}

// v1 response: transcript + speech_final/is_final for end of utterance. type can be "Results" or unset.
interface DeepgramMessage {
  type?: string;
  channel?: { alternatives?: Array<{ transcript?: string }> };
  speech_final?: boolean;
  is_final?: boolean;
  results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
}

function parseAndAppend(
  raw: string,
  appendTranscript: (seg: { speaker: "user"; text: string }) => void,
  /** When true (packaged app via proxy), append interims so speech appears even if is_final isn't sent. */
  appendInterim: boolean
): void {
  try {
    const data = JSON.parse(raw) as DeepgramMessage;
    const transcript =
      data.channel?.alternatives?.[0]?.transcript?.trim() ||
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();
    if (!transcript) return;
    const isFinal = data.speech_final ?? data.is_final ?? false;
    if (isFinal || appendInterim) {
      appendTranscript({ speaker: "user", text: transcript });
    }
  } catch (_) {}
}

export function LiveTranscription() {
  const { isRecording, appendTranscript, setSessionId, setMicError, audioInputDeviceId } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionErrorShownRef = useRef(false);

  useEffect(() => {
    if (!isRecording) {
      setMicError(null);
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

    (async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          setMicError("Microphone not supported in this environment.");
          return;
        }

        const audioConstraints: MediaTrackConstraints = audioInputDeviceId
          ? {
              deviceId: { ideal: audioInputDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
            };
        let stream = await navigator.mediaDevices
          .getUserMedia({ audio: audioConstraints })
          .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }));
        setMicError(null);
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            if (mounted && streamRef.current) {
              setMicError("Input device stopped. Select another device in Listen from or click Try again.");
            }
          };
        });

        const query = DEEPGRAM_PARAMS.toString();
        const proxyUrl = getSttProxyUrl();

        let ws: WebSocket;

        if (proxyUrl) {
          // Desktop app: use in-app proxy (Electron main process). Key in ~/Library/Application Support/Persuaid/.env
          try {
            ws = await connectWebSocket(`${proxyUrl}/v1/listen?${query}`);
          } catch {
            if (!mounted) return;
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setMicError("Could not connect to transcription. The installed app doesn't use .env.local. Put DEEPGRAM_API_KEY in a .env file in the app's config folder (e.g. macOS: ~/Library/Application Support/Persuaid/.env), then restart.");
            return;
          }
        } else {
          // Browser (or desktop:dev on localhost:3000): use token from Next.js API
          const tokenRes = await fetch("/api/stt/token", { cache: "no-store" });
          if (!mounted) return;
          if (!tokenRes.ok) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            let msg = "Transcription service error.";
            if (tokenRes.status === 503) msg = "Add DEEPGRAM_API_KEY to .env.local and restart.";
            else {
              try {
                const body = (await tokenRes.json()) as { error?: string };
                if (body?.error) msg = body.error;
              } catch (_) {}
            }
            setMicError(msg);
            return;
          }
          const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
          const access_token = tokenData.access_token ?? null;
          if (!access_token || !mounted) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setMicError(tokenData.error ?? "No token returned.");
            return;
          }
          try {
            ws = await connectWebSocket(DEEPGRAM_WS_URL, ["bearer", access_token]);
          } catch {
            if (!mounted) return;
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setMicError("Could not connect to transcription. If the token works but this keeps happening, try a new API key in the Deepgram Console (Member or Owner role; restricted keys cannot stream). Or check your network.");
            return;
          }
        }
        if (!mounted) return;
        wsRef.current = ws;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data);
          }
        };
        mediaRecorder.onerror = () => {
          if (mounted) setMicError("Recording error. Try another device in Listen from or use Default.");
        };

        const showConnectionError = (detail: string) => {
          if (!mounted || connectionErrorShownRef.current) return;
          connectionErrorShownRef.current = true;
          setMicError(`Transcription connection failed. ${detail}`);
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

        const usingProxy = !!proxyUrl;
        const handleMessage = (event: MessageEvent) => {
          if (!mounted) return;
          const d = event.data;
          if (typeof d === "string") {
            parseAndAppend(d, appendTranscript, usingProxy);
            return;
          }
          if (d instanceof Blob) {
            d.text().then((raw) => {
              if (mounted) parseAndAppend(raw, appendTranscript, usingProxy);
            }).catch(() => {});
            return;
          }
          if (d instanceof ArrayBuffer) {
            parseAndAppend(new TextDecoder().decode(d), appendTranscript, usingProxy);
          }
        };

        const handleClose = (ev: CloseEvent) => {
          if (keepaliveRef.current) {
            clearInterval(keepaliveRef.current);
            keepaliveRef.current = null;
          }
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
          if (!mounted) return;
          const unexpected = ev.code !== 1000 && ev.code !== 1005;
          if (unexpected) {
            const reason = (ev.reason || "").trim();
            if (ev.code === 1008 && (reason.includes("DATA") || reason.includes("decode"))) {
              showConnectionError("Audio format was rejected. Try again.");
            } else if (ev.code === 1011 && (reason.includes("NET") || reason.includes("timeout"))) {
              showConnectionError("Connection timed out. Check network and try again.");
            } else if (ev.code === 4401 || ev.code === 4403) {
              showConnectionError("Token expired or invalid. Stop the call and start again to get a new token.");
            } else {
              showConnectionError("Connection closed. Try again.");
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
        setMicError(userMsg);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isRecording, audioInputDeviceId, appendTranscript, setSessionId, setMicError]);

  return null;
}
