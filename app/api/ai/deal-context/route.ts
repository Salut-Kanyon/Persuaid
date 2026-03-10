import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface TranscriptMessage {
  speaker?: string;
  text: string;
}

/** Structured deal info extracted from transcript. API returns only non-empty fields. */
export interface DealContext {
  company?: string;
  industry?: string;
  current_solution?: string;
  pain_point?: string;
  budget?: string;
  timeline?: string;
  decision_maker?: string;
  competitors?: string;
  team_size?: string;
  use_case?: string;
}

const DEAL_CONTEXT_KEYS: (keyof DealContext)[] = [
  "company",
  "industry",
  "current_solution",
  "pain_point",
  "budget",
  "timeline",
  "decision_maker",
  "competitors",
  "team_size",
  "use_case",
];

function buildConversation(transcript: TranscriptMessage[]): string {
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
  let body: { transcript?: TranscriptMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const transcript = body.transcript ?? [];
  const conversation = buildConversation(transcript);
  if (!conversation.trim()) {
    return NextResponse.json({ dealContext: {} });
  }

  const systemPrompt = `You are a sales call analyst. From the transcript, extract only explicitly stated or clearly implied facts about the prospect and the deal.

Return a JSON object with exactly these keys (use short phrases or single values; omit a key or use empty string if not mentioned):
- company: prospect's company or organization name
- industry: industry or vertical
- current_solution: tools, CRM, or process they use today
- pain_point: main problem or need they mentioned
- budget: budget signals (e.g. "flexible", "tight", "approved")
- timeline: when they plan to buy or implement
- decision_maker: who decides or who they report to
- competitors: competitors or alternatives mentioned
- team_size: company or team size if mentioned
- use_case: primary use case or goal

Return only the JSON object, no commentary.`;

  const userPrompt = `Transcript:\n${conversation.slice(-4000)}\n\nExtract deal context. Return only a JSON object with the keys listed.`;

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
        max_tokens: 400,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI deal-context error:", res.status, err);
      return NextResponse.json(
        { error: "Deal context extraction failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ dealContext: {} });
    }
    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(raw) as Record<string, string>;
    } catch {
      return NextResponse.json({ dealContext: {} });
    }
    const dealContext: DealContext = {};
    for (const k of DEAL_CONTEXT_KEYS) {
      const v = parsed[k];
      if (typeof v === "string" && v.trim()) {
        dealContext[k] = v.trim().slice(0, 300);
      }
    }
    return NextResponse.json({ dealContext });
  } catch (e) {
    console.error("Deal context API error:", e);
    return NextResponse.json(
      { error: "Deal context extraction failed" },
      { status: 500 }
    );
  }
}
