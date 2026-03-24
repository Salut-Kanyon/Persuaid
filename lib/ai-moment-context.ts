/**
 * Builds a short, authoritative clock/calendar block for live-assist system prompts
 * so the model can answer "what time is it", "what day is today", scheduling, etc.
 */

export function isValidIanaTimeZone(timeZone: string): boolean {
  const tz = timeZone.trim();
  if (!tz || tz.length > 120) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param timeZone - IANA zone from the client (e.g. `America/Los_Angeles`). Falls back to UTC.
 */
export function buildAiMomentContextForPrompt(timeZone: string | undefined): string {
  const tz = timeZone && isValidIanaTimeZone(timeZone) ? timeZone.trim() : "UTC";
  const now = new Date();
  const localFull = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);
  const calendarDate = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  const isoUtc = now.toISOString();

  return [
    "Real-time clock (authoritative for: what time it is, what day/date/today/tomorrow is, calendar scheduling, or 'how long until' a specific date):",
    `- Rep's local time (${tz}): ${localFull}`,
    `- Calendar date in that timezone: ${calendarDate}`,
    `- Same instant in UTC (ISO 8601): ${isoUtc}`,
    "When the rep or prospect asks about time or dates, use the lines above. Answer in the rep's local sense unless they explicitly ask for another timezone.",
  ].join("\n");
}
