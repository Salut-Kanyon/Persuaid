"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getSafeInternalPath } from "@/lib/safe-path";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const dest = getSafeInternalPath(searchParams.get("next"), "/dashboard");

    const oauthError = searchParams.get("error");
    const oauthDesc = searchParams.get("error_description");
    if (oauthError) {
      const detail = oauthDesc ? decodeURIComponent(oauthDesc.replace(/\+/g, " ")) : oauthError;
      router.replace(`/sign-in?signin=1&oauth_error=${encodeURIComponent(detail)}`);
      return;
    }

    const finish = async () => {
      const {
        data: { session: existing },
      } = await supabase.auth.getSession();
      if (existing) {
        router.replace(dest);
        return;
      }

      if (typeof window === "undefined") return;

      const href = window.location.href;
      const url = new URL(href);
      if (url.searchParams.get("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(href);
        if (error) {
          console.error("[auth/callback]", error.message);
          setMessage("Couldn’t complete sign-in.");
          router.replace(`/sign-in?signin=1&oauth_error=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace(dest);
      } else {
        setMessage("Redirecting…");
        router.replace("/sign-in?signin=1");
      }
    };

    void finish();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-near-black px-6">
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-near-black">
          <p className="text-text-muted text-sm">Signing you in…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
