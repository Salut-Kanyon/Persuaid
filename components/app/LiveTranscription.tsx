"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
// v1/listen with raw PCM so we get real transcripts (WebM from MediaRecorder often returns empty on v1).
const PCM_SAMPLE_RATE = 16000;
function buildDeepgramParams(sampleRate: number): URLSearchParams {
  const params = new URLSearchParams({
    encoding: "linear16",
    sample_rate: String(sampleRate),
    model: "nova-2",
    punctuate: "true",
    smart_format: "true",
    interim_results: "true",
    utterance_end_ms: "5000",
    endpointing: "500",
    diarize: "true",
    utterances: "true",
  });
  return params;
}
const KEEPALIVE_INTERVAL_MS = 2000;

function getSttProxyUrl(): string {
  // 1. If NEXT_PUBLIC_STT_PROXY_URL exists, use that
  const envProxy = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_STT_PROXY_URL ?? "").trim() : "";
  if (envProxy) {
    return envProxy.replace(/\/$/, "");
  }
  // 2. Packaged Electron app: origin http://127.0.0.1:2999 → use in-app proxy on 2998
  if (typeof window !== "undefined" && window.location?.origin?.startsWith("http://127.0.0.1:2999")) {
    return "ws://127.0.0.1:2998";
  }
  // 3. Localhost dev: use local STT proxy by default (no direct Deepgram token mode)
  if (typeof window !== "undefined") {
    const host = window.location?.hostname ?? "";
    if (host === "localhost" || host === "127.0.0.1") {
      return "ws://127.0.0.1:2998";
    }
  }
  // 4. Fallback only: token mode (production web deploy, no proxy available)
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
  channel?: { alternatives?: Array<{ transcript?: string; words?: Array<{ word?: string; punctuated_word?: string; speaker?: number }> }> };
  speech_final?: boolean;
  is_final?: boolean;
  results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string; words?: Array<{ word?: string; punctuated_word?: string; speaker?: number }> }> }> };
}

interface ParsedDeepgramResult {
  transcript: string;
  /** True when Deepgram considers the utterance complete. */
  isFinal: boolean;
  /** Diarized speaker id when available (e.g. 0/1). */
  speakerId?: number;
}

/**
 * Parse a Deepgram message. When diarization is on, each word can have a speaker.
 * We split the segment by speaker so overlapping speech or mid-utterance speaker
 * changes produce separate transcript entries with the correct label (instead of
 * labeling the whole segment by the first word's speaker only).
 */
function parseDeepgramMessage(raw: string): ParsedDeepgramResult | ParsedDeepgramResult[] | null {
  try {
    const data = JSON.parse(raw) as DeepgramMessage;
    const alt =
      data.channel?.alternatives?.[0] ||
      data.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alt?.transcript?.trim() || "";
    const isFinal = data.speech_final ?? data.is_final ?? false;
    if (!transcript) return null;

    const words = alt?.words;
    if (Array.isArray(words) && words.length > 0) {
      const hasMultipleSpeakers = words.some(
        (w, i) => i > 0 && typeof w?.speaker === "number" && w.speaker !== words[0]?.speaker
      );
      if (hasMultipleSpeakers) {
        const segments: ParsedDeepgramResult[] = [];
        let run: { speaker: number; texts: string[] } = {
          speaker: typeof words[0]?.speaker === "number" ? words[0].speaker : 0,
          texts: [words[0]?.punctuated_word ?? words[0]?.word ?? ""],
        };
        for (let i = 1; i < words.length; i++) {
          const w = words[i];
          const sp = typeof w?.speaker === "number" ? w.speaker : run.speaker;
          const text = w?.punctuated_word ?? w?.word ?? "";
          if (sp === run.speaker) {
            run.texts.push(text);
          } else {
            segments.push({
              transcript: run.texts.join(" ").trim(),
              isFinal,
              speakerId: run.speaker,
            });
            run = { speaker: sp, texts: [text] };
          }
        }
        if (run.texts.length > 0) {
          segments.push({
            transcript: run.texts.join(" ").trim(),
            isFinal,
            speakerId: run.speaker,
          });
        }
        return segments.filter((s) => s.transcript.length > 0);
      }
    }

    const speakerId =
      typeof alt?.words?.[0]?.speaker === "number" ? alt.words![0].speaker : undefined;
    return { transcript, isFinal, speakerId };
  } catch {
    return null;
  }
}

/** True only when text clearly continues the previous phrase (e.g. "in monthly...", "including..."). Avoids merging new thoughts. */
function looksLikeContinuation(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const firstWord = t.split(/\s+/)[0]?.toLowerCase() ?? "";
  const continuationWords = new Set([
    "and", "or", "in", "but", "including", "so", "as", "for", "to", "with", "the", "a", "an",
    "that", "which", "if", "because", "of", "than", "then", "from", "into", "on", "at", "by",
  ]);
  return continuationWords.has(firstWord);
}

/**
 * Always accumulate: merge new transcript with buffer so we never drop what was already said.
 * When Deepgram sends only the tail, we keep the buffer and append the new part (with overlap removed).
 * Never replace with a shorter string—always print everything said.
 */
function mergeBufferWithNew(buffer: string, newText: string): string {
  const b = buffer.trim();
  const t = newText.trim();
  if (!b) return t;
  if (!t) return b;
  if (b === t) return b;
  if (t.toLowerCase().startsWith(b.toLowerCase())) return t;
  if (b.toLowerCase().endsWith(t.toLowerCase())) return b;
  const bEnd = b.trimEnd();
  const maxOverlap = Math.min(bEnd.length, t.length, 100);
  for (let len = maxOverlap; len >= 1; len--) {
    const bSuffix = bEnd.slice(-len).toLowerCase();
    const tPrefix = t.slice(0, len).toLowerCase();
    if (bSuffix === tPrefix) {
      const rest = t.slice(len).trimStart();
      return b + (rest ? " " + rest : "");
    }
  }
  if (t.length < b.length) {
    return b + " " + t;
  }
  return t;
}

export function LiveTranscription() {
  const {
    isRecording,
    appendTranscript,
    appendToLastTranscript,
    setSessionId,
    setMicError,
    audioInputDeviceId,
    recentSpeechRef,
    registerClearBuffer,
    setInterimTranscript,
    setInterimSpeakerId,
    diarizationMeSpeakerId,
    setDiarizationSpeakerIds,
  } = useSession();
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
  /** When no final is received, commit interim to transcript after this delay so shown text is saved. */
  const commitInterimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Speaker id for current interim (used when committing on timeout). */
  const lastInterimSpeakerIdRef = useRef<number | null>(null);
  /** Last speaker we appended (so we can merge continuation fragments into same line). */
  const lastAppendedSpeakerRef = useRef<"user" | "prospect" | null>(null);

  // Allow other parts of the app (e.g., Q&A) to clear the current phrase buffer.
  useEffect(() => {
    registerClearBuffer(() => {
      if (commitInterimTimeoutRef.current) {
        clearTimeout(commitInterimTimeoutRef.current);
        commitInterimTimeoutRef.current = null;
      }
      phraseBufferRef.current = "";
      recentSpeechRef.current = "";
      lastFinalTextRef.current = "";
      lastFinalAtRef.current = null;
      lastInterimSpeakerIdRef.current = null;
      setInterimTranscript("");
    });
  }, [registerClearBuffer, recentSpeechRef, setInterimTranscript]);

  useEffect(() => {
    // Debug: confirm effect runs and isRecording state
    console.log("[STT] LiveTranscription effect fired. isRecording =", isRecording);
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
        console.log("[STT] gotUserMedia ok, stream:", stream);
        console.log(
          "[STT] audio tracks:",
          stream.getAudioTracks().map((t) => ({
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          }))
        );
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
        console.log("[STT] ctx.sampleRate =", ctx.sampleRate);
        console.log("[STT] AudioContext state before resume:", ctx.state);
        // Browsers often start AudioContext suspended; audio won't flow until resumed. This fixes "talking but nothing captured".
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        console.log("[STT] AudioContext state after resume:", ctx.state);
        if (!mounted) return;
        const actualSampleRate = ctx.sampleRate;
        const query = buildDeepgramParams(actualSampleRate).toString();

        const proxyUrl = getSttProxyUrl();
        const useProxy = !!proxyUrl;
        const sttMode = useProxy ? "proxy" : "token";
        const wsUrl = useProxy ? `${proxyUrl}/v1/listen?${query}` : `wss://api.deepgram.com/v1/listen?${query}`;
        const isDev = typeof window !== "undefined" && (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1");
        console.log(
          "[STT] Selected STT mode:",
          sttMode,
          "| WebSocket URL:",
          wsUrl,
          "| Proxy mode:",
          useProxy,
          "| Token mode:",
          !useProxy,
        );

        let ws: WebSocket;

        if (proxyUrl) {
          // Localhost dev or packaged Electron: use local STT proxy. Key in .env.local or app config.
          try {
            ws = await connectWebSocket(wsUrl);
          } catch {
            if (!mounted) return;
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setMicError(
              "Could not connect to STT proxy. Run: node scripts/stt-ws-proxy.js (ensure DEEPGRAM_API_KEY is in .env.local). For packaged app, add DEEPGRAM_API_KEY to the app config folder."
            );
            return;
          }
        } else {
          // Browser (or desktop:dev on localhost:3000): use token from Next.js API
          const connectWithToken = async (): Promise<WebSocket> => {
            const tokenRes = await fetch("/api/stt/token", { cache: "no-store" });
            if (!mounted) throw new Error("unmounted");
            if (isDev) {
              console.log("[STT] Token fetch:", tokenRes.ok ? "OK" : "FAILED", "status:", tokenRes.status);
            }
            if (!tokenRes.ok) {
              const body = await tokenRes.json().catch(() => ({})) as { error?: string };
              const msg =
                tokenRes.status === 503
                  ? "Add DEEPGRAM_API_KEY to .env.local and restart the dev server."
                  : (body?.error ?? "Transcription service error.");
              throw new Error(msg);
            }
            const tokenData = (await tokenRes.json()) as { access_token?: string; expires_in?: number; error?: string };
            const access_token = tokenData.access_token?.trim() ?? null;
            if (isDev) {
              console.log("[STT] Token response shape: access_token:", !!access_token, "length:", access_token?.length ?? 0, "expires_in:", tokenData.expires_in ?? "n/a");
            }
            if (!access_token) throw new Error(tokenData.error ?? "No token returned.");
            // Deepgram temporary tokens (from /auth/grant) use Sec-WebSocket-Protocol: bearer, <jwt>
            const url = `wss://api.deepgram.com/v1/listen?${query}`;
            const protocols = ["bearer", access_token];
            console.log("[STT] Token mode: connecting to", url, "protocols: bearer + token (length", access_token.length, ")");
            return connectWebSocket(url, protocols);
          };

          try {
            ws = await connectWithToken();
          } catch (e) {
            if (!mounted) return;
            const errMsg = e instanceof Error ? e.message : "";
            if (errMsg && !errMsg.includes("WebSocket") && !errMsg.includes("unmounted")) {
              stream.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              setMicError(errMsg);
              return;
            }
            // First failure: retry once with a fresh token (handshake/1006 can be transient)
            try {
              ws = await connectWithToken();
            } catch (retryErr) {
              if (!mounted) return;
              stream.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              setMicError(
                "Could not connect to Deepgram. Check: (1) DEEPGRAM_API_KEY in .env.local is correct and has Member or Owner role (restricted keys cannot stream), (2) try in an incognito window to rule out extensions, (3) restart the dev server (npm run dev)."
              );
              return;
            }
          }
        }
        if (!mounted) return;
        wsRef.current = ws;
        console.log("[STT] websocket open");

        const showConnectionError = (detail: string) => {
          if (!mounted || connectionErrorShownRef.current) return;
          connectionErrorShownRef.current = true;
          setMicError(`Transcription connection failed. ${detail}`);
        };

        // Capture raw PCM at context sample rate and send as linear16 (v1/listen returns real transcripts).
        // Smaller buffer (1024) = ~64ms chunks = faster capture and send = fewer dropped first words.
        const src = ctx.createMediaStreamSource(stream);
        const bufferLength = 1024;
        const processor = ctx.createScriptProcessor(bufferLength, 1, 1);
        pcmProcessorRef.current = processor;
        let onAudioProcessCount = 0;
        let pcmSendCount = 0;
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          onAudioProcessCount++;
          if (onAudioProcessCount <= 5) console.log("[STT] onaudioprocess fired");
          if (!mounted || wsRef.current?.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            pcm[i] = s < 0 ? s * 32768 : s * 32767;
          }
          wsRef.current.send(pcm.buffer);
          pcmSendCount++;
          if (pcmSendCount === 1 || pcmSendCount % 100 === 0) {
            console.log("[STT] sending PCM bytes:", pcm.byteLength);
          }
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

          const segments = Array.isArray(parsed) ? parsed : [parsed];
          const first = segments[0];
          const transcript = first.transcript;
          const isFinal = first.isFinal;
          console.log("[STT] parsed transcript:", { transcript: (transcript || "").slice(0, 80), isFinal, speakerId: first.speakerId });
          try {
            console.log("[STT] Transcript chunk:", (transcript || "").slice(0, 120), "final=", isFinal, "segments=", segments.length);
          } catch {
            // ignore
          }

          const merged = mergeBufferWithNew(phraseBufferRef.current, transcript ?? "");
          phraseBufferRef.current = merged;
          recentSpeechRef.current = merged;
          setInterimTranscript(merged);
          if (transcript) console.log("[STT] buffer merged, showing:", merged.slice(0, 80));
          const speakerIdForInterim = typeof first.speakerId === "number" ? first.speakerId : null;
          lastInterimSpeakerIdRef.current = speakerIdForInterim;
          setInterimSpeakerId(speakerIdForInterim);
          setDiarizationSpeakerIds((prev) => {
            const next = new Set(prev);
            segments.forEach((s) => {
              if (typeof s.speakerId === "number") next.add(s.speakerId!);
            });
            return next.size === prev.length && prev.every((id) => next.has(id)) ? prev : [...next].sort((a, b) => a - b);
          });

          if (!isFinal) {
            if (commitInterimTimeoutRef.current) clearTimeout(commitInterimTimeoutRef.current);
            if (transcript.trim()) {
              commitInterimTimeoutRef.current = setTimeout(() => {
                commitInterimTimeoutRef.current = null;
                if (!mounted) return;
                const toCommit = phraseBufferRef.current?.trim() ?? "";
                if (!toCommit) return;
                const sid = lastInterimSpeakerIdRef.current;
                const mappedSpeaker =
                  typeof sid === "number"
                    ? (diarizationMeSpeakerId === null ? (sid === 0 ? "user" : "prospect") : sid === diarizationMeSpeakerId ? "user" : "prospect")
                    : "user";
                if (looksLikeContinuation(toCommit) && lastAppendedSpeakerRef.current === mappedSpeaker) {
                  appendToLastTranscript({ speaker: mappedSpeaker, text: toCommit });
                } else {
                  appendTranscript({ speaker: mappedSpeaker, text: toCommit });
                }
                lastAppendedSpeakerRef.current = mappedSpeaker;
                phraseBufferRef.current = "";
                recentSpeechRef.current = "";
                lastFinalTextRef.current = toCommit;
                lastFinalAtRef.current = Date.now();
                setInterimTranscript("");
                setInterimSpeakerId(null);
              }, 3500);
            }
            return;
          }

          if (commitInterimTimeoutRef.current) {
            clearTimeout(commitInterimTimeoutRef.current);
            commitInterimTimeoutRef.current = null;
          }

          const combinedFinal = segments.map((s) => s.transcript).join(" ").trim();
          if (combinedFinal.length === 0) {
            setInterimTranscript("");
            return;
          }

          const now = Date.now();
          if (lastFinalTextRef.current === combinedFinal && lastFinalAtRef.current && now - lastFinalAtRef.current < 1500) {
            setInterimTranscript("");
            return;
          }

          const buf = phraseBufferRef.current.trim();
          const finalTrimmed = combinedFinal.trim();
          const bufNorm = buf.replace(/[.?!]+$/, "").trim().toLowerCase();
          const finalNorm = finalTrimmed.replace(/[.?!]+$/, "").trim().toLowerCase();
          const bufferHasFullSentence =
            buf.length > 0 &&
            finalTrimmed.length > 0 &&
            buf.length > finalTrimmed.length &&
            (bufNorm.endsWith(finalNorm) || buf.toLowerCase().endsWith(finalTrimmed.toLowerCase()));

          let textToAppend = combinedFinal;
          if (bufferHasFullSentence) {
            textToAppend = buf;
          }

          lastFinalTextRef.current = textToAppend;
          lastFinalAtRef.current = now;

          const firstSeg = segments[0];
          const firstSpeaker: "user" | "prospect" =
            typeof firstSeg?.speakerId === "number"
              ? (diarizationMeSpeakerId === null
                ? (firstSeg.speakerId === 0 ? "user" : "prospect")
                : (firstSeg.speakerId === diarizationMeSpeakerId ? "user" : "prospect"))
              : "user";

          if (bufferHasFullSentence) {
            const isContinuation = looksLikeContinuation(textToAppend) && lastAppendedSpeakerRef.current === firstSpeaker;
            if (isContinuation) {
              appendToLastTranscript({ speaker: firstSpeaker, text: textToAppend });
            } else {
              appendTranscript({ speaker: firstSpeaker, text: textToAppend });
            }
            lastAppendedSpeakerRef.current = firstSpeaker;
          } else {
            for (const seg of segments) {
              const finalText = seg.transcript.trim();
              if (!finalText) continue;
              const speakerId = seg.speakerId;
              const mappedSpeaker: "user" | "prospect" =
                typeof speakerId === "number"
                  ? (diarizationMeSpeakerId === null
                    ? (speakerId === 0 ? "user" : "prospect")
                    : (speakerId === diarizationMeSpeakerId ? "user" : "prospect"))
                  : "user";
              const isContinuation = looksLikeContinuation(finalText) && lastAppendedSpeakerRef.current === mappedSpeaker;
              if (isContinuation) {
                appendToLastTranscript({ speaker: mappedSpeaker, text: finalText });
              } else {
                appendTranscript({ speaker: mappedSpeaker, text: finalText });
              }
              lastAppendedSpeakerRef.current = mappedSpeaker;
            }
          }
          try {
            if (bufferHasFullSentence) {
              console.log("[STT] Used interim buffer (full sentence), appended:", textToAppend.slice(0, 80));
            } else {
              console.log("[STT] Transcript update (appended):", textToAppend.slice(0, 80));
            }
          } catch {
            // ignore
          }

          phraseBufferRef.current = "";
          recentSpeechRef.current = "";
          setInterimTranscript("");
          setInterimSpeakerId(null);
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
          console.log("[STT] websocket close", ev.code, ev.reason);
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
        ws.onerror = () => {
          console.log("[STT] websocket error");
          showConnectionError("Check your network and try again.");
        };
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
      lastAppendedSpeakerRef.current = null;
      if (commitInterimTimeoutRef.current) {
        clearTimeout(commitInterimTimeoutRef.current);
        commitInterimTimeoutRef.current = null;
      }
    };
  }, [isRecording, audioInputDeviceId, appendTranscript, appendToLastTranscript, setSessionId, setMicError, setInterimTranscript, setInterimSpeakerId, setDiarizationSpeakerIds, diarizationMeSpeakerId]);

  return null;
}
