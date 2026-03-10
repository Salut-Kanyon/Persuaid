"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

const MAX_MESSAGES = 25;

/** Fetches follow-up: mode "answer" (Enter) = what to say; "follow_up_question" (button) = question to ask. */
export function FollowUpFetcher() {
  const { transcript, scriptContext, notesContext, setFollowUpText, followUpRequestedAt, followUpMode } = useSession();
  const prevRequestedAtRef = useRef(0);

  useEffect(() => {
    if (followUpRequestedAt === 0 || followUpRequestedAt === prevRequestedAtRef.current) return;
    prevRequestedAtRef.current = followUpRequestedAt;

    const recent = transcript.slice(-MAX_MESSAGES).map((m) => ({
      speaker: m.speaker,
      text: m.text,
    }));

    setFollowUpText("…");

    (async () => {
      try {
        const res = await fetch("/api/ai/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: recent,
            scriptContext: scriptContext || undefined,
            notesContext: notesContext || undefined,
            mode: followUpMode,
          }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (res.ok && typeof data.text === "string") {
          setFollowUpText(data.text);
        } else {
          setFollowUpText(data.error || "Something went wrong. Try again.");
        }
      } catch {
        setFollowUpText("Request failed. Try again.");
      }
    })();
  }, [followUpRequestedAt, transcript, scriptContext, notesContext, followUpMode, setFollowUpText]);

  return null;
}
