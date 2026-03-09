import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface TranscriptMessage {
  speaker?: string;
  text: string;
}

function buildConversation(transcript: TranscriptMessage[]): string {
  return transcript
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

/** Last N messages as a short block so the model can't miss what was just said. */
function getLastExchange(transcript: TranscriptMessage[], n = 6): string {
  const last = transcript.slice(-n);
  return last
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

/** Uses transcript, script, and notes to return structured follow-up suggestions with depth. */
export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  type Focus = "what_to_say" | "questions" | "key_points";
  let body: {
    transcript?: TranscriptMessage[];
    scriptContext?: string;
    notesContext?: string;
    focus?: Focus;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const transcript = body.transcript ?? [];
  const scriptContext = body.scriptContext ?? "";
  const notesContext = (body.notesContext ?? "").trim();
  const focus = body.focus ?? "what_to_say";
  const conversation = buildConversation(transcript);
  if (!conversation.trim()) {
    return NextResponse.json({ text: "Say something so I can suggest what to say next." });
  }

  const lastExchange = getLastExchange(transcript);
  const lastProspectMessage = transcript
    .filter((m) => m.speaker === "prospect")
    .slice(-1)[0]?.text?.trim() ?? "";

  const focusOnly = focus !== "what_to_say";
  const systemPrompt = focusOnly
    ? (focus === "questions"
      ? `You are a professional sales coach. Given the live conversation and the rep's notes, suggest ONLY questions to ask next. Reply with the section header "## Questions to ask" then 2–3 strong questions. Be specific; reference the prospect's words. No other sections.`
      : `You are a professional sales coach. Given the live conversation and the rep's notes, suggest ONLY key points to hit. Reply with the section header "## Key points to hit" then 2–4 bullet points from their notes/script that fit this moment (benefits, differentiators, proof). No other sections.`)
    : `You are a professional sales coach for a live call. Your job is to suggest what the rep should say RIGHT NOW in response to what just happened.

CRITICAL: Read the conversation and identify the LAST thing the prospect said (their question, objection, or statement). The "What to say" section MUST directly answer that question or address that point. Do not give generic advice or repeat something the rep already said. Each suggestion must be specific to this moment—if they asked about price, address price; if they raised a concern, address that concern. Think step by step: what did the prospect just say? What would a strong rep say in direct response?

Reply using exactly these section headers (copy as-is). Be specific and actionable.

## What to say
(1–2 sentences the rep can say next that directly answer or respond to the prospect's last question or statement. Natural, direct, no filler.)

## Questions to ask
(2–3 follow-up questions that make sense right after that response.)

## Key points to hit
(Bullet points from notes/script that fit this moment—benefits, proof, differentiators.)

## If they push back
(One short line for a likely objection or hesitation based on what they just said.)`;

  const parts: string[] = [
    `Full conversation so far:\n${conversation.slice(-1200)}`,
  ];
  if (lastProspectMessage) {
    parts.push(`LAST THING THE PROSPECT SAID (you must respond to this):\n"${lastProspectMessage}"`);
  }
  parts.push(`Most recent exchange:\n${lastExchange}`);
  if (scriptContext) {
    parts.push(`Script / talking points:\n${scriptContext.slice(0, 400)}`);
  }
  if (notesContext) {
    parts.push(`Rep's notes (product knowledge, objections, etc.):\n${notesContext.slice(0, 800)}`);
  }
  const userPrompt = parts.join("\n\n");
  const maxTokens = focusOnly ? 180 : 480;

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
        max_tokens: maxTokens,
        temperature: focusOnly ? 0.4 : 0.55,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI follow-up error:", res.status, err);
      return NextResponse.json(
        { error: "AI follow-up failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text: text || "Press Enter again after more conversation." });
  } catch (e) {
    console.error("Follow-up API error:", e);
    return NextResponse.json(
      { error: "AI follow-up failed" },
      { status: 500 }
    );
  }
}
