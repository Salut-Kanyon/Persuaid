import { NextRequest, NextResponse } from "next/server";
import { buildAiMomentContextForPrompt } from "@/lib/ai-moment-context";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Best-effort daily limit per IP (in-memory; resets on cold start). For strict limits use Redis/KV. */
const dailyAiByIp = new Map<string, { date: string; count: number }>();
const DEMO_AI_PER_DAY = 2;

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function getDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function canConsumeDemoAi(ip: string): boolean {
  const day = getDay();
  const cur = dailyAiByIp.get(ip);
  if (!cur || cur.date !== day) {
    dailyAiByIp.set(ip, { date: day, count: 0 });
    return true;
  }
  return cur.count < DEMO_AI_PER_DAY;
}

function consumeDemoAi(ip: string): void {
  const day = getDay();
  const cur = dailyAiByIp.get(ip);
  if (!cur || cur.date !== day) {
    dailyAiByIp.set(ip, { date: day, count: 1 });
    return;
  }
  cur.count += 1;
}

interface TranscriptMessage {
  speaker?: string;
  text: string;
}

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "AI demo is not configured" }, { status: 503 });
  }

  const ip = getClientIp(req);
  if (!canConsumeDemoAi(ip)) {
    return NextResponse.json(
      { error: "Demo AI limit reached for today. Create an account or try again tomorrow.", code: "DEMO_LIMIT" },
      { status: 429 }
    );
  }

  let body: {
    transcript?: TranscriptMessage[];
    notesContext?: string;
    mode?: "answer" | "follow_up_question";
    timeZone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  const notesContext = String(body.notesContext ?? "").trim().slice(0, 4000);
  const mode = body.mode === "follow_up_question" ? "follow_up_question" : "answer";
  const momentBlock = buildAiMomentContextForPrompt(
    typeof body.timeZone === "string" ? body.timeZone : undefined
  );

  if (transcript.length > 40) {
    return NextResponse.json({ error: "Transcript too long for demo" }, { status: 400 });
  }

  const normalized = transcript.map((m) => ({
    role: m.speaker === "prospect" ? ("prospect" as const) : ("rep" as const),
    text: String(m.text ?? "").trim(),
  }));

  const conversation = normalized
    .filter((m) => m.text.length > 0)
    .map((m) => `${m.role === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");

  const hasProspect = normalized.some((m) => m.role === "prospect");
  const lastLine = [...normalized].reverse().find((m) => m.text.length > 0);

  if (!conversation.trim()) {
    return NextResponse.json(
      { error: "Add at least one line to the transcript (mic, or type a prospect line)." },
      { status: 400 }
    );
  }

  const demoQuirk = !hasProspect
    ? `\n\nDemo note: All lines may be labeled "Rep" because browser speech capture tags the mic as the salesperson. If there are several Rep lines, assume the LAST line is what just happened in the call to respond to—often a buyer question or objection the rep should answer (even if it looks like small talk or a factual question). Address that last turn first in one or two short speakable sentences, then steer toward value if it fits.`
    : "";

  const lastTurnHint = lastLine
    ? `\n\nPriority: Respond first to this latest turn — ${lastLine.role === "prospect" ? "Prospect" : "Rep"}: "${lastLine.text}"`
    : "";

  const system = `You are Persuaid's live sales copilot (demo). Output short, natural lines the salesperson can say out loud (no JSON besides the wrapper).

Rules:
- Always address the latest turn in the conversation first—especially direct questions. If asked a factual question, give a brief correct answer the rep can say, then optionally one sentence tying to discovery or next step (unless the ask is purely social).
- Use "Product knowledge" for product, pricing, objections, and numbers. Never invent specific numbers, prices, or policies not in the knowledge.
- Stay in the rep's voice (first person). No meta commentary about limits or APIs.

Reply with JSON only: {"text":"...","sourceType":"notes"|"conversation"|"web"}

${momentBlock}`;

  const user =
    mode === "follow_up_question"
      ? `Product knowledge (may be empty):\n${notesContext || "(none)"}\n\nConversation:\n${conversation}${demoQuirk}${lastTurnHint}\n\nReturn JSON: one strong follow-up question the rep should ask next.`
      : `Product knowledge (may be empty):\n${notesContext || "(none)"}\n\nConversation:\n${conversation}${demoQuirk}${lastTurnHint}\n\nReturn JSON: the exact sentence(s) the rep should say next—must reflect the latest turn above.`;

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
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 280,
        temperature: 0.45,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Demo follow-up OpenAI error:", res.status, err);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let text = "";
    let sourceType = "conversation";
    try {
      const parsed = JSON.parse(raw) as { text?: string; sourceType?: string };
      text = typeof parsed.text === "string" ? parsed.text.trim() : "";
      const st = (parsed.sourceType ?? "").toLowerCase();
      if (st === "notes" || st === "conversation" || st === "web") sourceType = st;
    } catch {
      text = raw.slice(0, 1200);
    }

    if (!text) {
      text = "Try adding a bit more context, then press again.";
    }

    consumeDemoAi(ip);
    return NextResponse.json({ text, sourceType });
  } catch (e) {
    console.error("Demo follow-up error:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
