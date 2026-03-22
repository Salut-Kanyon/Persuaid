"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const signedInAtRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    resolvedRef.current = false;
    const resolve = (readyState: boolean) => {
      if (!cancelled) {
        resolvedRef.current = true;
        setReady(readyState);
      }
    };
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          router.replace("/sign-in?signin=1");
          return;
        }
        signedInAtRef.current = Date.now();
        resolve(true);
      })
      .catch(() => router.replace("/sign-in?signin=1"));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        signedInAtRef.current = Date.now();
        resolve(true);
        return;
      }
      // Session null: only redirect if it's an explicit sign-out, or we're past the grace period.
      // Token refresh can briefly fire with null; ignore for ~5s after we had a session.
      const graceMs = 5000;
      const signedInAt = signedInAtRef.current;
      const withinGrace = signedInAt && Date.now() - signedInAt < graceMs;
      if (event === "SIGNED_OUT" || !withinGrace) {
        router.replace("/sign-in?signin=1");
      }
    });
    // Fallback: if getSession hangs (e.g. desktop app, network), redirect after 6s
    const t = setTimeout(() => {
      if (!cancelled && !resolvedRef.current) router.replace("/sign-in?signin=1");
    }, 6000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      subscription.unsubscribe();
    };
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
