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

/** Last N messages so the model sees what was just said. */
function getLastExchange(transcript: TranscriptMessage[], n = 6): string {
  const last = transcript.slice(-n);
  return last
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

type FollowUpMode = "answer" | "follow_up_question";

/** mode=answer → exact sentence to answer the customer. mode=follow_up_question → one question for the rep to ask. */
export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  let body: {
    transcript?: TranscriptMessage[];
    scriptContext?: string;
    notesContext?: string;
    mode?: FollowUpMode;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const transcript = body.transcript ?? [];
  const scriptContext = body.scriptContext ?? "";
  const notesContext = (body.notesContext ?? "").trim();
  const mode: FollowUpMode = body.mode === "follow_up_question" ? "follow_up_question" : "answer";
  const conversation = buildConversation(transcript);
  if (!conversation.trim()) {
    return NextResponse.json({ text: "Say something so I can suggest what to say next." });
  }

  const lastExchange = getLastExchange(transcript);
  const lastProspectMessage = transcript
    .filter((m) => m.speaker === "prospect")
    .slice(-1)[0]?.text?.trim() ?? "";

  const systemPrompt =
    mode === "follow_up_question"
      ? `You are a real-time sales call assistant. The rep needs one short follow-up question to ask the customer to move the conversation forward.

Use the live transcript and the rep's notes only as context. Your output must be exactly one short question the rep can ask out loud—nothing else.

Rules:
- Output ONLY one natural, conversational question (e.g. "Do you currently have any coverage through work or a previous policy?").
- The question should help uncover the customer's situation and move the conversation forward.
- No bullet points, headings, markdown, or explanations.
- Do not output an answer to the customer; output only a question for the rep to ask.`
      : `You are a real-time sales knowledge assistant for a rep on a live call. Your job is to give the rep the exact sentence(s) to say to ANSWER the customer's question or respond to what they just said.

Use the notes panel as product knowledge. The rep is stuck and needs to answer clearly—not generic small talk.

Rules:
- Directly answer the prospect's last question or statement. Do not give a vague reply like "I'd like to learn more about your needs."
- Use the notes as product knowledge so the answer is specific and accurate.
- Output 1–2 short sentences maximum, in natural spoken sales language.
- No bullet points, headings, markdown, or explanations.
- Do not sound generic or vague. Prioritize answering the customer's question clearly.`;

  const parts: string[] = [
    `Conversation so far:\n${conversation.slice(-1200)}`,
  ];
  if (lastProspectMessage) {
    parts.push(`Last thing the prospect said:\n"${lastProspectMessage}"`);
  }
  parts.push(`Most recent exchange:\n${lastExchange}`);
  if (scriptContext) {
    parts.push(`Script / talking points (context only):\n${scriptContext.slice(0, 400)}`);
  }
  if (notesContext) {
    parts.push(`Rep's notes (product knowledge):\n${notesContext.slice(0, 800)}`);
  }
  if (mode === "follow_up_question") {
    parts.push(`What is one good follow-up question the rep should ask next? Reply with only that question.`);
  } else {
    parts.push(`What is the exact sentence the rep should say to answer the customer? Reply with only that line.`);
  }
  const userPrompt = parts.join("\n\n");

  const maxTokens = mode === "follow_up_question" ? 80 : 150;

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
        temperature: 0.5,
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
    let text = data.choices?.[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^##\s*[^\n]*\n?/gm, "").trim();
    const fallback =
      mode === "follow_up_question"
        ? "Press the button again after more conversation."
        : "Press Enter again after more conversation.";
    return NextResponse.json({ text: text || fallback });
  } catch (e) {
    console.error("Follow-up API error:", e);
    return NextResponse.json(
      { error: "AI follow-up failed" },
      { status: 500 }
    );
  }
}
