"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
        return;
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/sign-in");
      else setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-near-black">
        <div className="text-text-muted">Loading…</div>
      </div>
    );
  }
  return <>{children}</>;
}
