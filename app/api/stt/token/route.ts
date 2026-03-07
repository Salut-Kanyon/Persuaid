import { NextResponse } from "next/server";

const DEEPGRAM_GRANT_URL = "https://api.deepgram.com/v1/auth/grant";

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not configured" },
      { status: 503 }
    );
  }
  try {
    const res = await fetch(DEEPGRAM_GRANT_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Deepgram grant error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to get STT token" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      return NextResponse.json(
        { error: "No access token in response" },
        { status: 502 }
      );
    }
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in ?? 30,
    });
  } catch (e) {
    console.error("STT token error:", e);
    return NextResponse.json(
      { error: "Failed to get STT token" },
      { status: 500 }
    );
  }
}
