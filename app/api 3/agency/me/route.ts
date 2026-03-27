import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  // Use limit(1) — .maybeSingle() errors if 0 rows OR multiple rows, and errors were ignored before.
  const {
    data: ownerAgencies,
    error: ownerAgencyErr,
  } = await supabase
    .from("agencies")
    .select("id, name, seats_total, owner_user_id")
    .eq("owner_user_id", user.id)
    .limit(1);

  if (ownerAgencyErr) {
    console.error("[agency/me] agencies (owner):", ownerAgencyErr);
    return NextResponse.json(
      {
        role: null,
        agency: null,
        invites: [],
        error:
          "Could not load agency. Apply migrations through 007 (RLS recursion fix) and ensure agencies tables exist.",
        detail: ownerAgencyErr.message,
      },
      { status: 200 }
    );
  }

  const agencyRow = ownerAgencies?.[0] ?? null;

  if (agencyRow) {
    const { count: seatsUsed } = await supabase
      .from("agency_members")
      .select("user_id", { count: "exact", head: true })
      .eq("agency_id", agencyRow.id);

    const { data: invites } = await supabase
      .from("agency_invites")
      .select("id, max_uses, uses, expires_at, created_at")
      .eq("agency_id", agencyRow.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      role: "owner" as const,
      agency: {
        id: agencyRow.id,
        name: agencyRow.name,
        seatsTotal: agencyRow.seats_total,
        seatsUsed: seatsUsed ?? 0,
      },
      invites: invites ?? [],
    });
  }

  const { data: membershipRows, error: memErr } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .limit(1);

  if (memErr) {
    console.error("[agency/me] agency_members:", memErr);
    return NextResponse.json(
      {
        role: null,
        agency: null,
        invites: [],
        error: "Could not load membership.",
        detail: memErr.message,
      },
      { status: 200 }
    );
  }

  const membership = membershipRows?.[0] ?? null;

  if (!membership) {
    return NextResponse.json({ role: null, agency: null, invites: [] });
  }

  const { data: agencyRows, error: agencyErr } = await supabase
    .from("agencies")
    .select("id, name, seats_total")
    .eq("id", membership.agency_id)
    .limit(1);

  if (agencyErr) {
    console.error("[agency/me] agencies (member):", agencyErr);
    return NextResponse.json(
      {
        role: null,
        agency: null,
        invites: [],
        error: "Could not load agency for membership.",
        detail: agencyErr.message,
      },
      { status: 200 }
    );
  }

  const agency = agencyRows?.[0] ?? null;

  const { count: seatsUsed } = await supabase
    .from("agency_members")
    .select("user_id", { count: "exact", head: true })
    .eq("agency_id", membership.agency_id);

  return NextResponse.json({
    role: membership.role === "owner" ? ("owner" as const) : ("member" as const),
    agency: agency
      ? {
          id: agency.id,
          name: agency.name,
          seatsTotal: agency.seats_total,
          seatsUsed: seatsUsed ?? 0,
        }
      : null,
    invites: [],
  });
}
