import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeMeUsage } from "@/lib/me-usage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const result = await computeMeUsage(supabase, user.id, user.email ?? undefined);
  if (!result.ok) {
    console.error("usage sessions query:", result.error);
    return NextResponse.json({ error: "Could not load usage" }, { status: 500 });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
