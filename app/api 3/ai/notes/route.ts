import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface TranscriptMessage {
  speaker?: string;
  text: string;
}

interface NoteItem {
  content: string;
}

function buildTranscriptText(transcript: TranscriptMessage[]): string {
  return transcript
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }
  let body: { transcript?: TranscriptMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const transcript = body.transcript ?? [];
  const conversation = buildTranscriptText(transcript);
  if (!conversation.trim()) {
    return NextResponse.json({ summary: "", items: [] });
  }

  const systemPrompt = `You are a sales assistant. Given a call transcript, produce:
1. A short summary (1-3 sentences).
2. A JSON array of note items. Each item has "content" (one short sentence or phrase). Output 3-8 note items.`;
  const userPrompt = `Transcript:\n${conversation}\n\nReturn a single JSON object with keys "summary" (string) and "items" (array of { "content": string }). No other text.`;

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI notes error:", res.status, err);
      return NextResponse.json(
        { error: "AI notes failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ summary: "", items: [] });
    }
    let parsed: { summary?: string; items?: NoteItem[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ summary: "", items: [] });
    }
    const summary = String(parsed.summary ?? "").slice(0, 2000);
    const items = (parsed.items ?? []).slice(0, 15).map((item) => ({
      content: String(item.content ?? "").slice(0, 500),
    }));

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (url && anonKey && items.length > 0 && token) {
      const supabase = createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) {
        const rows = items.map((item) => ({
          user_id: user.id,
          title: null,
          content: item.content,
          completed: false,
        }));
        await supabase.from("notes").insert(rows);
      }
    }

    return NextResponse.json({ summary, items });
  } catch (e) {
    console.error("Notes API error:", e);
    return NextResponse.json(
      { error: "AI notes failed" },
      { status: 500 }
    );
  }
}
