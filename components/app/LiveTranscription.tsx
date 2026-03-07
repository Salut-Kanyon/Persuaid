"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";
const KEEPALIVE_INTERVAL_MS = 5000;

interface DeepgramResult {
  type?: string;
  channel?: {
    alternatives?: Array<{ transcript?: string }>;
  };
  speech_final?: boolean;
  is_final?: boolean;
}

export function LiveTranscription() {
  const { isRecording, appendTranscript, setSessionId } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecording) {
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

    (async () => {
      try {
        const tokenRes = await fetch("/api/stt/token");
        if (!tokenRes.ok || !mounted) return;
        const { access_token } = (await tokenRes.json()) as { access_token?: string };
        if (!access_token || !mounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

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

        const params = new URLSearchParams({
          punctuate: "true",
          smart_format: "true",
          interim_results: "true",
          utterance_end_ms: "1000",
        });
        const wsUrl = `${DEEPGRAM_WS_URL}?${params.toString()}`;
        const ws = new WebSocket(wsUrl, ["bearer", access_token]);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          setSessionId((id) => id || crypto.randomUUID());
          mediaRecorder.start(250);
          keepaliveRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "KeepAlive" }));
            }
          }, KEEPALIVE_INTERVAL_MS);
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data as string) as DeepgramResult;
            if (data.type !== "Results") return;
            const transcript = data.channel?.alternatives?.[0]?.transcript?.trim();
            if (!transcript) return;
            if (data.speech_final ?? data.is_final) {
              appendTranscript({ speaker: "user", text: transcript });
            }
          } catch (_) {}
        };

        ws.onerror = () => {
          if (mounted) appendTranscript({ speaker: "user", text: "[Transcription connection error]" });
        };

        ws.onclose = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }
        };
      } catch (err) {
        if (mounted) {
          console.error("LiveTranscription error:", err);
          appendTranscript({
            speaker: "user",
            text: "[Could not start microphone. Check permissions and try again.]",
          });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isRecording, appendTranscript, setSessionId]);

  return null;
}
