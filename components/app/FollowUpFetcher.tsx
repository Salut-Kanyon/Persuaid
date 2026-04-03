"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { getClientIanaTimeZone } from "@/lib/client-timezone";
import { fetchApi } from "@/lib/api-fetch";

/** Send enough of the transcript so the AI sees long questions and full context (paragraph-style). */
const MAX_MESSAGES = 150;

const DEBUG = process.env.NODE_ENV !== "production";

/** Fetches answer vs follow-up in separate effects so responses never share one state bucket (no races). */
export function FollowUpFetcher() {
  const {
    transcript,
    scriptContext,
    notesContext,
    dealContext,
    setAnswerText,
    setAnswerSource,
    setSuggestedFollowUpText,
    setSuggestedFollowUpSource,
    answerRequestedAt,
    followUpQuestionRequestedAt,
    latestInterimTranscriptRef,
    latestInterimSpeakerIdRef,
    diarizationMeSpeakerId,
  } = useSession();

  const prevAnswerAtRef = useRef(0);
  const prevQuestionAtRef = useRef(0);

  const sourceTypeToLabel: Record<string, string> = {
    notes: "your notes",
    conversation: "the conversation",
    web: "the web",
  };

  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[“”]/g, "\"")
      .replace(/^[\-\u2022]\s*/g, "")
      .replace(/[.?!,;:]+$/g, "")
      .toLowerCase();

  useEffect(() => {
    if (answerRequestedAt === 0 || answerRequestedAt === prevAnswerAtRef.current) return;
    prevAnswerAtRef.current = answerRequestedAt;
    const requestId = answerRequestedAt;

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug("[Persuaid][FollowUp] request started: answer", { requestId });
    }

    const committed = transcript.slice(-MAX_MESSAGES).map((m) => ({
      speaker: m.speaker,
      text: m.text,
    }));

    const interimTextRaw = latestInterimTranscriptRef.current ?? "";
    const interimText = interimTextRaw.trim();
    const interimNorm = interimText ? normalize(interimText) : "";

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

    setAnswerText("…");
    setAnswerSource("");
    setSuggestedFollowUpText("");
    setSuggestedFollowUpSource("");

    (async () => {
      try {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUpFetcher] answer payload tail=", effectiveTranscript.slice(-2));
        }

        const res = await fetchApi("/api/ai/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: effectiveTranscript,
            scriptContext: scriptContext || undefined,
            notesContext: notesContext || undefined,
            dealContext: Object.keys(dealContext).length ? dealContext : undefined,
            mode: "answer",
            timeZone: getClientIanaTimeZone(),
          }),
        });
        const data = (await res.json()) as { text?: string; sourceType?: string; error?: string };
        if (requestId !== prevAnswerAtRef.current) {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug("[Persuaid][FollowUp] answer response dropped (stale)", { requestId });
          }
          return;
        }
        if (res.ok && typeof data.text === "string") {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug("[Persuaid][FollowUp] request completed: answer", {
              requestId,
              rawAnswer: data.text,
              sourceType: data.sourceType,
            });
          }
          setAnswerText(data.text);
          setAnswerSource(sourceTypeToLabel[data.sourceType ?? ""] ?? "the conversation");
        } else {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug("[Persuaid][FollowUp] answer error", { requestId, error: data.error });
          }
          setAnswerText(data.error || "Something went wrong. Try again.");
          setAnswerSource("");
        }
      } catch {
        if (requestId !== prevAnswerAtRef.current) return;
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUp] answer fetch failed", { requestId });
        }
        setAnswerText("Request failed. Try again.");
        setAnswerSource("");
      }
    })();
  }, [
    answerRequestedAt,
    transcript,
    scriptContext,
    notesContext,
    dealContext,
    diarizationMeSpeakerId,
    setAnswerText,
    setAnswerSource,
    setSuggestedFollowUpText,
    setSuggestedFollowUpSource,
    latestInterimTranscriptRef,
    latestInterimSpeakerIdRef,
  ]);

  useEffect(() => {
    if (followUpQuestionRequestedAt === 0 || followUpQuestionRequestedAt === prevQuestionAtRef.current) return;
    prevQuestionAtRef.current = followUpQuestionRequestedAt;
    const requestId = followUpQuestionRequestedAt;

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug("[Persuaid][FollowUp] request started: follow_up_question", { requestId });
    }

    const committed = transcript.slice(-MAX_MESSAGES).map((m) => ({
      speaker: m.speaker,
      text: m.text,
    }));

    const interimTextRaw = latestInterimTranscriptRef.current ?? "";
    const interimText = interimTextRaw.trim();
    const interimNorm = interimText ? normalize(interimText) : "";

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

    setSuggestedFollowUpText("…");
    setSuggestedFollowUpSource("");

    (async () => {
      try {
        const res = await fetchApi("/api/ai/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: effectiveTranscript,
            scriptContext: scriptContext || undefined,
            notesContext: notesContext || undefined,
            dealContext: Object.keys(dealContext).length ? dealContext : undefined,
            mode: "follow_up_question",
            timeZone: getClientIanaTimeZone(),
          }),
        });
        const data = (await res.json()) as { text?: string; sourceType?: string; error?: string };
        if (requestId !== prevQuestionAtRef.current) {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug("[Persuaid][FollowUp] follow-up response dropped (stale)", { requestId });
          }
          return;
        }
        if (res.ok && typeof data.text === "string") {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug("[Persuaid][FollowUp] request completed: follow_up_question", {
              requestId,
              rawFollowUp: data.text,
              sourceType: data.sourceType,
            });
          }
          setSuggestedFollowUpText(data.text);
          setSuggestedFollowUpSource(sourceTypeToLabel[data.sourceType ?? ""] ?? "the conversation");
        } else {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug("[Persuaid][FollowUp] follow-up error", { requestId, error: data.error });
          }
          setSuggestedFollowUpText(data.error || "Something went wrong. Try again.");
          setSuggestedFollowUpSource("");
        }
      } catch {
        if (requestId !== prevQuestionAtRef.current) return;
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("[Persuaid][FollowUp] follow-up fetch failed", { requestId });
        }
        setSuggestedFollowUpText("Request failed. Try again.");
        setSuggestedFollowUpSource("");
      }
    })();
  }, [
    followUpQuestionRequestedAt,
    transcript,
    scriptContext,
    notesContext,
    dealContext,
    diarizationMeSpeakerId,
    setSuggestedFollowUpText,
    setSuggestedFollowUpSource,
    latestInterimTranscriptRef,
    latestInterimSpeakerIdRef,
  ]);

  return null;
}
