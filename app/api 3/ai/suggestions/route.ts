import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface TranscriptMessage {
  speaker?: string;
  text: string;
}

interface Suggestion {
  id: string;
  type: "objection" | "next-step" | "talking-point" | "question";
  title: string;
  text: string;
  priority: "high" | "medium" | "low";
}

function buildMessages(transcript: TranscriptMessage[], scriptContext?: string): string {
  return transcript
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  let body: { transcript?: TranscriptMessage[]; scriptContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const transcript = body.transcript ?? [];
  const scriptContext = body.scriptContext ?? "";
  const conversation = buildMessages(transcript, scriptContext);
  if (!conversation.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  const systemPrompt = `You are a sales coach. Given a live call transcript, suggest 1–3 short, actionable tips for the rep. Return a JSON array of suggestions. Each suggestion must have: "type" (one of: objection, next-step, talking-point, question), "title" (short label), "text" (one or two sentences), "priority" (high, medium, or low). Focus on the most recent exchange. Be concise.`;
  const userPrompt = scriptContext
    ? `Script context (talking points):\n${scriptContext}\n\nTranscript:\n${conversation}\n\nReturn a JSON array of suggestion objects only, no other text.`
    : `Transcript:\n${conversation}\n\nReturn a JSON array of suggestion objects only, no other text.`;

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
        response_format: { type: "json_object" },
        max_tokens: 600,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", res.status, err);
      return NextResponse.json(
        { error: "AI suggestion failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ suggestions: [] });
    }
    let parsed: { suggestions?: Suggestion[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const arr = JSON.parse(arrayMatch[0]) as Suggestion[];
          parsed = { suggestions: arr };
        } catch {
          return NextResponse.json({ suggestions: [] });
        }
      } else {
        return NextResponse.json({ suggestions: [] });
      }
    }
    const suggestions = (parsed.suggestions ?? (Array.isArray(parsed) ? parsed : [])).slice(0, 5);
    const normalized = suggestions.map((s, i) => ({
      id: `s-${i}-${Date.now()}`,
      type: ["objection", "next-step", "talking-point", "question"].includes(s.type) ? s.type : "talking-point",
      title: String(s.title ?? "Suggestion").slice(0, 80),
      text: String(s.text ?? "").slice(0, 500),
      priority: ["high", "medium", "low"].includes(s.priority) ? s.priority : "medium",
    }));
    return NextResponse.json({ suggestions: normalized });
  } catch (e) {
    console.error("Suggestions API error:", e);
    return NextResponse.json(
      { error: "AI suggestion failed" },
      { status: 500 }
    );
  }
}
