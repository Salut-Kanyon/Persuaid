"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

const MAX_MESSAGES = 25;

/** Fetches AI suggestions only when the user requests them (Enter or "Get suggestions" button), not on every transcript change. */
export function AISuggestionsFetcher() {
  const { transcript, scriptContext, setSuggestions, suggestionsRequestedAt } = useSession();
  const prevRequestedAtRef = useRef(0);

  useEffect(() => {
    if (suggestionsRequestedAt === 0 || suggestionsRequestedAt === prevRequestedAtRef.current) return;
    prevRequestedAtRef.current = suggestionsRequestedAt;

    if (transcript.length === 0) return;

    const recent = transcript.slice(-MAX_MESSAGES).map((m) => ({
      speaker: m.speaker,
      text: m.text,
    }));

    (async () => {
      try {
        const res = await fetch("/api/ai/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: recent,
            scriptContext: scriptContext || undefined,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: unknown[] };
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions as Parameters<typeof setSuggestions>[0]);
        }
      } catch (_) {}
    })();
  }, [suggestionsRequestedAt, transcript, scriptContext, setSuggestions]);

  return null;
}
