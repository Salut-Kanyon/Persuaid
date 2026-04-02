"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SessionRecord, ScriptOption, AnalyticsSummary } from "@/lib/analytics";
import {
  aggregateSummary,
  getCallsOverTime,
  getCallInsights,
  getAICoachingInsights,
  formatDuration,
} from "@/lib/analytics";
import {
  fetchLiveListeningAnalytics,
  getCallsOverTimeFromLiveListening,
  type LiveListeningAnalyticsData,
} from "@/lib/live-listening-analytics";

export interface UseAnalyticsResult {
  loading: boolean;
  sessions: SessionRecord[];
  scripts: ScriptOption[];
  /** Merges live STT month stats when available; otherwise saved sessions only. */
  summary: AnalyticsSummary;
  callsOverTime: (days: number) => ReturnType<typeof getCallsOverTime>;
  callInsights: ReturnType<typeof getCallInsights>;
  aiInsights: ReturnType<typeof getAICoachingInsights>;
  refetch: () => Promise<void>;
  formatDuration: typeof formatDuration;
  /** True when top metrics & chart use `stt_usage_events` (same source as Usage). */
  usesLiveListeningAnalytics: boolean;
  liveListening: LiveListeningAnalyticsData | null;
}

export function useAnalytics(): UseAnalyticsResult {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
  const [liveListening, setLiveListening] = useState<LiveListeningAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [sessRes, scriptsRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .order("started_at", { ascending: false }),
      supabase.from("scripts").select("id, title").order("title"),
    ]);
    if (!sessRes.error) setSessions((sessRes.data as SessionRecord[]) ?? []);
    if (!scriptsRes.error) setScripts((scriptsRes.data as ScriptOption[]) ?? []);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const live = await fetchLiveListeningAnalytics(supabase, user.id);
      setLiveListening(live);
    } else {
      setLiveListening(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchData();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const summary = useMemo((): AnalyticsSummary => {
    const base = aggregateSummary(sessions);
    if (!liveListening) return base;
    return {
      totalCalls: liveListening.monthEventCount,
      totalTalkTimeMinutes: liveListening.monthUsedMinutes,
      aiSuggestionsUsed: base.aiSuggestionsUsed,
      followUpQuestionsGenerated: base.followUpQuestionsGenerated,
    };
  }, [sessions, liveListening]);

  const callsOverTime = useCallback(
    (days: number) =>
      liveListening
        ? getCallsOverTimeFromLiveListening(liveListening.chartByDay, days)
        : getCallsOverTime(sessions, days),
    [sessions, liveListening]
  );

  const callInsights = getCallInsights(sessions, scripts);
  const aiInsights = getAICoachingInsights(sessions);

  return {
    loading,
    sessions,
    scripts,
    summary,
    callsOverTime,
    callInsights,
    aiInsights,
    refetch: fetchData,
    formatDuration,
    usesLiveListeningAnalytics: liveListening != null,
    liveListening,
  };
}
