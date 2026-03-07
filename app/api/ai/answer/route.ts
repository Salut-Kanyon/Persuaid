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
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Missing or empty text" }, { status: 400 });
  }

  const systemPrompt = `You are a helpful sales coach. The user is on a call and just said something. Respond in one short, direct paragraph: answer or advise on what they said. Be concise and actionable.`;
  const userPrompt = `What was just said: "${text}"`;

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI answer error:", res.status, err);
      return NextResponse.json(
        { error: "AI answer failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ answer });
  } catch (e) {
    console.error("Answer API error:", e);
    return NextResponse.json(
      { error: "AI answer failed" },
      { status: 500 }
    );
  }
}
