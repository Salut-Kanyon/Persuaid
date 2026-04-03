"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { fetchApi } from "@/lib/api-fetch";
import type { DealContext } from "@/components/app/contexts/SessionContext";

const DEBOUNCE_MS = 10000;
const MIN_MESSAGES = 2;
const MAX_MESSAGES = 80;

/**
 * Debounced extraction of deal context from the live transcript.
 * When recording and transcript updates, calls POST /api/ai/deal-context and merges result into session dealContext.
 */
export function DealContextFetcher() {
  const { transcript, isRecording, setDealContext } = useSession();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRecording || transcript.length < MIN_MESSAGES) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const recent = transcript.slice(-MAX_MESSAGES).map((m) => ({
        speaker: m.speaker,
        text: m.text,
      }));

      fetchApi("/api/ai/deal-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: recent }),
      })
        .then((res) => res.json())
        .then((data: { dealContext?: DealContext; error?: string }) => {
          if (data.error || !data.dealContext) return;
          setDealContext((prev) => ({ ...prev, ...data.dealContext }));
        })
        .catch(() => {});
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [transcript, isRecording, setDealContext]);

  return null;
}
