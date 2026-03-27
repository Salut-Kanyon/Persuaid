import { NextResponse } from "next/server";

const DEEPGRAM_GRANT_URL = "https://api.deepgram.com/v1/auth/grant";

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY?.trim();
  if (!key) {
    console.warn("STT token: DEEPGRAM_API_KEY is missing. Add it to .env.local and restart the dev server (npm run dev).");
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not configured. Add it to .env.local and restart the dev server." },
      { status: 503 }
    );
  }
  try {
    const res = await fetch(DEEPGRAM_GRANT_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 3600 }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Deepgram grant error:", res.status, text);
      const is403 = res.status === 403;
      const error = is403
        ? "Deepgram API key has insufficient permissions. In the Deepgram Console, use an API key with Member or Owner role (not a restricted key)."
        : "Failed to get STT token";
      return NextResponse.json(
        { error },
        { status: is403 ? 403 : 502 }
      );
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      return NextResponse.json(
        { error: "No access token in response" },
        { status: 502 }
      );
    }
    // Response shape for Deepgram WebSocket auth: frontend uses Sec-WebSocket-Protocol: bearer, <jwt>
    const payload = {
      access_token: data.access_token,
      expires_in: data.expires_in ?? 3600,
    };
    if (process.env.NODE_ENV === "development") {
      console.log("[STT token] Granted: token length", payload.access_token.length, "expires_in", payload.expires_in);
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("STT token error:", e);
    return NextResponse.json(
      { error: "Failed to get STT token" },
      { status: 500 }
    );
  }
}
