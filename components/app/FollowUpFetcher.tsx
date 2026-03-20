"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

/** Send enough of the transcript so the AI sees long questions and full context (paragraph-style). */
const MAX_MESSAGES = 150;

/** Fetches follow-up: mode "answer" (Enter) = what to say; "follow_up_question" (button) = question to ask. */
export function FollowUpFetcher() {
  const {
    transcript,
    scriptContext,
    notesContext,
    dealContext,
    setFollowUpText,
    setFollowUpSource,
    followUpRequestedAt,
    followUpMode,
    latestInterimTranscriptRef,
    latestInterimSpeakerIdRef,
    diarizationMeSpeakerId,
  } = useSession();
  const prevRequestedAtRef = useRef(0);

  const sourceTypeToLabel: Record<string, string> = {
    notes: "your notes",
    conversation: "the conversation",
    web: "the web",
  };

  useEffect(() => {
    if (followUpRequestedAt === 0 || followUpRequestedAt === prevRequestedAtRef.current) return;
    prevRequestedAtRef.current = followUpRequestedAt;
    const requestId = followUpRequestedAt;

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

    // Build an effective transcript for AI only:
    // committed transcript + latest interim utterance (if it isn't a duplicate).
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

    setFollowUpText("…");
    setFollowUpSource("");

    (async () => {
      try {
        const DEBUG = process.env.NODE_ENV !== "production";
        if (DEBUG) {
          const last2 = effectiveTranscript.slice(-2);
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUpFetcher] committedCount=", transcript.length, "interim=", interimText);
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUpFetcher] payloadLast2=", last2);
        }

        const res = await fetch("/api/ai/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: effectiveTranscript,
            scriptContext: scriptContext || undefined,
            notesContext: notesContext || undefined,
            dealContext: Object.keys(dealContext).length ? dealContext : undefined,
            mode: followUpMode,
          }),
        });
        const data = (await res.json()) as { text?: string; sourceType?: string; error?: string };
        if (requestId !== prevRequestedAtRef.current) return;
        if (res.ok && typeof data.text === "string") {
          setFollowUpText(data.text);
          setFollowUpSource(sourceTypeToLabel[data.sourceType ?? ""] ?? "the conversation");
        } else {
          setFollowUpText(data.error || "Something went wrong. Try again.");
          setFollowUpSource("");
        }
      } catch {
        if (requestId !== prevRequestedAtRef.current) return;
        setFollowUpText("Request failed. Try again.");
        setFollowUpSource("");
      }
    })();
  }, [followUpRequestedAt, transcript, scriptContext, notesContext, dealContext, followUpMode, diarizationMeSpeakerId, setFollowUpText, setFollowUpSource]);

  return null;
}
