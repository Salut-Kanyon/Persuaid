import type { NextRequest } from "next/server";

/**
 * Prefer the request URL (correct port in dev, correct host on Vercel) over
 * NEXT_PUBLIC_APP_URL alone, so invite links match where the app is actually open.
 */
export function getPublicOriginFromRequest(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")?.trim();
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (hostHeader) {
    const host = hostHeader.split(",")[0].trim();
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto =
      forwardedProto ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return envUrl || "http://localhost:3000";
}
