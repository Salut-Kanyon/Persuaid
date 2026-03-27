import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateInviteToken, hashInviteToken } from "@/lib/agency";
import { getPublicOriginFromRequest } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
    error: userErr,
  } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  let body: { maxUses?: number; expiresAt?: string | null };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const maxUses = Math.max(1, Math.min(500, Number(body.maxUses) || 1));
  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt.trim()
      ? new Date(body.expiresAt).toISOString()
      : null;

  const { data: agency, error: agencyErr } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (agencyErr || !agency) {
    return NextResponse.json(
      { error: "Only an agency owner can create invites." },
      { status: 403 }
    );
  }

  const raw = generateInviteToken();
  const tokenHash = hashInviteToken(raw);

  const { error: insErr } = await supabase.from("agency_invites").insert({
    agency_id: agency.id,
    token_hash: tokenHash,
    created_by_user_id: user.id,
    max_uses: maxUses,
    uses: 0,
    expires_at: expiresAt,
  });

  if (insErr) {
    console.error("[agency/invites] insert:", insErr);
    return NextResponse.json({ error: "Could not create invite." }, { status: 500 });
  }

  const base = getPublicOriginFromRequest(req);
  // Query param so /redeem works with Next static export (desktop) — dynamic /redeem/[token] is not exported.
  const redeemUrl = `${base}/redeem?token=${encodeURIComponent(raw)}`;

  return NextResponse.json({ redeemUrl, maxUses, expiresAt });
}
