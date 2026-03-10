import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }
  let body: { transcript: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }

  const systemPrompt = `You are a sales coach. Given a full sales call transcript (Rep = salesperson, Prospect = buyer), return a JSON array of coaching insights. Each insight must have:
- "type": one of "strength" (what went well), "improve" (what to work on), "moment" (specific phrase or moment to remember/avoid), "next_step" (concrete follow-up or next-call action)
- "title": short label (3–6 words)
- "text": 1–3 sentences, direct and specific. Use second person ("You did X").

Return 4–8 insights. Include at least one strength, one improve, and one next_step. Output only valid JSON: an array of objects with type, title, text. No other text.`;

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcript:\n\n${transcript}` },
        ],
        max_tokens: 1000,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[analyze-call] OpenAI error:", res.status, err);
      return NextResponse.json(
        { error: "Analysis failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    let insights: Array<{ type: string; title: string; text: string }> = [];
    try {
      const parsed = JSON.parse(raw.replace(/^```\w*\n?|\n?```$/g, "").trim());
      insights = Array.isArray(parsed)
        ? parsed
            .filter((x: unknown) => x && typeof x === "object" && "type" in x && "title" in x && "text" in x)
            .map((x: { type?: string; title?: string; text?: string }) => ({
              type: ["strength", "improve", "moment", "next_step"].includes(String(x.type)) ? String(x.type) : "moment",
              title: String(x.title ?? "").slice(0, 80),
              text: String(x.text ?? "").slice(0, 500),
            }))
        : [];
    } catch {
      insights = [];
    }
    const analysis = insights.length > 0 ? JSON.stringify(insights) : raw;
    return NextResponse.json({ analysis, insights });
  } catch (e) {
    console.error("[analyze-call] Error:", e);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
