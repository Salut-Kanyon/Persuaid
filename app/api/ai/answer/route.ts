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

  const systemPrompt = `You are Persuaid, a real-time sales copilot helping a rep during a live sales call.

Your job is to give the rep the exact next words to say out loud in the moment, not generic coaching or analysis.

The rep has typed in a specific question, objection, or snippet from the call. Respond as if you are putting words in their mouth. They may ask about anything—use your own knowledge and reasoning to give a confident, helpful spoken answer. Do not refuse or say you need more information; think like a smart salesperson and answer based on what you know.

Always:
- Speak in natural, confident, spoken sales language (what the rep would actually say next).
- Prefer plainspoken, natural sales language. Avoid "I'd love to understand", "let's explore", "help guide you", "uncover your needs", "based on your situation". Prefer "that's a fair question", "the main thing is", "usually what people do is", "in most cases", "what that really means is". Use confident phrasing: prefer "usually what people do is", "most people in your situation", "typically what happens is"; avoid "it might help to", "you could consider", "perhaps".
- When appropriate, start with a short humanizing phrase then the answer: "That's a great question.", "That's actually pretty common.", "A lot of people ask that.", "That's a fair concern." Follow immediately with the answer.
- The first sentence must directly answer or address what they typed; do not begin with generic filler unless it is very brief and followed immediately by the answer.
- When appropriate, end with a small forward-moving question (Momentum). If they raised an objection, use Acknowledge → Reframe → Continue.
- Stay concise: 1–3 short sentences when momentum is used, otherwise 1–2.
- Do NOT output bullet points, headings, markdown, or multiple options.
- Do NOT explain your reasoning, coach the rep, or talk about "what you typed" or "this question".`;
  const userPrompt = `The rep typed this because they need the next line to say out loud:\n"${text}"\n\nWhat is the exact short line or two they should say next? Reply with only that spoken answer.`;

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
