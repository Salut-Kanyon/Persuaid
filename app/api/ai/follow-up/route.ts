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
  /** Wider window so split STT lines (amount, then rate, then age) still trigger math mode. */
  const lastExchangeWide = getLastExchange(transcript, 40);
  const lastProspectMessage = transcript
    .filter((m) => m.speaker === "prospect")
    .slice(-1)[0]?.text?.trim() ?? "";
  const lastTurn = transcript.length > 0 ? transcript[transcript.length - 1] : undefined;
  const lastSpeakerLabel = lastTurn?.speaker === "prospect" ? "Prospect" : "Rep";
  const lastUtteranceText = lastTurn?.text?.trim() ?? "";
  const lastTurnIsRep = lastTurn != null && lastTurn.speaker !== "prospect";

  const baseSystemPrompt = `You are Persuaid, a real-time sales copilot helping a rep during a live sales call.

Your job is to give the rep the exact next words to say out loud in the moment, not generic coaching or analysis.

CRITICAL — who spoke last: Always look at the MOST RECENT line in the transcript (Rep or Prospect). Your reply must match THAT moment first. If the Rep just said something casual (e.g. "how are you doing?", "good morning", joking, hyping themselves up, talking to the room/AI), respond to THAT with a short, natural, human line—do NOT drag in an older topic (e.g. premiums, pricing, policies) from earlier in the call. Never answer a phantom "prospect question" when the latest words are clearly the Rep's small talk or rapport.

Before you respond, silently infer what the situation is most like:
- Prospect: product question, pricing question, objection, competitor comparison, hesitation, buying signal, confusion, social/greeting, unclear transcript
- Rep: substantive question to themselves / product ask → use notes or reasoning
- Rep: casual rapport, greeting, warm-up, hype, filler → brief warm human line; no product dump

Use the full conversation for background, but the **latest utterance** sets the immediate intent—not a stale prospect message from minutes ago.

Rep's notes: Treat notes mainly as **product knowledge capture**—use them when the rep or prospect is discussing product, objections, pricing, process, or facts. Do **not** force notes or product language into pure social moments (hellos, "how are you", banter). When the moment is casual, stay brief and human; when it's substantive, lean on notes when they help.

Long questions: When the prospect's last message is long (multiple sentences or a paragraph), read the FULL conversation to understand the complete question. Your answer must address the whole question, with emphasis on the ending—what they are actually asking. Do not answer only the first part; use the full transcript so you don't miss context. Focus your answer on the ending statements / main ask.

Math and projections: When the rep or prospect gives **concrete numbers**—payment amounts, contribution per month/year, interest or growth rate %, ages or years (e.g. "from 25 to 65")—you **must** do the arithmetic internally (compound growth, future value of periodic contributions, etc.). Do **not** answer with vague phrases like "significant growth" or "diving into the numbers" without figures. Say a clear **ballpark total** in spoken form (round sensibly: "around twelve million" / "roughly two point four million"). State the assumptions in one short clause ("assuming about seven percent compounded monthly for forty years"). If the transcript splits numbers across lines ("six point seven percent", "$6,500 a month"), **combine the full recent exchange** before calculating. If a number is missing (e.g. rate unclear), ask one short clarifying question **or** give a range ("if it's closer to six versus seven percent, you're still in the X to Y range"). Add a brief caveat that it's **illustrative, not a guarantee** and real products/taxes vary—one short phrase, still conversational.

Notes are reference only: use them when they help (product facts, objection handling). When the question is general or the notes don't apply, use your own knowledge and reasoning like a capable AI. Do not limit yourself to the notes; work as a general AI that has the notes available for reference. Do not invent product-specific facts (e.g. exact pricing, feature names) that contradict the notes.

Prioritize: (1) **Last thing anyone said** (especially if it's the Rep). (2) Prospect's turn when they just spoke. (3) Full conversation context. (4) Notes for product/objection substance. (5) Script / talking points. (6) Deal context.

Always:
- Speak in natural, confident, spoken sales language (what the rep would actually say next).
- Prefer plainspoken, natural sales language over polished assistant language.
 - Stay concise (usually 1–2 short sentences). **Exception:** numeric projection answers may use up to **3 short sentences** so you can state the ballpark figure, the assumption, and a one-line caveat.
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
- Anchor to the **latest utterance** in the transcript. If the Rep was last and the moment is casual, suggest a rapport or transition question—not a deep product probe left over from an old topic.
- When the Prospect was last, choose a question that logically follows what they said; prefer pain, urgency, budget, process, or hidden objections when appropriate.
- Do not answer the prospect directly; output only the question.
- No bullet points, headings, markdown, explanations, or multiple questions.`
      : `${baseSystemPrompt}

You are currently in ANSWER mode.

Your goal is to give the rep the exact short line or two they should say next to respond to the prospect.

Rules specific to this mode:
- If the **most recent transcript line is the Rep** and it's casual (greeting, "how are you", banter, hype, talking to the AI/room), output a short, natural line the rep could say next—warm, confident, maybe playful—**zero** product jargon from notes unless they explicitly asked a product question. Do not mention premiums, policies, or "clarify your question" unless the **latest** turn is actually about that.
- When the **Prospect** just spoke with a direct question or objection, the first sentence must answer or address it. Good: "That's a fair question. Employer coverage is usually limited…" Bad: ignoring what they literally just said and reverting to an old topic.
- If the prospect's last substantive message looks like a definition/factual question ("what is", "define", "explain"), answer immediately in the first sentence; use notes when they contain the fact.
- Objections: Acknowledge → Reframe → Continue; optional short forward-moving question only after you've answered.
- Use notes for **product knowledge** when the moment is substantive; skip notes for pure rapport.
- Output 1–3 short sentences when needed (answer first). If you include a follow-up question, it must be after a clear non-question first sentence when the situation calls for an answer.
- If the **latest** turn is garbled or ambiguous, one short clarifying line is OK—but if the latest turn is clearly "how are you" from the Rep, respond like a human, not like a FAQ bot.
- **Numbers / "how much will I have"**: If recent lines include contributions + rate + time horizon, **calculate** and say the result out loud (see Math and projections in the system prompt). Never substitute hype for math.
- Do not output bullet points, headings, markdown, explanations, or coaching.`;

  /** Enough transcript so long questions and full context are never truncated. */
  const CONVERSATION_MAX_CHARS = 14000;
  const fullConversation = conversation.length > CONVERSATION_MAX_CHARS
    ? conversation.slice(-CONVERSATION_MAX_CHARS)
    : conversation;

  const parts: string[] = [
    `Full conversation (read for context; your immediate reply must align with the LATEST utterance below, not an older thread):\n${fullConversation}`,
  ];
  if (lastUtteranceText) {
    parts.push(
      `LATEST utterance (highest priority — who spoke last: ${lastSpeakerLabel}):\n"${lastUtteranceText}"\n` +
        (lastTurnIsRep
          ? `The Rep spoke last. If this is casual/social/warm-up, match that energy; do NOT answer as if the Prospect just asked about product/pricing from earlier.`
          : `The Prospect spoke last. Respond to what they just said.`)
    );
  }
  if (lastProspectMessage && lastProspectMessage !== lastUtteranceText) {
    parts.push(
      `Prospect's most recent message (use only if it is still the active topic; if the Rep spoke after this, the Rep's latest line wins):\n"${lastProspectMessage}"`
    );
  }
  parts.push(`Most recent exchange:\n${lastExchange}`);
  if (scriptContext) {
    parts.push(`Script / talking points (context only):\n${scriptContext.slice(0, 400)}`);
  }
  if (notesContext) {
    parts.push(
      `Rep's notes — product knowledge & objection reference (use for substantive buyer/rep product questions; do NOT inject into casual greetings or rep-only banter):\n${notesContext.slice(0, 1200)}`
    );
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

  const numericPlanningCue =
    /\d/.test(lastExchangeWide) &&
    /%|percent|month|months|year|years|age|\$|invest|interest|premium|contribution|put in|putting in|how much|have when|rate/i.test(
      lastExchangeWide
    );
  if (numericPlanningCue) {
    parts.push(
      `NUMERIC TASK: Recent lines include amounts, rates, and/or time horizons. Pull **all** relevant figures from the transcript (even if split across turns). Compute future value / compound growth as appropriate and have the rep say a **concrete ballpark dollar outcome** plus brief assumptions—not generic encouragement.`
    );
  }

  parts.push(
    `For your internal reasoning only (do NOT mention this out loud), first decide: Who spoke last? If Rep + casual → rapport. If Prospect → their intent (product, pricing, objection, etc.). If Rep asked a real product question → use notes. Then craft one concise spoken response as instructed.`
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

  const maxTokens = mode === "follow_up_question" ? 120 : numericPlanningCue ? 420 : 320;

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
