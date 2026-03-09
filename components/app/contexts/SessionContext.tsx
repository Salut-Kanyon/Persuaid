"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  selectedScriptId: string | null;
  setSelectedScriptId: (id: string | null) => void;
  scriptContext: string;
  setScriptContext: (s: string) => void;
  /** Notes content from the Notes panel; used as context for follow-up suggestions. */
  notesContext: string;
  setNotesContext: (s: string) => void;
  sessionId: string | null;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  /** Current speech buffer (what was last said). Updated by LiveTranscription. Read on Enter to submit Q&A. */
  recentSpeechRef: React.MutableRefObject<string>;
  /** Clear recent speech and the internal phrase buffer (call after submitting Q&A). */
  clearRecentSpeech: () => void;
  /** Register a function to clear the phrase buffer. Called by LiveTranscription. */
  registerClearBuffer: (fn: () => void) => void;
  /** Selected audio input device ID for listening to call (e.g. Phone/Bluetooth). null = default device. Persisted in localStorage. */
  audioInputDeviceId: string | null;
  setAudioInputDeviceId: (id: string | null) => void;
  /** Request AI suggestions from the current transcript (on-demand; called when user presses Enter or clicks Get suggestions). */
  requestSuggestions: () => void;
  /** Increments when requestSuggestions() is called; used by AISuggestionsFetcher to trigger a fetch. */
  suggestionsRequestedAt: number;
  /** Single-line follow-up (what to say next + questions). Set by FollowUpFetcher. */
  followUpText: string;
  setFollowUpText: (s: string | ((prev: string) => string)) => void;
  /** Increments when user requests follow-up (Enter). Used by FollowUpFetcher. */
  followUpRequestedAt: number;
  /** Request a fast follow-up from current transcript (Enter in dashboard). */
  requestFollowUp: () => void;
  /** Which suggestion type to request: what_to_say (default), questions, or key_points. */
  followUpFocus: "what_to_say" | "questions" | "key_points";
  setFollowUpFocus: (f: "what_to_say" | "questions" | "key_points") => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const AUDIO_INPUT_STORAGE_KEY = "persuaid_audio_input_id";

function getStoredAudioInputId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(AUDIO_INPUT_STORAGE_KEY);
    return id === "" ? null : id;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isRecording, setRecording] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [scriptContext, setScriptContext] = useState("");
  const [notesContext, setNotesContext] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioInputDeviceId, setAudioInputDeviceIdState] = useState<string | null>(null);
  const [suggestionsRequestedAt, setSuggestionsRequestedAt] = useState(0);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpRequestedAt, setFollowUpRequestedAt] = useState(0);
  const [followUpFocus, setFollowUpFocus] = useState<"what_to_say" | "questions" | "key_points">("what_to_say");
  const recentSpeechRef = useRef("");
  const clearBufferRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = getStoredAudioInputId();
    if (stored !== null) setAudioInputDeviceIdState(stored);
  }, []);

  const requestSuggestions = useCallback(() => {
    setSuggestionsRequestedAt((t) => t + 1);
  }, []);

  const requestFollowUp = useCallback(() => {
    setFollowUpRequestedAt((t) => t + 1);
  }, []);

  const setAudioInputDeviceId = useCallback((id: string | null) => {
    setAudioInputDeviceIdState(id);
    try {
      if (typeof window !== "undefined") {
        if (id === null) localStorage.removeItem(AUDIO_INPUT_STORAGE_KEY);
        else localStorage.setItem(AUDIO_INPUT_STORAGE_KEY, id);
      }
    } catch (_) {}
  }, []);

  const clearRecentSpeech = useCallback(() => {
    recentSpeechRef.current = "";
    clearBufferRef.current?.();
  }, []);

  const registerClearBuffer = useCallback((fn: () => void) => {
    clearBufferRef.current = fn;
  }, []);

  const appendTranscript = useCallback(
    (segment: {
      speaker?: TranscriptSpeaker;
      text: string;
      name?: string;
    }) => {
      const trimmed = segment.text?.trim();
      if (!trimmed) return;
      setTranscript((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].text === trimmed) return prev;
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            speaker: segment.speaker ?? "user",
            name: segment.name,
            text: trimmed,
            timestamp: new Date().toISOString(),
          },
        ];
      });
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
      selectedScriptId,
      setSelectedScriptId,
      scriptContext,
      setScriptContext,
      notesContext,
      setNotesContext,
      sessionId,
      setSessionId,
      recentSpeechRef,
      clearRecentSpeech,
      registerClearBuffer,
      audioInputDeviceId,
      setAudioInputDeviceId,
      requestSuggestions,
      suggestionsRequestedAt,
      followUpText,
      setFollowUpText,
      followUpRequestedAt,
      requestFollowUp,
      followUpFocus,
      setFollowUpFocus,
    }),
    [
      transcript,
      appendTranscript,
      clearTranscript,
      suggestions,
      isRecording,
      micError,
      selectedScriptId,
      scriptContext,
      notesContext,
      sessionId,
      clearRecentSpeech,
      registerClearBuffer,
      audioInputDeviceId,
      setAudioInputDeviceId,
      requestSuggestions,
      suggestionsRequestedAt,
      followUpText,
      followUpRequestedAt,
      requestFollowUp,
      followUpFocus,
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
