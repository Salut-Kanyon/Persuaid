"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SessionRecord, ScriptOption } from "@/lib/analytics";
import {
  aggregateSummary,
  getCallsOverTime,
  getCallInsights,
  getAICoachingInsights,
  formatDuration,
} from "@/lib/analytics";

export interface UseAnalyticsResult {
  loading: boolean;
  sessions: SessionRecord[];
  scripts: ScriptOption[];
  summary: ReturnType<typeof aggregateSummary>;
  callsOverTime: (days: number) => ReturnType<typeof getCallsOverTime>;
  callInsights: ReturnType<typeof getCallInsights>;
  aiInsights: ReturnType<typeof getAICoachingInsights>;
  refetch: () => Promise<void>;
  formatDuration: typeof formatDuration;
}

export function useAnalytics(): UseAnalyticsResult {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
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

  const summary = aggregateSummary(sessions);
  const callsOverTime = useCallback(
    (days: number) => getCallsOverTime(sessions, days),
    [sessions]
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
  };
}
