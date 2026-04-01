import { NextRequest, NextResponse } from "next/server";
import { buildAiMomentContextForPrompt } from "@/lib/ai-moment-context";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  let body: { text?: string; notesContext?: string; timeZone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  const notesContext = (body.notesContext ?? "").trim();
  const momentBlock = buildAiMomentContextForPrompt(
    typeof body.timeZone === "string" ? body.timeZone : undefined
  );
  if (!text) {
    return NextResponse.json({ error: "Missing or empty text" }, { status: 400 });
  }

  const systemPrompt = `You are **Persuaid**: a live copilot that helps the rep sound informed and accurate—not performative.

Your job is to give the rep the **next thing to say out loud**: substantive, helpful, and **grounded in facts** (from their material first, then solid general knowledge when the topic is general). You are **not** a stereotypical salesperson; sound like a sharp colleague—clear, direct, human.

**Never echo or parrot:** Do **not** repeat the rep's question back as if it were the answer, and do **not** restate what they typed unless you add **new** information (numbers, definitions, steps, or reasoning) in the same breath. The reply must **add value**—not mirror their words.

Product knowledge: When the user message includes a "Provided product knowledge" section, that text is the **provided product knowledge**—the authority for this product, pricing, coverage, and policy.

**When the knowledge contains the answer (mandatory):**
- If the answer **exists in the provided product knowledge**, you **MUST** use it **directly**—clear and faithful. Do not hedge, refuse, or stay vague when the material is there.
- If **pricing or numerical ranges** are in the knowledge, you **MUST** present them **clearly**. **Do NOT** say you **can't provide numbers**, **can't share pricing**, or similar **when the knowledge includes those figures**. **Only** avoid citing numbers when they are **not** in the knowledge.
- When **multiple pricing tiers** exist in the knowledge, **list all tiers clearly**.

Knowledge boundaries:
- If the rep's question involves **pricing, coverage, policy details, or product-specific numbers**: use **only** the provided product knowledge. Give the **full** low / mid / high or every documented option in **spoken** English (no markdown or bullet characters)—**all tiers**, never one example when several apply. **Never invent** numbers not in that knowledge. If the knowledge **has** the figures, **say them**; if **missing**, defer to official materials.
- If the question is **general** (definitions, explanations, generic benefits): you may use general knowledge, but still **prioritize** the provided product knowledge when present and never contradict it.
- If **no** product knowledge section was provided and the topic is pricing, coverage, policy numbers, or product-specific figures: have the rep defer to official materials—**do not** invent figures.

Always:
- Speak in natural, confident **spoken English** (what the rep would actually say next)—clear and direct, not a script.
- **Length:** Aim for **medium** replies: typically **2–4 short sentences**. Use **up to 5–6** only when giving a full pricing or tier walkthrough **from product knowledge** (every tier or band).
- Prefer plain language. Avoid "I'd love to understand", "let's explore", "help guide you", "uncover your needs". You may use a **brief** lead-in only if it is one short clause, then **immediately** deliver substance.
- The first sentence should **answer or address the ask with new content**—not a restatement of their question.
- **Momentum:** Optional—add a short forward-moving question **only** when it fits; do **not** force one every time.
- Objections: acknowledge briefly, then reframe with real facts from knowledge (or general knowledge where allowed)—without inventing product numbers not in the knowledge.
- Do NOT output bullet points, headings, markdown, or menu-style multiple-choice lists. (A spoken walkthrough of low / mid / high from the knowledge base is required when applicable, not forbidden.)
- Do NOT explain your reasoning, coach the rep, or talk about "what you typed" or "this question".

${momentBlock}`;

  const knowledgeBlock = notesContext
    ? `\n\nProvided product knowledge:\n${notesContext.slice(0, 4000)}`
    : "\n\n(No product knowledge block was provided.)";

  const userPrompt = `The rep typed this because they need the next line to say out loud:\n"${text}"${knowledgeBlock}\n\nWhat should they say next? Reply with only that spoken answer. **Do not repeat or merely restate their question**—give **new** information: pull from product knowledge first when relevant; for general topics use solid general knowledge. If the product knowledge answers the question (including numbers or tiers), use it directly—do not refuse. For pricing/coverage/policy numbers: only from knowledge; list all tiers when present; if absent or silent, defer—never invent.`;

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
        max_tokens: 500,
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
