import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchApi } from "@/lib/api-fetch";
import { resolveEffectivePlan } from "@/lib/agency";
import type { Plan } from "@/lib/entitlements";
import {
  currentMonthBoundsUtc,
  formatUsageMinutes,
  transcriptionLimitMinutes,
} from "@/lib/usage";

let sttUsageTableMissingCached = false;

/** Row shape from `stt_usage_events` (duration aggregation). */
export type SttUsageRow = {
  started_at?: unknown;
  ended_at?: unknown;
  duration_seconds?: unknown;
};

/**
 * Same minute math as monthly billing: sum seconds from rows, then ceil to whole minutes.
 * Exported so Analytics can align with the Usage card.
 */
export function computeUsedMinutesFromSttRows(rows: SttUsageRow[] | null | undefined): number {
  const nowMs = Date.now();
  const usedSeconds = (rows ?? []).reduce((acc, r) => {
    const stored = Number(r.duration_seconds) || 0;
    if (stored > 0) return acc + stored;
    const started = typeof r.started_at === "string" ? Date.parse(r.started_at) : NaN;
    if (!Number.isFinite(started)) return acc;
    const ended = typeof r.ended_at === "string" ? Date.parse(r.ended_at) : NaN;
    const endMs = Number.isFinite(ended) ? ended : nowMs;
    const sec = Math.max(0, Math.round((endMs - started) / 1000));
    return acc + sec;
  }, 0);
  return Math.max(0, Math.ceil(usedSeconds / 60));
}

export type MeUsagePayload = {
  plan: Plan;
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  periodLabel: string;
  usedLabel: string;
  remainingLabel: string;
  limitLabel: string;
};

/**
 * Monthly usage from `stt_usage_events` (Deepgram/STT time), not “saved calls”.
 * This matches the intent: limit live speech-to-text time regardless of whether the user saves a call.
 */
export async function computeMeUsage(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  /**
   * When set (e.g. client after /api/me/entitlements), skips `resolveEffectivePlan` so paywall bypass
   * from server env still matches usage limits — `getPlanForUser` has no bypass env in the browser bundle.
   */
  options?: { effectivePlan?: Plan }
): Promise<{ ok: true; data: MeUsagePayload } | { ok: false; error: string }> {
  const plan =
    options?.effectivePlan !== undefined
      ? options.effectivePlan
      : (await resolveEffectivePlan(supabase, userId, email ?? undefined)).plan;
  const limitMinutes = transcriptionLimitMinutes(plan);
  const { startIso, endIso } = currentMonthBoundsUtc();

  const sttQuery = sttUsageTableMissingCached
    ? ({ data: null, error: { code: "42P01", message: "stt_usage_events missing (cached)" } } as const)
    : await supabase
        .from("stt_usage_events")
        .select("started_at, ended_at, duration_seconds")
        .eq("user_id", userId)
        .gte("started_at", startIso)
        .lt("started_at", endIso);
  const rows = sttQuery.data;
  const qErr = sttQuery.error;

  const tableMissing =
    !!qErr &&
    (qErr.code === "42P01" ||
      /stt_usage_events/i.test(qErr.message || "") ||
      /relation .* does not exist/i.test(qErr.message || ""));

  let usedMinutes = 0;
  if (!qErr) {
    sttUsageTableMissingCached = false;
    usedMinutes = computeUsedMinutesFromSttRows(rows as SttUsageRow[]);
  } else if (tableMissing) {
    sttUsageTableMissingCached = true;
    // Backward-compatible fallback until migration 009 is applied.
    const { data: sessionRows, error: sessionErr } = await supabase
      .from("sessions")
      .select("duration_minutes")
      .eq("user_id", userId)
      .gte("started_at", startIso)
      .lt("started_at", endIso);

    if (sessionErr) {
      return { ok: false, error: sessionErr.message };
    }
    usedMinutes = (sessionRows ?? []).reduce((acc, r) => {
      const rr = r as { duration_minutes?: unknown };
      return acc + (Number(rr.duration_minutes) || 0);
    }, 0);
  } else {
    return { ok: false, error: qErr.message };
  }

  const remainingMinutes = Math.max(0, limitMinutes - usedMinutes);

  const monthLabel = new Date(startIso).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    ok: true,
    data: {
      plan,
      limitMinutes,
      usedMinutes,
      remainingMinutes,
      periodLabel: monthLabel,
      usedLabel: formatUsageMinutes(usedMinutes),
      remainingLabel: formatUsageMinutes(remainingMinutes),
      limitLabel: formatUsageMinutes(limitMinutes),
    },
  };
}

/**
 * Prefer GET /api/me/usage (server has paywall bypass env). Falls back to `computeMeUsage` with
 * `effectivePlan` when the API is unreachable (e.g. offline Electron).
 */
export async function loadMeUsageForClient(
  supabase: SupabaseClient,
  accessToken: string | undefined,
  userId: string,
  email: string | null | undefined,
  fallbackPlan?: Plan
): Promise<{ ok: true; data: MeUsagePayload } | { ok: false; error: string }> {
  if (accessToken) {
    try {
      const res = await fetchApi("/api/me/usage", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        return { ok: true, data: (await res.json()) as MeUsagePayload };
      }
    } catch {
      // fall through
    }
  }
  return computeMeUsage(supabase, userId, email, {
    effectivePlan: fallbackPlan,
  });
}
