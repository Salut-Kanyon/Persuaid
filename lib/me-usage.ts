import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveEffectivePlan } from "@/lib/agency";
import type { Plan } from "@/lib/entitlements";
import {
  currentMonthBoundsUtc,
  formatUsageMinutes,
  transcriptionLimitMinutes,
} from "@/lib/usage";

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
  email: string | null | undefined
): Promise<{ ok: true; data: MeUsagePayload } | { ok: false; error: string }> {
  const { plan } = await resolveEffectivePlan(supabase, userId, email ?? undefined);
  const limitMinutes = transcriptionLimitMinutes(plan);
  const { startIso, endIso } = currentMonthBoundsUtc();

  const { data: rows, error: qErr } = await supabase
    .from("stt_usage_events")
    .select("started_at, ended_at, duration_seconds")
    .eq("user_id", userId)
    .gte("started_at", startIso)
    .lt("started_at", endIso);

  if (qErr) {
    return { ok: false, error: qErr.message };
  }

  const nowMs = Date.now();
  const usedSeconds = (rows ?? []).reduce((acc, r) => {
    const rr = r as { started_at?: unknown; ended_at?: unknown; duration_seconds?: unknown };
    const stored = Number(rr.duration_seconds) || 0;
    if (stored > 0) return acc + stored;
    const started = typeof rr.started_at === "string" ? Date.parse(rr.started_at) : NaN;
    if (!Number.isFinite(started)) return acc;
    const ended = typeof rr.ended_at === "string" ? Date.parse(rr.ended_at) : NaN;
    const endMs = Number.isFinite(ended) ? ended : nowMs;
    const sec = Math.max(0, Math.round((endMs - started) / 1000));
    return acc + sec;
  }, 0);

  // Bill/limit in minutes; count partial minutes as a full minute.
  const usedMinutes = Math.max(0, Math.ceil(usedSeconds / 60));
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
