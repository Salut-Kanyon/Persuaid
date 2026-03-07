"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TranscriptSpeaker = "user" | "prospect";

export interface TranscriptMessage {
  id: string;
  speaker: TranscriptSpeaker;
  name?: string;
  text: string;
  timestamp: string;
}

export type SuggestionType = "objection" | "next-step" | "talking-point" | "question";
export type SuggestionPriority = "high" | "medium" | "low";

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  text: string;
  priority: SuggestionPriority;
}

interface SessionContextValue {
  transcript: TranscriptMessage[];
  appendTranscript: (segment: {
    speaker?: TranscriptSpeaker;
    text: string;
    name?: string;
  }) => void;
  clearTranscript: () => void;
  suggestions: Suggestion[];
  setSuggestions: (s: Suggestion[] | ((prev: Suggestion[]) => Suggestion[])) => void;
  isRecording: boolean;
  setRecording: (value: boolean) => void;
  /** Set when mic fails to start (permission or device). Cleared on success or when user stops recording. */
  micError: string | null;
  setMicError: (value: string | null) => void;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
  selectedScriptId: string | null;
  setSelectedScriptId: (id: string | null) => void;
  scriptContext: string;
  setScriptContext: (s: string) => void;
  sessionId: string | null;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isRecording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [scriptContext, setScriptContext] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const appendTranscript = useCallback(
    (segment: {
      speaker?: TranscriptSpeaker;
      text: string;
      name?: string;
    }) => {
      const trimmed = segment.text?.trim();
      if (!trimmed) return;
      setTranscript((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          speaker: segment.speaker ?? "user",
          name: segment.name,
          text: trimmed,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  const clearTranscript = useCallback(() => setTranscript([]), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      transcript,
      appendTranscript,
      clearTranscript,
      suggestions,
      setSuggestions,
      isRecording,
      setRecording,
      micError,
      setMicError,
      elapsedSeconds,
      setElapsedSeconds,
      selectedScriptId,
      setSelectedScriptId,
      scriptContext,
      setScriptContext,
      sessionId,
      setSessionId,
    }),
    [
      transcript,
      appendTranscript,
      clearTranscript,
      suggestions,
      isRecording,
      micError,
      elapsedSeconds,
      selectedScriptId,
      scriptContext,
      sessionId,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}

export function useSessionOptional() {
  return useContext(SessionContext);
}
