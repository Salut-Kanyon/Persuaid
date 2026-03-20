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

/** Last N messages so the model sees the full recent exchange (including long prospect turns). */
function getLastExchange(transcript: TranscriptMessage[], n = 16): string {
  const last = transcript.slice(-n);
  return last
    .map((m) => `${m.speaker === "prospect" ? "Prospect" : "Rep"}: ${m.text}`)
    .join("\n");
}

type FollowUpMode = "answer" | "follow_up_question";

function looksLikeQuestionOnly(text: string): boolean {
  const t = (text ?? "").trim();
  if (!t) return false;

  // Must end with ? (commonly question-only outputs).
  if (!t.endsWith("?")) return false;

  // If there are multiple sentences, it's probably not question-only.
  const sentenceParts = t.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
  if (sentenceParts.length > 1) return false;

  // If it starts like a question, treat as question-only.
  return /^(what|why|how|when|where|which)\b/i.test(t);
}

function clampText(t: string): string {
  return (t ?? "").trim().slice(0, 1200);
}

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
    dealContext?: Record<string, string>;
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
  const dealContext = body.dealContext ?? {};
  const mode: FollowUpMode = body.mode === "follow_up_question" ? "follow_up_question" : "answer";
  const conversation = buildConversation(transcript);
  if (!conversation.trim()) {
    return NextResponse.json({ text: "Say something so I can suggest what to say next." });
  }

  const lastExchange = getLastExchange(transcript);
  const lastProspectMessage = transcript
    .filter((m) => m.speaker === "prospect")
    .slice(-1)[0]?.text?.trim() ?? "";

  const baseSystemPrompt = `You are Persuaid, a real-time sales copilot helping a rep during a live sales call.

Your job is to give the rep the exact next words to say out loud in the moment, not generic coaching or analysis.

Before you respond, silently infer what the last prospect message is most like:
- product question
- pricing question
- objection
- competitor comparison
- hesitation
- buying signal
- confusion
- unclear transcript (for messy or incomplete text)

Use the full conversation below to understand context, topics discussed, and where the call is. Your response must address the prospect's last question or the current topic—not an earlier one.

Long questions: When the prospect's last message is long (multiple sentences or a paragraph), read the FULL conversation to understand the complete question. Your answer must address the whole question, with emphasis on the ending—what they are actually asking. Do not answer only the first part; use the full transcript so you don't miss context. Focus your answer on the ending statements / main ask.

Notes are reference only: use them when they help (product facts, objection handling). When the question is general or the notes don't apply, use your own knowledge and reasoning like a capable AI. Do not limit yourself to the notes; work as a general AI that has the notes available for reference. Do not invent product-specific facts (e.g. exact pricing, feature names) that contradict the notes.

Prioritize: (1) Last thing the prospect said / current topic. (2) Full conversation context. (3) Notes when relevant. (4) Script / talking points. (5) Deal context.

Always:
- Speak in natural, confident, spoken sales language (what the rep would actually say next).
- Prefer plainspoken, natural sales language over polished assistant language.
 - Stay concise (1–2 short sentences).
 - Never output only a question in ANSWER mode. If you add a question for momentum, it must come after the answer sentence.
- Do NOT output bullet points, headings, markdown, or multiple options.
- Do NOT explain your reasoning, coach the rep, or talk about "the transcript" or "the prospect's intent".
- Every response must either answer the question, handle the objection, move the conversation forward, or safely clarify what the prospect meant.

Voice: Avoid phrases like "I'd love to understand", "let's explore", "help guide you", "uncover your needs", "based on your situation". Prefer phrases like "that's a fair question", "the main thing is", "usually what people do is", "in most cases", "what that really means is". Do not begin with generic filler unless it is very brief and followed immediately by the answer.

Confidence: Use confident but natural sales language. Prefer "usually what people do is", "the main thing is", "most people in your situation", "typically what happens is". Avoid uncertain phrasing like "it might help to", "you could consider", "perhaps".

Humanizing: When appropriate, start with a short phrase then the answer: "That's a great question.", "That's actually pretty common.", "A lot of people ask that.", "That's a fair concern." Keep it short and follow immediately with the answer.

Momentum: When appropriate, end the response with a small forward-moving question or transition so the conversation keeps moving. Natural, not pushy. Examples: "Do you currently have any coverage in place today?" "Is that something you've looked into before?" "How are you currently handling that right now?"

Objections: When the prospect raises an objection, use: (1) Acknowledge the concern briefly, (2) Reframe or give helpful perspective, (3) Continue naturally. Example: "That's a fair concern. Most people actually find the monthly cost is lower than they expected. Usually what we do is start with something simple and adjust from there."

Notes and reasoning: The rep's notes are reference material—use them when they contain relevant product knowledge or objection-handling points. When the prospect's question is general, or the notes don't cover it, respond using your own knowledge and reasoning like a capable AI. You are a general AI with notes for reference, not limited to the notes. Do not invent product-specific facts (e.g. exact pricing, feature names) that contradict the notes; for everything else, reason and answer confidently. Always return a single spoken line when you can; do not refuse or ask for more context unless the prospect's message is truly unclear or garbled.`;

  const systemPrompt =
    mode === "follow_up_question"
      ? `${baseSystemPrompt}

You are currently in FOLLOW-UP QUESTION mode.

Your goal is to give the rep ONE strong follow-up question to ask the prospect that moves the sale forward.

Rules specific to this mode:
- Output ONLY one natural, conversational question the rep can ask out loud.
- Choose a question that logically follows the last thing the prospect said.
- Prefer questions that uncover pain, urgency, budget, decision process, current setup, or hidden objections.
- Do not answer the prospect directly; output only the question.
- No bullet points, headings, markdown, explanations, or multiple questions.`
      : `${baseSystemPrompt}

You are currently in ANSWER mode.

Your goal is to give the rep the exact short line or two they should say next to respond to the prospect.

Rules specific to this mode:
- When the prospect's last message is a direct question or objection, the first sentence must directly answer or address it immediately. Do not begin with generic filler (e.g. "I'd love to learn more about your situation so I can help guide you") unless it is very brief and followed immediately by the answer. Good: "That's a fair question. Employer coverage is usually limited and often doesn't follow you if you leave the job." Bad: "I'd love to learn more about your situation so I can help guide you."
- If the last prospect message looks like a definition/factual question (contains patterns like "what is", "what does", "define", "explain", "how does", "meaning"), treat it as a direct definition request and answer immediately in the first sentence.
- When the prospect raises an objection, use Acknowledge → Reframe → Continue (brief acknowledge, then reframe or add perspective, then continue naturally). When appropriate, you may end with a short forward-moving question (Momentum), but only AFTER you have already answered.
- Directly answer or respond to the prospect's last message using the intent you inferred.
- Use the notes as reference when they apply; when they don't, use your own knowledge so the answer is still helpful and accurate.
- Output 1–3 short sentences when needed (answer first). If you include a follow-up question, it must be the 2nd sentence (or later) and the 1st sentence must still be a clear answer.
- If the prospect's last message is clearly confused or the transcript is garbled / ambiguous so you cannot tell what they are asking, do NOT guess. Instead, output one short clarifying line that politely checks what they mean (for example, asking if they are asking more about pricing or how the product works).
- Do not output bullet points, headings, markdown, explanations, or coaching.`;

  /** Enough transcript so long questions and full context are never truncated. */
  const CONVERSATION_MAX_CHARS = 14000;
  const fullConversation = conversation.length > CONVERSATION_MAX_CHARS
    ? conversation.slice(-CONVERSATION_MAX_CHARS)
    : conversation;

  const parts: string[] = [
    `Full conversation (read all of it to understand long questions; respond to the prospect's last question, focusing on the ending):\n${fullConversation}`,
  ];
  if (lastProspectMessage) {
    parts.push(`Prospect's last message—may be long; use full conversation above to interpret; focus your answer on the ending / main ask:\n"${lastProspectMessage}"`);
  }
  parts.push(`Most recent exchange:\n${lastExchange}`);
  if (scriptContext) {
    parts.push(`Script / talking points (context only):\n${scriptContext.slice(0, 400)}`);
  }
  if (notesContext) {
    parts.push(`Rep's notes (reference only; use when relevant; otherwise use your own knowledge):\n${notesContext.slice(0, 1200)}`);
  }
  const dealContextEntries = Object.entries(dealContext).filter(([, v]) => typeof v === "string" && v.trim());
  if (dealContextEntries.length > 0) {
    const dealSummary = dealContextEntries
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(". ");
    parts.push(`Deal context (what we know so far about this prospect/call): ${dealSummary}`);
    parts.push(
      `Use the deal context above when it helps: reference the prospect's company, timeline, current solution, pain, or decision maker to make the reply more relevant (e.g. "Since you're already using Salesforce…", "Given you're looking at next quarter…").`
    );
  }
  parts.push(
    `For your internal reasoning only (do NOT mention this out loud), first decide which intent category best matches the prospect's last message: product question, pricing question, objection, competitor comparison, hesitation, buying signal, confusion, or unclear transcript. Then, based on the current mode and that intent, craft exactly one concise spoken response as instructed.`
  );
  if (mode === "follow_up_question") {
    parts.push(`What is one good follow-up question the rep should ask next?

Reply with a JSON object only, no other text. Use this exact format:
{"text": "the exact question the rep should ask", "sourceType": "notes" | "conversation" | "web"}
Set sourceType to: "notes" if you used the rep's notes; "conversation" if you used only the transcript/context of the call; "web" if you used general knowledge (not from notes or transcript).`);
  } else {
    parts.push(`What is the exact sentence the rep should say to answer the customer?

Reply with a JSON object only, no other text. Use this exact format:
{"text": "the exact line the rep should say", "sourceType": "notes" | "conversation" | "web"}
Set sourceType to: "notes" if you used the rep's notes; "conversation" if you used only the transcript/context of the call; "web" if you used general knowledge (not from notes or transcript).`);
  }
  const userPrompt = parts.join("\n\n");

  const maxTokens = mode === "follow_up_question" ? 120 : 320;

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
    let raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    let text = "";
    let sourceType = "";
    try {
      const parsed = JSON.parse(raw) as { text?: string; sourceType?: string };
      text = typeof parsed.text === "string" ? parsed.text.trim() : "";
      const st = (parsed.sourceType ?? "").toLowerCase();
      if (st === "notes" || st === "conversation" || st === "web") sourceType = st;
    } catch {
      text = raw.replace(/^##\s*[^\n]*\n?/gm, "").trim().replace(/^[\-\u2022]\s*/, "").trim();
    }

    // Safety: in ANSWER mode, never allow “question-only” outputs.
    // If the model returns a question without any declarative answer, re-prompt once.
    if (mode === "answer" && looksLikeQuestionOnly(text)) {
      const rewriteSystemPrompt = `${systemPrompt}

Safety rewrite rules (ANSWER mode):
- You MUST include a direct answer sentence first (declarative; NOT a question).
- If you include a follow-up question, it must be after the answer (2nd sentence or later).
- Never output only a question.
- Keep it concise and spoken-sales natural.
- Return a JSON object only using the same schema: { "text": "...", "sourceType": "notes" | "conversation" | "web" }.`;

      const rewriteRes = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: rewriteSystemPrompt },
            {
              role: "user",
              content: `${userPrompt}\n\nDraft output failed safety check:\n${clampText(text)}`,
            },
          ],
          max_tokens: 320,
          temperature: 0.3,
        }),
      });

      if (rewriteRes.ok) {
        const rewriteData = (await rewriteRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
        let rewriteRaw = rewriteData.choices?.[0]?.message?.content?.trim() ?? "";
        rewriteRaw = rewriteRaw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          const parsed = JSON.parse(rewriteRaw) as { text?: string; sourceType?: string };
          const rewrittenText = typeof parsed.text === "string" ? parsed.text.trim() : "";
          const st = (parsed.sourceType ?? "").toLowerCase();
          if (rewrittenText) text = rewrittenText;
          if (st === "notes" || st === "conversation" || st === "web") sourceType = st;
        } catch {
          // If parsing fails, keep original text fallback.
        }
      }
    }

    if (!text) {
      const fallback =
        mode === "follow_up_question"
          ? "Press the button again after more conversation."
          : "Press Enter again after more conversation.";
      text = fallback;
    }
    if (!sourceType) sourceType = "conversation";
    return NextResponse.json({
      text,
      sourceType,
    });
  } catch (e) {
    console.error("Follow-up API error:", e);
    return NextResponse.json(
      { error: "AI follow-up failed" },
      { status: 500 }
    );
  }
}
