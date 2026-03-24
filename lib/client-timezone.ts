/** IANA timezone from the browser (e.g. `America/New_York`), for accurate "what time is it" in AI prompts. */
export function getClientIanaTimeZone(): string | undefined {
  if (typeof Intl === "undefined") return undefined;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === "string" && tz.length > 0 ? tz : undefined;
  } catch {
    return undefined;
  }
}
