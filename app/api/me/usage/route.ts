import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveEffectivePlan } from "@/lib/agency";
import {
  currentMonthBoundsUtc,
  formatUsageMinutes,
  transcriptionLimitMinutes,
} from "@/lib/usage";

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

  const { plan } = await resolveEffectivePlan(supabase, user.id, user.email ?? undefined);
  const limitMinutes = transcriptionLimitMinutes(plan);
  const { startIso, endIso } = currentMonthBoundsUtc();

  const { data: rows, error: qErr } = await supabase
    .from("sessions")
    .select("duration_minutes")
    .eq("user_id", user.id)
    .gte("started_at", startIso)
    .lt("started_at", endIso);

  if (qErr) {
    console.error("usage sessions query:", qErr);
    return NextResponse.json(
      { error: "Could not load usage", plan, limitMinutes },
      { status: 500 }
    );
  }

  const usedMinutes = (rows ?? []).reduce((acc, r) => acc + (Number(r.duration_minutes) || 0), 0);
  const remainingMinutes = Math.max(0, limitMinutes - usedMinutes);

  const monthLabel = new Date(startIso).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return NextResponse.json(
    {
      plan,
      limitMinutes,
      usedMinutes,
      remainingMinutes,
      periodLabel: monthLabel,
      usedLabel: formatUsageMinutes(usedMinutes),
      remainingLabel: formatUsageMinutes(remainingMinutes),
      limitLabel: formatUsageMinutes(limitMinutes),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
