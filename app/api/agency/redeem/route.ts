import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeInviteToken } from "@/lib/agency";

export const dynamic = "force-dynamic";

const RPC_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Invalid or expired session",
  malformed_token: "Malformed invite link. Copy the full URL from a new invite.",
  invalid_invite:
    "Invalid or expired invite. Ask the owner for a new link, and open it on the same app URL they use (same Supabase project).",
  expired: "This invite has expired.",
  no_uses_left: "This invite has no uses left.",
  agency_not_found: "Agency not found.",
  no_seats: "This agency has no seats left.",
  other_agency: "You are already part of another agency. Leave it before joining a new one.",
};

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

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body.token === "string" ? body.token : "";
  const normalized = normalizeInviteToken(raw);
  if (!normalized) {
    return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  }

  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    return NextResponse.json(
      { error: "Malformed invite link. Copy the full URL from a new invite." },
      { status: 400 }
    );
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc("redeem_agency_invite", {
    p_token: normalized,
  });

  if (rpcErr) {
    console.error("[agency/redeem] rpc:", rpcErr);
    const hint =
      rpcErr.message?.includes("function") && rpcErr.message?.includes("does not exist")
        ? " Run migration 008_agency_redeem_rpc.sql in Supabase."
        : "";
    return NextResponse.json(
      {
        error: `Could not redeem invite.${hint || " Try again or contact support."}`,
      },
      { status: 503 }
    );
  }

  const r = rpcData as {
    ok?: boolean;
    error?: string;
    agency_id?: string;
    already_member?: boolean;
  } | null;

  if (!r || typeof r !== "object") {
    return NextResponse.json({ error: "Unexpected response from server." }, { status: 500 });
  }

  if (r.ok === true && r.agency_id) {
    return NextResponse.json({
      ok: true,
      agencyId: r.agency_id,
      alreadyMember: Boolean(r.already_member),
    });
  }

  const code = typeof r.error === "string" ? r.error : "invalid_invite";
  const message = RPC_ERROR_MESSAGES[code] ?? RPC_ERROR_MESSAGES.invalid_invite;
  const httpStatus = code === "not_authenticated" ? 401 : 400;
  return NextResponse.json({ error: message }, { status: httpStatus });
}
