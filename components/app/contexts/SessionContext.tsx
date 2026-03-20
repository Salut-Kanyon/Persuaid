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

/** Structured deal info extracted from the live transcript (company, pain, timeline, etc.). */
export interface DealContext {
  company?: string;
  industry?: string;
  current_solution?: string;
  pain_point?: string;
  budget?: string;
  timeline?: string;
  decision_maker?: string;
  competitors?: string;
  team_size?: string;
  use_case?: string;
}

interface SessionContextValue {
  transcript: TranscriptMessage[];
  appendTranscript: (segment: {
    speaker?: TranscriptSpeaker;
    text: string;
    name?: string;
  }) => void;
  /** Append text to the last transcript entry if same speaker (for continuation fragments). */
  appendToLastTranscript: (segment: { speaker?: TranscriptSpeaker; text: string }) => void;
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
  /** Deal context extracted from transcript (company, pain, timeline, etc.); used for smarter AI responses. */
  dealContext: DealContext;
  setDealContext: (update: DealContext | ((prev: DealContext) => DealContext)) => void;
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
  /** Increments when user requests a copilot answer (Enter / empty Send). FollowUpFetcher listens. */
  answerRequestedAt: number;
  /** Increments when user requests a suggested follow-up question. Separate from answer to avoid races. */
  followUpQuestionRequestedAt: number;
  /** Request follow-up: "answer" = what to say (Enter), "follow_up_question" = question to ask (button). */
  requestFollowUp: (mode?: "answer" | "follow_up_question") => void;
  /** Direct answer from answer-mode AI or /api/ai/answer (chat). Never mixed with follow-up question output. */
  answerText: string;
  setAnswerText: (s: string | ((prev: string) => string)) => void;
  answerSource: string;
  setAnswerSource: (s: string) => void;
  /** Suggested follow-up question only; written only by follow_up_question fetches. */
  suggestedFollowUpText: string;
  setSuggestedFollowUpText: (s: string | ((prev: string) => string)) => void;
  suggestedFollowUpSource: string;
  setSuggestedFollowUpSource: (s: string) => void;
  /** Name shown in header as "Call with [name]". Empty when not in call; set when recording (e.g. Prospect). */
  callParticipantName: string;
  setCallParticipantName: (s: string) => void;
  /** Interim (in-progress) transcript from Deepgram; shown in live transcript panel for debugging. */
  interimTranscript: string;
  setInterimTranscript: (s: string) => void;
  /** Interim speaker label (0/1/etc) when diarization is available; null when unknown or single-speaker. */
  interimSpeakerId: number | null;
  setInterimSpeakerId: (n: number | null) => void;
  /**
   * Refs that always contain the latest interim transcript/speaker id.
   * Used for AI requests so pressing Enter uses the newest spoken text
   * even if Deepgram hasn't finalized the segment yet.
   */
  latestInterimTranscriptRef: React.MutableRefObject<string>;
  latestInterimSpeakerIdRef: React.MutableRefObject<number | null>;
  /** Observed diarization speaker IDs from STT stream (e.g. [0,1]). */
  diarizationSpeakerIds: number[];
  setDiarizationSpeakerIds: (ids: number[] | ((prev: number[]) => number[])) => void;
  /** Which diarized speaker is "me" (Rep). Null = unknown; default mapping used. */
  diarizationMeSpeakerId: number | null;
  setDiarizationMeSpeakerId: (id: number | null) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const AUDIO_INPUT_STORAGE_KEY = "persuaid_audio_input_id";
const AUDIO_INPUT_MIGRATION_KEY = "persuaid_audio_input_migrated_v1";
const DIARIZATION_ME_STORAGE_KEY = "persuaid_diarization_me_speaker_id";

function getStoredAudioInputId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (!localStorage.getItem(AUDIO_INPUT_MIGRATION_KEY)) {
      localStorage.removeItem(AUDIO_INPUT_STORAGE_KEY);
      localStorage.setItem(AUDIO_INPUT_MIGRATION_KEY, "1");
      return null;
    }
    const id = localStorage.getItem(AUDIO_INPUT_STORAGE_KEY);
    return id === "" ? null : id;
  } catch {
    return null;
  }
}

function getStoredDiarizationMeSpeakerId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(DIARIZATION_ME_STORAGE_KEY);
    if (s === null || s === "") return null;
    const n = Number(s);
    return Number.isInteger(n) && n >= 0 ? n : null;
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
  const [dealContext, setDealContext] = useState<DealContext>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioInputDeviceId, setAudioInputDeviceIdState] = useState<string | null>(null);
  const [suggestionsRequestedAt, setSuggestionsRequestedAt] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [answerSource, setAnswerSource] = useState("");
  const [suggestedFollowUpText, setSuggestedFollowUpText] = useState("");
  const [suggestedFollowUpSource, setSuggestedFollowUpSource] = useState("");
  const [answerRequestedAt, setAnswerRequestedAt] = useState(0);
  const [followUpQuestionRequestedAt, setFollowUpQuestionRequestedAt] = useState(0);
  const [callParticipantName, setCallParticipantName] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [interimSpeakerId, setInterimSpeakerId] = useState<number | null>(null);
  const latestInterimTranscriptRef = useRef<string>("");
  const latestInterimSpeakerIdRef = useRef<number | null>(null);
  const [diarizationSpeakerIds, setDiarizationSpeakerIds] = useState<number[]>([]);
  const [diarizationMeSpeakerId, setDiarizationMeSpeakerIdState] = useState<number | null>(null);
  const recentSpeechRef = useRef("");
  const clearBufferRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = getStoredAudioInputId();
    if (stored !== null) setAudioInputDeviceIdState(stored);
  }, []);

  useEffect(() => {
    const stored = getStoredDiarizationMeSpeakerId();
    if (stored !== null) setDiarizationMeSpeakerIdState(stored);
  }, []);

  useEffect(() => {
    if (!isRecording) setCallParticipantName("");
  }, [isRecording]);
  useEffect(() => {
    if (!isRecording) {
      setInterimTranscript("");
      setInterimSpeakerId(null);
      latestInterimTranscriptRef.current = "";
      latestInterimSpeakerIdRef.current = null;
      setDiarizationSpeakerIds([]);
      setDealContext({});
      setAnswerText("");
      setAnswerSource("");
      setSuggestedFollowUpText("");
      setSuggestedFollowUpSource("");
    }
  }, [isRecording]);

  const setDiarizationMeSpeakerId = useCallback((id: number | null) => {
    setDiarizationMeSpeakerIdState(id);
    try {
      if (typeof window !== "undefined") {
        if (id === null) localStorage.removeItem(DIARIZATION_ME_STORAGE_KEY);
        else localStorage.setItem(DIARIZATION_ME_STORAGE_KEY, String(id));
      }
    } catch (_) {}
  }, []);

  const requestSuggestions = useCallback(() => {
    setSuggestionsRequestedAt((t) => t + 1);
  }, []);

  const requestFollowUp = useCallback((mode: "answer" | "follow_up_question" = "answer") => {
    if (mode === "follow_up_question") {
      setFollowUpQuestionRequestedAt((t) => t + 1);
    } else {
      setAnswerRequestedAt((t) => t + 1);
    }
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

  const capitalizeFirst = (s: string) => {
    const t = s.trim();
    if (!t) return t;
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const normalizeForOverlap = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[“”]/g, "\"")
      .toLowerCase();

  const splitWords = (s: string) => normalizeForOverlap(s).split(" ").filter(Boolean);

  const isRecent = (iso: string | undefined, ms: number) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t <= ms;
  };

  // Only drop exact duplicate if it's a very recent STT echo (~700ms). Otherwise user may have said it twice on purpose.
  const ECHO_DEDUPE_MS = 700;
  // Only treat overlap as "revision" (replace) within 1s and when new text is strictly longer. Prevents replacing when user repeats.
  const REVISION_WINDOW_MS = 1000;

  const hasStrongOverlap = (a: string, b: string) => {
    const aw = splitWords(a);
    const bw = splitWords(b);
    if (aw.length < 6 || bw.length < 6) return false;
    const n = Math.min(8, aw.length, bw.length);
    const aTail = aw.slice(-n).join(" ");
    const bTail = bw.slice(-n).join(" ");
    if (aTail === bTail) return true;
    const aHead = aw.slice(0, n).join(" ");
    const bHead = bw.slice(0, n).join(" ");
    return aTail === bHead || bTail === aHead;
  };

  const appendTranscript = useCallback(
    (segment: {
      speaker?: TranscriptSpeaker;
      text: string;
      name?: string;
    }) => {
      const trimmed = segment.text?.trim();
      if (!trimmed) return;
      const normalized = capitalizeFirst(trimmed);
      setTranscript((prev) => {
        const speaker = segment.speaker ?? "user";
        const last = prev[prev.length - 1];
        if (last) {
          // Exact duplicate: only drop if very recent (STT echo). If user said the same thing again after a pause, keep both.
          if (last.text === normalized && last.speaker === speaker) {
            if (isRecent(last.timestamp, ECHO_DEDUPE_MS)) return prev;
            // Same phrase repeated on purpose — append as new segment.
          } else if (last.speaker === speaker) {
            const lastNorm = normalizeForOverlap(last.text);
            const nextNorm = normalizeForOverlap(normalized);
            // Only replace when new text is clearly a longer revision of the same utterance (short window).
            if (isRecent(last.timestamp, REVISION_WINDOW_MS) && nextNorm.length > lastNorm.length) {
              if (nextNorm.includes(lastNorm) || hasStrongOverlap(last.text, normalized)) {
                return [...prev.slice(0, -1), { ...last, text: normalized }];
              }
            }
            // Same length or shorter, or outside window: don't replace (avoids overwriting when user repeats).
          }
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            speaker,
            name: segment.name,
            text: normalized,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    },
    []
  );

  const appendToLastTranscript = useCallback(
    (segment: { speaker?: TranscriptSpeaker; text: string }) => {
      const trimmed = segment.text?.trim();
      if (!trimmed) return;
      const speaker = segment.speaker ?? "user";
      setTranscript((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: crypto.randomUUID(),
              speaker,
              text: capitalizeFirst(trimmed),
              timestamp: new Date().toISOString(),
            },
          ];
        }
        const last = prev[prev.length - 1];
        if (last.speaker !== speaker) {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              speaker,
              text: capitalizeFirst(trimmed),
              timestamp: new Date().toISOString(),
            },
          ];
        }
        const lastEnd = last.text.trimEnd().slice(-1);
        if (lastEnd === "." || lastEnd === "?" || lastEnd === "!") {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              speaker,
              text: capitalizeFirst(trimmed),
              timestamp: new Date().toISOString(),
            },
          ];
        }
        // Replace only when clearly a longer revision of same utterance (short window). Otherwise merge so we don't overwrite repeats.
        const lastText = last.text.trimEnd();
        const nextText = trimmed.trim();
        const lastNorm = normalizeForOverlap(lastText);
        const nextNorm = normalizeForOverlap(nextText);
        if (isRecent(last.timestamp, REVISION_WINDOW_MS) && nextText.length > lastText.length && (nextNorm.includes(lastNorm) || hasStrongOverlap(lastText, nextText))) {
          return [...prev.slice(0, -1), { ...last, text: capitalizeFirst(nextText) }];
        }
        const merged = lastText + " " + nextText;
        return [
          ...prev.slice(0, -1),
          { ...last, text: merged },
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
      appendToLastTranscript,
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
      dealContext,
      setDealContext,
      sessionId,
      setSessionId,
      recentSpeechRef,
      clearRecentSpeech,
      registerClearBuffer,
      audioInputDeviceId,
      setAudioInputDeviceId,
      requestSuggestions,
      suggestionsRequestedAt,
      answerRequestedAt,
      followUpQuestionRequestedAt,
      requestFollowUp,
      answerText,
      setAnswerText,
      answerSource,
      setAnswerSource,
      suggestedFollowUpText,
      setSuggestedFollowUpText,
      suggestedFollowUpSource,
      setSuggestedFollowUpSource,
      callParticipantName,
      setCallParticipantName,
      interimTranscript,
      setInterimTranscript,
      interimSpeakerId,
      setInterimSpeakerId,
      latestInterimTranscriptRef,
      latestInterimSpeakerIdRef,
      diarizationSpeakerIds,
      setDiarizationSpeakerIds,
      diarizationMeSpeakerId,
      setDiarizationMeSpeakerId,
    }),
    [
      transcript,
      interimTranscript,
      callParticipantName,
      appendTranscript,
      appendToLastTranscript,
      clearTranscript,
      suggestions,
      isRecording,
      micError,
      selectedScriptId,
      scriptContext,
      notesContext,
      dealContext,
      sessionId,
      clearRecentSpeech,
      registerClearBuffer,
      audioInputDeviceId,
      setAudioInputDeviceId,
      requestSuggestions,
      suggestionsRequestedAt,
      answerText,
      answerSource,
      suggestedFollowUpText,
      suggestedFollowUpSource,
      answerRequestedAt,
      followUpQuestionRequestedAt,
      requestFollowUp,
      interimSpeakerId,
      diarizationSpeakerIds,
      diarizationMeSpeakerId,
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
