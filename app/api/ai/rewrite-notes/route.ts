import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Improves pasted notes for sales: product knowledge, clarity, structure. */
export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  type RewriteStyle = "clean_bullets" | "headings" | "checklist" | "paragraph";
  let body: { content?: string; style?: RewriteStyle };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const content = (body.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "No content to rewrite" }, { status: 400 });
  }
  const style = body.style ?? "headings";

  const styleRules: Record<RewriteStyle, string> = {
    clean_bullets:
      "Format as short, scannable bullets. Use ONLY hyphen bullets (\"- \"). No asterisks. No markdown emphasis.",
    headings:
      "Format with short section headings (plain text, no markdown) followed by hyphen bullets. No asterisks. No markdown emphasis.",
    checklist:
      "Format as a checklist using \"[ ] \" for actionable items and hyphen bullets for reference points. No asterisks. No markdown emphasis.",
    paragraph:
      "Format as 1–2 short paragraphs plus 3–6 hyphen bullets for key points. No asterisks. No markdown emphasis.",
  };

  const systemPrompt = `You are a sales enablement expert. Rewrite the user's notes so they are clearer and more useful for a sales call. Improve:
- Product knowledge: make features and benefits easy to recall and explain.
- Objection handling: turn rough notes into clear rebuttals or talking points.
- Structure: use short bullets or sections so the rep can scan quickly during a call.
Keep the same general content; do not add fake details.

Output rules:
- Output only the rewritten notes, no preamble.
- Do not use asterisks (*) for bullets. Prefer hyphen bullets.
- Do not use markdown bold/italics.
- ${styleRules[style]}`;
  const userPrompt = `Rewrite these notes for a sales rep:\n\n${content.slice(0, 4000)}`;

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
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI rewrite error:", res.status, err);
      return NextResponse.json(
        { error: "AI rewrite failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rewritten = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text: rewritten || content });
  } catch (e) {
    console.error("Rewrite notes API error:", e);
    return NextResponse.json(
      { error: "AI rewrite failed" },
      { status: 500 }
    );
  }
}
