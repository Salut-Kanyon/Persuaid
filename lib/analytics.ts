/**
 * Analytics data types and aggregation helpers.
 * Sessions are the source of truth; AI metrics use optional DB columns when available.
 */

export interface SessionRecord {
  id: string;
  user_id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  outcome: string | null;
  script_id: string | null;
  created_at: string;
  transcript_preview?: string | null;
  suggestions_count?: number | null;
  follow_up_count?: number | null;
}

export interface ScriptOption {
  id: string;
  title: string;
}

export interface AnalyticsSummary {
  totalCalls: number;
  totalTalkTimeMinutes: number;
  aiSuggestionsUsed: number;
  followUpQuestionsGenerated: number;
}

export interface CallsOverTimeEntry {
  date: string;
  calls: number;
}

export interface CallInsights {
  averageCallLengthMinutes: number;
  talkVsListenRatio: string | null;
  objectionKeywords: string[];
  mostUsedScripts: { scriptTitle: string; count: number }[];
}

export interface AICoachingInsights {
  whatToSayCount: number;
  followUpQuestionsCount: number;
  averageResponseLength: number | null;
  topSuggestedPhrases: string[];
}

export interface RecentCallRow {
  id: string;
  date: string;
  durationMinutes: number;
  transcriptPreview: string | null;
  aiSuggestionsUsed: number;
}

export function aggregateSummary(
  sessions: SessionRecord[],
): AnalyticsSummary {
  const totalCalls = sessions.length;
  const totalTalkTimeMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);
  const aiSuggestionsUsed = sessions.reduce((acc, s) => acc + (s.suggestions_count ?? 0), 0);
  const followUpQuestionsGenerated = sessions.reduce((acc, s) => acc + (s.follow_up_count ?? 0), 0);
  return {
    totalCalls,
    totalTalkTimeMinutes,
    aiSuggestionsUsed,
    followUpQuestionsGenerated,
  };
}

export function getCallsOverTime(
  sessions: SessionRecord[],
  days: number,
): CallsOverTimeEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  const byDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  sessions.forEach((s) => {
    const day = new Date(s.started_at).toISOString().slice(0, 10);
    if (day in byDay) byDay[day]++;
  });
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, calls]) => ({ date, calls }));
}

export function getCallInsights(
  sessions: SessionRecord[],
  scripts: ScriptOption[],
): CallInsights {
  const total = sessions.length;
  const averageCallLengthMinutes =
    total === 0 ? 0 : sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) / total;
  const scriptCounts: Record<string, number> = {};
  scripts.forEach((sc) => (scriptCounts[sc.id] = 0));
  sessions.forEach((s) => {
    if (s.script_id && scriptCounts[s.script_id] !== undefined) scriptCounts[s.script_id]++;
  });
  const mostUsedScripts = scripts
    .filter((sc) => scriptCounts[sc.id] > 0)
    .map((sc) => ({ scriptTitle: sc.title, count: scriptCounts[sc.id] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    averageCallLengthMinutes,
    talkVsListenRatio: null,
    objectionKeywords: [],
    mostUsedScripts,
  };
}

export function getAICoachingInsights(sessions: SessionRecord[]): AICoachingInsights {
  const followUpQuestionsCount = sessions.reduce((acc, s) => acc + (s.follow_up_count ?? 0), 0);
  return {
    whatToSayCount: sessions.reduce((acc, s) => acc + (s.suggestions_count ?? 0), 0),
    followUpQuestionsCount,
    averageResponseLength: null,
    topSuggestedPhrases: [],
  };
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
