import type { Plan } from "@/lib/entitlements";

/** Monthly live-listening allowance for the Free plan (minutes). Keep /pricing copy in sync. */
export const FREE_PLAN_MONTHLY_MINUTES = 5;

/**
 * Desktop (Electron) free tier: max duration per live session in seconds.
 * Matches monthly allowance so one session can use the full free quota; enforced with a countdown.
 */
export const FREE_PLAN_ELECTRON_CALL_MAX_SECONDS = FREE_PLAN_MONTHLY_MINUTES * 60;

/** Monthly transcription-style limits (minutes), aligned with /pricing copy. */
export function transcriptionLimitMinutes(plan: Plan): number {
  switch (plan) {
    case "free":
      return FREE_PLAN_MONTHLY_MINUTES;
    case "pro":
      return 20 * 60;
    case "team":
      return 50 * 60;
    default:
      return FREE_PLAN_MONTHLY_MINUTES;
  }
}

/** Calendar month in UTC (matches simple “per month” billing language). */
export function currentMonthBoundsUtc(now = new Date()): { startIso: string; endIso: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function formatUsageMinutes(totalMinutes: number): string {
  const n = Math.max(0, Math.round(totalMinutes));
  if (n === 0) return "0 min";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 hr" : `${h} hr`;
  return `${h} hr ${m} min`;
}
