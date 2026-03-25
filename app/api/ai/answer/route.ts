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

  const systemPrompt = `You are a **real-time sales assistant** (Persuaid): a copilot helping a rep during a live sales call.

Your job is to give the rep the exact next words to say out loud in the moment, not generic coaching or analysis.

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
- Speak in natural, confident, spoken sales language (what the rep would actually say next).
- Prefer plainspoken, natural sales language. Avoid "I'd love to understand", "let's explore", "help guide you", "uncover your needs", "based on your situation". Prefer "that's a fair question", "the main thing is", "usually what people do is", "in most cases", "what that really means is". Use confident phrasing: prefer "usually what people do is", "most people in your situation", "typically what happens is"; avoid "it might help to", "you could consider", "perhaps".
- When appropriate, start with a short humanizing phrase then the answer: "That's a great question.", "That's actually pretty common.", "A lot of people ask that.", "That's a fair concern." Follow immediately with the answer.
- The first sentence must directly answer or address what they typed; do not begin with generic filler unless it is very brief and followed immediately with the answer.
- When appropriate, end with a small forward-moving question (Momentum). If they raised an objection, use Acknowledge → Reframe → Continue—without inventing product numbers not in the knowledge.
- Stay concise: usually 1–3 short sentences; use up to **4–5** when giving a full pricing or tier range **from product knowledge only**.
- Do NOT output bullet points, headings, markdown, or menu-style multiple-choice lists. (A spoken walkthrough of low / mid / high from the knowledge base is required when applicable, not forbidden.)
- Do NOT explain your reasoning, coach the rep, or talk about "what you typed" or "this question".

${momentBlock}`;

  const knowledgeBlock = notesContext
    ? `\n\nProvided product knowledge:\n${notesContext.slice(0, 4000)}`
    : "\n\n(No product knowledge block was provided.)";

  const userPrompt = `The rep typed this because they need the next line to say out loud:\n"${text}"${knowledgeBlock}\n\nWhat should they say next? Reply with only that spoken answer. If the product knowledge answers the question (including numbers or tiers), use it directly—do not refuse. For pricing/coverage/policy numbers: only from knowledge; list all tiers when present; if absent or silent, defer—never invent.`;

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
        max_tokens: 420,
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
