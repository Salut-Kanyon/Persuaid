"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";

/** Shows the live transcript that is fed into the follow-up AI. Use to verify the conversation is being captured. */
export function LiveTranscriptPanel() {
  const { transcript, interimTranscript } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript.length, interimTranscript]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <p className="flex-shrink-0 px-4 py-2 text-xs text-text-muted border-b border-border/30">
        This is what’s being sent to the follow-up AI.
      </p>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2"
      >
        {transcript.length === 0 && !interimTranscript ? (
          <p className="text-sm text-text-dim/70">No speech yet. Start the call to see the live transcript.</p>
        ) : (
          <>
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className="text-sm"
              >
                <span className={msg.speaker === "prospect" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-green-700 dark:text-green-400 font-medium"}>
                  {msg.speaker === "prospect" ? "Prospect" : "Rep"}:
                </span>{" "}
                <span className="text-text-primary">{msg.text}</span>
              </div>
            ))}
            {interimTranscript ? (
              <div className="text-sm text-text-dim/80 italic">
                <span className="text-green-700 dark:text-green-400 font-medium">Rep (in progress):</span>{" "}
                {interimTranscript}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
