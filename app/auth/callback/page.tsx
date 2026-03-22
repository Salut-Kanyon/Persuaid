"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/sign-in?signin=1");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-near-black">
      <p className="text-text-muted">Signing you in…</p>
    </div>
  );
}
