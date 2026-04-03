"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { fetchApi } from "@/lib/api-fetch";

const MAX_MESSAGES = 25;

/** Fetches AI suggestions only when the user requests them (Enter or "Get suggestions" button), not on every transcript change. */
export function AISuggestionsFetcher() {
  const {
    transcript,
    scriptContext,
    setSuggestions,
    suggestionsRequestedAt,
    latestInterimTranscriptRef,
    latestInterimSpeakerIdRef,
    diarizationMeSpeakerId,
  } = useSession();
  const prevRequestedAtRef = useRef(0);

  useEffect(() => {
    if (suggestionsRequestedAt === 0 || suggestionsRequestedAt === prevRequestedAtRef.current) return;
    prevRequestedAtRef.current = suggestionsRequestedAt;
    const requestId = suggestionsRequestedAt;

    const normalize = (s: string) =>
      s
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[“”]/g, "\"")
        .replace(/^[\-\u2022]\s*/g, "")
        .replace(/[.?!,;:]+$/g, "")
        .toLowerCase();

    const committed = transcript.slice(-MAX_MESSAGES).map((m) => ({
      speaker: m.speaker,
      text: m.text,
    }));

    const interimTextRaw = latestInterimTranscriptRef.current ?? "";
    const interimText = interimTextRaw.trim();
    const interimNorm = interimText ? normalize(interimText) : "";

    if (committed.length === 0 && interimNorm.length < 3) return;

    let effectiveTranscript = committed;
    if (interimNorm.length >= 3) {
      const interimSpeakerId = latestInterimSpeakerIdRef.current;
      const interimSpeaker: "user" | "prospect" =
        typeof interimSpeakerId === "number"
          ? diarizationMeSpeakerId === null
            ? interimSpeakerId === 0
              ? "user"
              : "prospect"
            : interimSpeakerId === diarizationMeSpeakerId
              ? "user"
              : "prospect"
          : "user";

      const last = committed[committed.length - 1];
      const lastNorm = last?.text ? normalize(last.text) : "";

      const isDuplicate =
        !lastNorm
          ? false
          : lastNorm === interimNorm ||
            (lastNorm.length > 6 && lastNorm.endsWith(interimNorm)) ||
            (interimNorm.length > 6 && interimNorm.endsWith(lastNorm));

      if (!isDuplicate) {
        effectiveTranscript = [...committed, { speaker: interimSpeaker, text: interimText }];
      }
    }

    const recent = effectiveTranscript;

    (async () => {
      try {
        const DEBUG = process.env.NODE_ENV !== "production";
        if (DEBUG) {
          const last2 = effectiveTranscript.slice(-2);
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][AISuggestionsFetcher] committedCount=", transcript.length, "interim=", interimText);
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][AISuggestionsFetcher] payloadLast2=", last2);
        }

        const res = await fetchApi("/api/ai/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: recent,
            scriptContext: scriptContext || undefined,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: unknown[] };
        if (requestId !== prevRequestedAtRef.current) return;
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions as Parameters<typeof setSuggestions>[0]);
        }
      } catch (_) {}
    })();
  }, [suggestionsRequestedAt, transcript, scriptContext, diarizationMeSpeakerId, setSuggestions]);

  return null;
}
