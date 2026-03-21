import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Rewrites notes into plain, retrieval-optimized product knowledge for the live AI assistant. */
export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }
  let body: { content?: string; style?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const content = (body.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "No content to rewrite" }, { status: 400 });
  }

  const systemPrompt = `You are rewriting product notes for a real-time AI sales assistant that answers live during sales calls.

Rewrite the notes into plain text only. Do not use headings, subtitles, markdown, numbered sections, bullet symbols or list markers (no leading "- ", "•", or "*"), presentation styling, or labeled blocks like "Core Value", "Pricing", "Objection Handling", or any "organized notes" style formatting.

The output must be optimized for fast retrieval during live conversations—not for human reading aesthetics. Reorganize implicitly: put the most practical, directly answerable sales information first, in this priority order:
1) What the product is
2) What value it delivers
3) Main product types / options
4) Typical pricing, ranges, and coverage numbers—if they exist in the source, preserve them clearly and place them early; if multiple pricing tiers exist, keep all of them
5) Objection handling—rewrite into short natural rebuttals as direct sentences
6) Technical insurance or product jargon last, compressed so it does not overshadow core sales answers (e.g. terms like "net single premium" should not dominate unless the source is specifically about that)

Use natural, direct, spoken-style phrasing the assistant can quote on a call. Keep all important facts from the source; do not invent anything. Avoid long technical explanations unless they are necessary for accuracy. Prefer flowing sentences; you may use blank lines between short paragraphs only for breathing room, not as fake sections.

Output rules: no preamble, no "here is the rewritten version", no intro or wrapping commentary—output only the rewritten notes.`;

  const userPrompt = `Rewrite these notes for the live AI assistant:\n\n${content.slice(0, 4000)}`;

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
        max_tokens: 2000,
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
