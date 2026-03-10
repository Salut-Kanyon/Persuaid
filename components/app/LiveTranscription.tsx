"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

// v1/listen with raw PCM so we get real transcripts (WebM from MediaRecorder often returns empty on v1).
const PCM_SAMPLE_RATE = 16000;
function buildDeepgramParams(sampleRate: number): URLSearchParams {
  return new URLSearchParams({
    encoding: "linear16",
    sample_rate: String(sampleRate),
    punctuate: "true",
    smart_format: "true",
    interim_results: "true",
    utterance_end_ms: "3000",
  });
}
const KEEPALIVE_INTERVAL_MS = 2000;

function getSttProxyUrl(): string {
  // Next.js dev server (localhost:3000): use token path so /api/stt/token works.
  if (typeof window !== "undefined" && window.location?.origin?.includes("localhost:3000")) {
    return "";
  }
  // Packaged Electron app: static bundle served from http://127.0.0.1:2999 → always use in-app proxy on 2998.
  if (typeof window !== "undefined" && window.location?.origin?.startsWith("http://127.0.0.1:2999")) {
    return "ws://127.0.0.1:2998";
  }
  if (typeof window !== "undefined" && (window as unknown as { persuaid?: { sttProxyUrl?: string } }).persuaid?.sttProxyUrl) {
    return (window as unknown as { persuaid: { sttProxyUrl: string } }).persuaid.sttProxyUrl.replace(/\/$/, "");
  }
  return "";
}

function connectWebSocket(url: string, protocols?: string[]): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line no-console
      console.log("[STT] Connecting WebSocket to", url, protocols ?? []);
    } catch {
      // ignore logging errors in environments without console
    }
    const timeout = setTimeout(() => {
      try {
        // eslint-disable-next-line no-console
        console.error("[STT] WebSocket timeout for", url);
        socket.close();
      } catch (_) {}
      reject(new Error("WebSocket timeout"));
    }, 15000);
    const socket = new WebSocket(url, protocols);
    socket.onopen = () => {
      try {
        // eslint-disable-next-line no-console
        console.log("[STT] WebSocket open:", url);
      } catch {
        // ignore
      }
      clearTimeout(timeout);
      resolve(socket);
    };
    socket.onerror = () => {
      clearTimeout(timeout);
      try {
        // eslint-disable-next-line no-console
        console.error("[STT] WebSocket error for", url);
        socket.close();
      } catch (_) {}
      reject(new Error("WebSocket failed"));
    };
    socket.onclose = (ev) => {
      clearTimeout(timeout);
      try {
        // eslint-disable-next-line no-console
        console.log(
          "[STT] WebSocket closed",
          url,
          "code=",
          ev.code,
          "reason=",
          ev.reason,
          "clean=",
          ev.wasClean,
        );
      } catch {
        // ignore
      }
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

interface ParsedDeepgramResult {
  transcript: string;
  /** True when Deepgram considers the utterance complete. */
  isFinal: boolean;
}

function parseDeepgramMessage(raw: string): ParsedDeepgramResult | null {
  try {
    const data = JSON.parse(raw) as DeepgramMessage;
    const transcript =
      data.channel?.alternatives?.[0]?.transcript?.trim() ||
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ||
      "";
    const isFinal = data.speech_final ?? data.is_final ?? false;
    if (!transcript) return null;
    return { transcript, isFinal };
  } catch {
    return null;
  }
}

export function LiveTranscription() {
  const { isRecording, appendTranscript, setSessionId, setMicError, audioInputDeviceId, recentSpeechRef, registerClearBuffer, setInterimTranscript } =
    useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcmProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rmsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const connectionErrorShownRef = useRef(false);
  /** Buffer for the current in-progress utterance (interim transcript). */
  const phraseBufferRef = useRef<string>("");
  /** Last finalized transcript text, to avoid duplicate appends from Deepgram. */
  const lastFinalTextRef = useRef<string>("");
  /** Timestamp of last finalized text, to only dedupe back-to-back repeats. */
  const lastFinalAtRef = useRef<number | null>(null);

  // Allow other parts of the app (e.g., Q&A) to clear the current phrase buffer.
  useEffect(() => {
    registerClearBuffer(() => {
      phraseBufferRef.current = "";
      recentSpeechRef.current = "";
      lastFinalTextRef.current = "";
      lastFinalAtRef.current = null;
      setInterimTranscript("");
    });
  }, [registerClearBuffer, recentSpeechRef, setInterimTranscript]);

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
      if (rmsIntervalRef.current) {
        clearInterval(rmsIntervalRef.current);
        rmsIntervalRef.current = null;
      }
      if (pcmProcessorRef.current) {
        try {
          pcmProcessorRef.current.disconnect();
        } catch {
          // ignore
        }
        pcmProcessorRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      // Reset buffers when recording stops so a new call can reuse the same phrases.
      phraseBufferRef.current = "";
      recentSpeechRef.current = "";
      lastFinalTextRef.current = "";
      lastFinalAtRef.current = null;
      setInterimTranscript("");
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
        stream.getAudioTracks().forEach((track, i) => {
          try {
            console.log("[STT] Audio track", i, ":", {
              label: track.label,
              id: track.id?.slice(0, 20),
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
            });
          } catch {
            // ignore
          }
          track.onended = () => {
            if (mounted && streamRef.current) {
              setMicError("Input device stopped. Select another device in Listen from or click Try again.");
            }
          };
        });

        // Create context first so we use its actual sample rate in the WebSocket URL (browser may not grant 16kHz).
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: PCM_SAMPLE_RATE });
        audioContextRef.current = ctx;
        const actualSampleRate = ctx.sampleRate;
        const query = buildDeepgramParams(actualSampleRate).toString();

        const proxyUrl = getSttProxyUrl();
        try {
          // eslint-disable-next-line no-console
          console.log(
            "[STT] Mode:",
            proxyUrl ? "proxy" : "token",
            "origin:",
            typeof window !== "undefined" ? window.location?.origin : "n/a",
            "proxyUrl:",
            proxyUrl || "(none)",
          );
        } catch {
          // ignore
        }

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
            ws = await connectWebSocket(`wss://api.deepgram.com/v1/listen?${query}`, ["bearer", access_token]);
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

        const showConnectionError = (detail: string) => {
          if (!mounted || connectionErrorShownRef.current) return;
          connectionErrorShownRef.current = true;
          setMicError(`Transcription connection failed. ${detail}`);
        };

        // Capture raw PCM at context sample rate and send as linear16 (v1/listen returns real transcripts).
        const src = ctx.createMediaStreamSource(stream);
        const bufferLength = 4096;
        const processor = ctx.createScriptProcessor(bufferLength, 1, 1);
        pcmProcessorRef.current = processor;
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!mounted || wsRef.current?.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            pcm[i] = s < 0 ? s * 32768 : s * 32767;
          }
          wsRef.current.send(pcm.buffer);
        };
        src.connect(processor);
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        processor.connect(silentGain);
        silentGain.connect(ctx.destination);

        if (mounted) {
          setSessionId((id) => id || crypto.randomUUID());
          keepaliveRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "KeepAlive" }));
            }
          }, KEEPALIVE_INTERVAL_MS);
        }

        const handleResultText = (raw: string) => {
          try {
            console.log("[STT] Raw Deepgram message:", raw);
          } catch {
            // ignore
          }
          const parsed = parseDeepgramMessage(raw);
          if (!parsed) {
            try {
              JSON.parse(raw);
              console.log("[STT] Could not parse message (empty transcript):", raw.slice(0, 200));
            } catch {
              console.log("[STT] Could not parse message (invalid JSON or missing fields):", raw.slice(0, 200));
            }
            return;
          }
          const { transcript, isFinal } = parsed;
          try {
            console.log("[STT] Transcript chunk:", (transcript || "").slice(0, 120), "final=", isFinal);
          } catch {
            // ignore
          }

          phraseBufferRef.current = transcript;
          recentSpeechRef.current = transcript;
          setInterimTranscript(transcript);

          if (!isFinal) return;

          const finalText = transcript.trim();
          if (!finalText) {
            setInterimTranscript("");
            return;
          }

          const now = Date.now();
          if (lastFinalTextRef.current === finalText && lastFinalAtRef.current && now - lastFinalAtRef.current < 1500) {
            setInterimTranscript("");
            return;
          }

          lastFinalTextRef.current = finalText;
          lastFinalAtRef.current = now;
          appendTranscript({ speaker: "user", text: finalText });
          try {
            console.log("[STT] Transcript update (appended):", finalText.slice(0, 80));
          } catch {
            // ignore
          }

          phraseBufferRef.current = "";
          recentSpeechRef.current = "";
          setInterimTranscript("");
        };

        const handleMessage = (event: MessageEvent) => {
          if (!mounted) return;
          const d = event.data;
          if (typeof d === "string") {
            handleResultText(d);
            return;
          }
          if (d instanceof Blob) {
            d.text()
              .then((raw) => {
                if (mounted) handleResultText(raw);
              })
              .catch(() => {});
            return;
          }
          if (d instanceof ArrayBuffer) {
            handleResultText(new TextDecoder().decode(d));
          }
        };

        const handleClose = (ev: CloseEvent) => {
          if (keepaliveRef.current) {
            clearInterval(keepaliveRef.current);
            keepaliveRef.current = null;
          }
          if (pcmProcessorRef.current) {
            try {
              pcmProcessorRef.current.disconnect();
            } catch {
              // ignore
            }
            pcmProcessorRef.current = null;
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
  }, [isRecording, audioInputDeviceId, appendTranscript, setSessionId, setMicError, setInterimTranscript]);

  return null;
}
