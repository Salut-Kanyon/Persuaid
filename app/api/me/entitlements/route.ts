import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveEffectivePlan } from "@/lib/agency";

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

  const { plan, agency } = await resolveEffectivePlan(supabase, user.id, user.email ?? undefined);
  const body: {
    plan: string;
    agencyId?: string;
    agencyRole?: "owner" | "member";
    bypassConfigured?: boolean;
  } = { plan };
  if (agency) {
    body.agencyId = agency.agencyId;
    body.agencyRole = agency.role;
  }
  if (process.env.NODE_ENV === "development") {
    const hasBypass =
      !!process.env.PAYWALL_BYPASS_EMAIL?.trim() ||
      !!process.env.PAYWALL_BYPASS_EMAILS?.trim() ||
      !!process.env.PAYWALL_BYPASS_USER_IDS?.trim();
    body.bypassConfigured = hasBypass;
  }
  return NextResponse.json(body);
}
