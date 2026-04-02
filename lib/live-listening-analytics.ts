import type { SupabaseClient } from "@supabase/supabase-js";
import { computeUsedMinutesFromSttRows, type SttUsageRow } from "@/lib/me-usage";
import { currentMonthBoundsUtc } from "@/lib/usage";
import type { CallsOverTimeEntry } from "@/lib/analytics";

const CHART_MAX_DAYS = 90;

/** UTC calendar date key YYYY-MM-DD */
function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Rolling window of UTC days ending today (inclusive), length `days`. */
function utcDayKeysEndingToday(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    out.push(utcDateKey(d));
  }
  return out;
}

function countRowsInLastDays(rows: { started_at?: unknown }[], days: number): number {
  const now = Date.now();
  const cutoff = now - days * 86400000;
  return (rows ?? []).filter((r) => {
    const t = typeof r.started_at === "string" ? Date.parse(r.started_at) : NaN;
    return Number.isFinite(t) && t >= cutoff;
  }).length;
}

export type LiveListeningAnalyticsData = {
  monthEventCount: number;
  monthUsedMinutes: number;
  last7DaysEventCount: number;
  avgSessionLengthMinutes: number;
  /** One row per UTC day in the chart window, for `getCallsOverTime`-compatible charts. */
  chartByDay: CallsOverTimeEntry[];
};

/**
 * Live listening stats from `stt_usage_events` — same source as Usage / billing.
 * When the table is missing, returns `null` so callers can fall back to saved `sessions`.
 */
export async function fetchLiveListeningAnalytics(
  supabase: SupabaseClient,
  userId: string
): Promise<LiveListeningAnalyticsData | null> {
  const { startIso, endIso } = currentMonthBoundsUtc();

  const monthRes = await supabase
    .from("stt_usage_events")
    .select("started_at, ended_at, duration_seconds")
    .eq("user_id", userId)
    .gte("started_at", startIso)
    .lt("started_at", endIso);

  const qErr = monthRes.error;
  const tableMissing =
    !!qErr &&
    (qErr.code === "42P01" ||
      /stt_usage_events/i.test(qErr.message || "") ||
      /relation .* does not exist/i.test(qErr.message || ""));

  if (tableMissing) {
    return null;
  }
  if (qErr) {
    return null;
  }

  const monthRows = (monthRes.data ?? []) as SttUsageRow[];
  const monthEventCount = monthRows.length;
  const monthUsedMinutes = computeUsedMinutesFromSttRows(monthRows);
  const avgSessionLengthMinutes =
    monthEventCount > 0 ? Math.max(1, Math.round(monthUsedMinutes / monthEventCount)) : 0;

  const chartStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  chartStart.setUTCDate(chartStart.getUTCDate() - (CHART_MAX_DAYS - 1));
  const chartStartIso = chartStart.toISOString();

  const chartRes = await supabase
    .from("stt_usage_events")
    .select("started_at")
    .eq("user_id", userId)
    .gte("started_at", chartStartIso);

  if (chartRes.error) {
    return null;
  }

  const chartRows = chartRes.data ?? [];
  const last7DaysEventCount = countRowsInLastDays(chartRows as { started_at?: unknown }[], 7);

  const keys = utcDayKeysEndingToday(CHART_MAX_DAYS);
  const counts: Record<string, number> = {};
  keys.forEach((k) => {
    counts[k] = 0;
  });
  (chartRows as { started_at?: string }[]).forEach((r) => {
    const s = r.started_at;
    if (typeof s !== "string") return;
    const day = s.slice(0, 10);
    if (day in counts) counts[day] += 1;
  });

  const chartByDay: CallsOverTimeEntry[] = keys.map((date) => ({
    date,
    calls: counts[date] ?? 0,
  }));

  return {
    monthEventCount,
    monthUsedMinutes,
    last7DaysEventCount,
    avgSessionLengthMinutes,
    chartByDay,
  };
}

function sliceChart(chartByDay: CallsOverTimeEntry[], days: number): CallsOverTimeEntry[] {
  if (days >= chartByDay.length) return chartByDay;
  return chartByDay.slice(-days);
}

export function getCallsOverTimeFromLiveListening(
  chartByDay: CallsOverTimeEntry[],
  days: number
): CallsOverTimeEntry[] {
  return sliceChart(chartByDay, days);
}
