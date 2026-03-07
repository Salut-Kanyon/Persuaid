"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

const DEBOUNCE_MS = 4000;
const MAX_MESSAGES = 25;

export function AISuggestionsFetcher() {
  const { transcript, scriptContext, setSuggestions } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (transcript.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      const recent = transcript.slice(-MAX_MESSAGES).map((m) => ({
        speaker: m.speaker,
        text: m.text,
      }));
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
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [transcript, scriptContext, setSuggestions]);

  return null;
}
