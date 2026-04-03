"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-fetch";

function RedeemInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link. Use the full URL from your invite (it should include ?token=…).");
      return;
    }

    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Sign in to redeem this invite.");
        }
        return;
      }

      const res = await fetchApi("/api/agency/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string; alreadyMember?: boolean };
      if (!cancelled) {
        if (res.ok && data.ok) {
          setStatus("ok");
          setMessage(data.alreadyMember ? "You’re already in this agency." : "You’ve joined the agency.");
          setTimeout(() => router.replace("/dashboard"), 1500);
        } else {
          setStatus("error");
          setMessage(data.error || "Could not redeem invite.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background-near-black px-4">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-border/50 bg-background-surface/60 p-8 text-center",
          "backdrop-blur-xl"
        )}
      >
        <h1 className="text-lg font-semibold text-text-primary">Agency invite</h1>
        {status === "loading" && <p className="mt-3 text-sm text-text-muted">Redeeming…</p>}
        {status !== "loading" && (
          <p
            className={cn(
              "mt-3 text-sm",
              status === "ok" ? "text-green-accent" : "text-amber-400"
            )}
          >
            {message}
          </p>
        )}
        {status === "error" && (
          <div className="mt-6 flex flex-col gap-2">
            <a
              href="/sign-in"
              className="inline-flex justify-center rounded-xl bg-green-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-dark"
            >
              Sign in
            </a>
            <a href="/dashboard" className="text-sm text-text-muted hover:text-text-primary">
              Back to dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RedeemInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-background-near-black px-4">
          <p className="text-sm text-text-muted">Loading…</p>
        </div>
      }
    >
      <RedeemInviteInner />
    </Suspense>
  );
}
