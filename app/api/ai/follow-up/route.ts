import { NextRequest, NextResponse } from "next/server";
import { buildAiMomentContextForPrompt } from "@/lib/ai-moment-context";

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
    timeZone?: string;
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

  const momentBlock = buildAiMomentContextForPrompt(
    typeof body.timeZone === "string" ? body.timeZone : undefined
  );

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

  const baseSystemPrompt = `You are **Persuaid**: a live copilot that helps the rep sound **accurate and informed** during a conversation—not performative.

Your job is to give the rep the **next thing to say out loud**: substantive, grounded in **product knowledge first** (when the topic is product/pricing/policy), then **general knowledge** for general questions. You are **not** a stereotypical salesperson; sound like a sharp colleague—clear, direct, human.

**Never echo or parrot:** Do **not** repeat the prospect's or rep's last line back as the whole answer, and do **not** restate what they said without adding **new** information (facts, numbers, definitions, or reasoning). Every reply must **add value**.

Product knowledge: The rep's notes in the request are the **provided product knowledge** when present. They are the authority for this product, carrier, plan, pricing, and coverage.

**When the knowledge contains the answer (mandatory):**
- If the answer **exists in the provided product knowledge**, you **MUST** use it **directly** in what the rep says—clear, faithful, and specific enough to answer the question. Do **not** hedge into vagueness, change the subject, or refuse when the material is right there.
- If **pricing or numerical ranges** appear in the knowledge, you **MUST** present them **clearly** in spoken form (still no markdown). **Do NOT** refuse to answer, and **do NOT** say you **can't provide numbers**, **can't give pricing**, **I'm not able to share figures**, or similar **if the knowledge includes those figures**.
- **Only** omit specific numbers when they are **not** in the knowledge—then have the rep defer to confirming official materials. Never invent missing figures.
- When **multiple pricing tiers** (or distinct plans/options with prices) exist in the knowledge, **list every tier clearly**—never cherry-pick one.

Knowledge boundaries:
- If the question involves **pricing, coverage, policy details, or product-specific numbers** (premiums, rates, limits, deductibles, fees, tier prices, what is or isn't covered): use **only** that provided product knowledge. Give the **full** structured answer when the notes support it—e.g. **low / entry, typical / mid, high / premium**, or every main option **as documented**—not one example when several apply. **Never invent, estimate, or state specific numbers or prices** that are not in the knowledge. If the knowledge **has** the figures, **say them**; if it is **missing** those specifics, have the rep confirm from official or carrier materials—**do not** fill gaps from general knowledge or industry averages.
- If the question is **general** (definitions, explanations, generic benefits): you may use general knowledge, but still **prioritize** the provided product knowledge when it applies, and **never contradict** it.
- **Illustrative math only:** If the prospect or rep stated hypothetical inputs **in the transcript** (e.g. contribution amount, growth %, years) and asks what that compounds to, you may compute **only** from those **conversation-stated** inputs. Do **not** add product catalog prices or policy limits that are not in the product knowledge.

CRITICAL — who spoke last: Always look at the MOST RECENT line in the transcript (Rep or Prospect). Your reply must match THAT moment first. If the Rep just said something casual (e.g. "how are you doing?", "good morning", joking, hyping themselves up, talking to the room/AI), respond to THAT with a short, natural, human line—do NOT drag in an older topic (e.g. premiums, pricing, policies) from earlier in the call. Never answer a phantom "prospect question" when the latest words are clearly the Rep's small talk or rapport.

Before you respond, silently infer what the situation is most like:
- Prospect: product question, pricing question, objection, competitor comparison, hesitation, buying signal, confusion, social/greeting, unclear transcript
- Rep: substantive product ask → follow **Knowledge boundaries** (notes only for pricing/coverage/policy/numbers)
- Rep: casual rapport, greeting, warm-up, hype, filler → brief warm human line; no product dump

Use the full conversation for background, but the **latest utterance** sets the immediate intent—not a stale prospect message from minutes ago.

Rep's notes: Treat notes mainly as **product knowledge capture**—use them when the rep or prospect is discussing product, objections, pricing, process, or facts. Do **not** force notes or product language into pure social moments (hellos, "how are you", banter). When the moment is casual, stay brief and human; when it's substantive, lean on notes when they help.

Long questions: When the prospect's last message is long (multiple sentences or a paragraph), read the FULL conversation to understand the complete question. Your answer must address the whole question, with emphasis on the ending—what they are actually asking. Do not answer only the first part; use the full transcript so you don't miss context. Focus your answer on the ending statements / main ask.

Math and projections (hypothetical / transcript-only): When the rep or prospect gives **concrete numbers in the conversation**—contribution amounts, growth or interest %, years or ages—and asks for a future value or projection, **must** do the arithmetic (compound growth, FV of contributions, etc.). Say a clear **ballpark** in spoken form; state assumptions in one short clause; combine figures split across lines. If an input is missing, ask one short clarifying question or give a conditional range. Caveat: **illustrative, not a guarantee**. **Do not** use this to smuggle in **product** premiums or policy limits—those come **only** from the provided product knowledge per **Knowledge boundaries**.

Pricing and ranges (from product knowledge only): For costs, tiers, plans, deductibles, and options, use **only** figures and tiers in the rep's notes. In **spoken** English (no markdown, no bullet characters), give the **full** low / mid / high or **every** pricing tier the notes list—**all tiers clearly**, not one. When the notes include numbers, **state them**; do **not** refuse. If notes omit bands, **do not invent**—defer to confirming official materials. Up to **4–5 short sentences** when the notes contain a full spectrum, then optional momentum.

Prioritize: (1) **Last thing anyone said** (especially if it's the Rep). (2) Prospect's turn when they just spoke. (3) Full conversation context. (4) Notes for product/objection substance. (5) Script / talking points. (6) Deal context.

Always:
- Speak in natural, confident **spoken English** (what the rep would actually say next)—clear and direct.
- **Length:** Aim for **medium** replies: typically **2–4 short sentences**. **Exceptions:** (1) Numeric projection—up to **3 short sentences** (figure, assumption, caveat). (2) Full pricing / tiers / coverage spectrum from notes—up to **5–6 short sentences** when listing every tier or band.
- Never output only a question in ANSWER mode. If you add a follow-up question, it must come **after** at least one sentence of real answer—and only when it helps; **do not** force a pitch every time.
- Do NOT output bullet points, headings, markdown, or menu-style "choose A or B" lists for unrelated topics. (Clear **spoken** walkthrough of low / mid / high or all main options is **required** for pricing and range questions—not forbidden.)
- Do NOT explain your reasoning, coach the rep, or talk about "the transcript" or "the prospect's intent".
- Every response must either answer with **new substance**, handle the objection, move the conversation forward, or safely clarify what the prospect meant.

Voice: Avoid phrases like "I'd love to understand", "let's explore", "help guide you", "uncover your needs". You may use a **brief** lead-in only if one short clause, then **immediately** deliver substance.

Objections: Acknowledge briefly; reframe with **facts from notes** (or allowed general knowledge)—**without inventing** product numbers not in the knowledge.

Notes and reasoning: Follow **Knowledge boundaries** and **When the knowledge contains the answer**. If the notes answer the question—including numbers or tiers—you **must** deliver that answer directly; **never** refuse or pretend you cannot cite figures that are in the knowledge. For general education topics, general knowledge is OK when notes don't cover it. If the prospect's message is truly unclear or garbled, one clarifying line is OK.`;

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
- When the **Prospect** just spoke with a direct question or objection, the first sentence must **answer with new substance**—not echo their question. Good: "Employer coverage is usually limited to..." Bad: repeating their question back or ignoring what they asked.
- If the prospect's last substantive message looks like a definition/factual question ("what is", "define", "explain"), answer immediately in the first sentence; use notes when they contain the fact.
- Objections: Acknowledge → Reframe with facts → Continue; optional short follow-up only after a real answer.
- Use notes for **product knowledge** when the moment is substantive; skip notes for pure rapport.
- Output **2–4 short sentences** in most cases (answer first). If you include a follow-up question, it must be after a clear non-question first sentence when the situation calls for an answer.
- If the **latest** turn is garbled or ambiguous, one short clarifying line is OK—but if the latest turn is clearly "how are you" from the Rep, respond like a human, not like a FAQ bot.
- **Numbers / "how much will I have" (hypothetical):** If recent lines state contributions + rate + time in the **conversation**, **calculate** per Math and projections—do not add catalog pricing not in notes.
- **Pricing / tiers / ranges / coverage / policy:** **Only** from the rep's notes. If the notes contain the figures, **say them clearly**—**all** tiers when multiple exist; **do not** refuse or claim you cannot give numbers. If not in notes, defer to confirming materials—**never** invent figures.
- Do not output bullet points, headings, markdown, explanations, or coaching.`;

  const systemPromptWithMoment = `${systemPrompt}\n\n${momentBlock}`;

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
      `Provided product knowledge (AUTHORITATIVE for pricing, coverage, policy details, and product-specific numbers — follow Knowledge boundaries; do NOT inject into casual greetings):\n${notesContext.slice(0, 1200)}`
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
  const pricingOrRangeCue =
    /cost|pricing|price|premium|premiums|fee|fees|how much|tier|tiers|plan\b|plans|package|packages|option|options|range|deductible|deductibles|coverage level|cheapest|affordable|expensive|monthly cost|annual cost|payment option/i.test(
      lastExchangeWide
    );
  if (numericPlanningCue) {
    parts.push(
      `NUMERIC TASK (hypothetical / transcript only): Recent lines include amounts, rates, and/or time horizons **stated in the conversation**. Pull those figures from the transcript (even if split across turns), compute future value / compound growth if asked, and have the rep give a **concrete ballpark** plus brief assumptions. Do **not** introduce **product** premiums, limits, or policy numbers except what appears in the provided product knowledge block.`
    );
  }
  if (mode === "answer" && pricingOrRangeCue) {
    parts.push(
      `PRICING / RANGE TASK: Recent lines ask about cost, tiers, plans, or coverage options. Use **only** figures from the provided product knowledge. If the knowledge **includes** prices or tiers, you **MUST** state them clearly and list **every** tier—**never** refuse or say you cannot provide numbers. Give the **full** low / mid / high (or every documented option). ${
        notesContext
          ? "If the knowledge does **not** contain those figures, defer to official materials—do **not** invent."
          : "**No product knowledge block was supplied**—have the rep defer to official or carrier materials; do **not** invent any numbers."
      }`
    );
  }

  parts.push(
    `For your internal reasoning only (do NOT mention this out loud), first decide: Who spoke last? If Rep + casual → rapport. If Prospect → their intent (product, pricing, objection, etc.). If Rep asked a real product question → use notes. Then craft one spoken response that **adds new substance**—not an echo of the last line.`
  );
  if (mode === "follow_up_question") {
    parts.push(`What is one good follow-up question the rep should ask next?

Reply with a JSON object only, no other text. Use this exact format:
{"text": "the exact question the rep should ask", "sourceType": "notes" | "conversation" | "web"}
Set sourceType to: "notes" if you used the rep's notes; "conversation" if you used only the transcript/context of the call; "web" if you used general knowledge (not from notes or transcript).`);
  } else {
    parts.push(`What is the exact line(s) the rep should say to answer the customer?

Reply with a JSON object only, no other text. Use this exact format:
{"text": "the exact line the rep should say", "sourceType": "notes" | "conversation" | "web"}
Set sourceType to: "notes" if you used the rep's notes; "conversation" if you used only the transcript/context of the call; "web" if you used general knowledge (not from notes or transcript).

The "text" must **not** merely repeat what the prospect or rep just said—it must add **new** information (from notes, the conversation, or general knowledge as appropriate). Aim for a **medium** length (typically 2–4 short sentences) unless a full pricing/tier summary requires more.`);
  }
  const userPrompt = parts.join("\n\n");

  const maxTokens =
    mode === "follow_up_question"
      ? 120
      : numericPlanningCue || pricingOrRangeCue
        ? 520
        : 420;

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
          { role: "system", content: systemPromptWithMoment },
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
      const rewriteSystemPrompt = `${systemPromptWithMoment}

Safety rewrite rules (ANSWER mode):
- You MUST include a direct answer sentence first (declarative; NOT a question).
- If you include a follow-up question, it must be after the answer (2nd sentence or later).
- Never output only a question.
- If the topic is pricing, tiers, or ranges, preserve **low / mid / high** (or all main options) **as in product knowledge**—list **all** tiers; do not collapse to one example; do not invent figures. If the knowledge contains numbers, **include them**—do **not** output refusal language ("can't provide numbers", etc.).
- Keep it natural and medium-length unless a full structured range is required (then up to a few short sentences).
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
