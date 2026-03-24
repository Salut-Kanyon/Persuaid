"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Dashboard access: uses Supabase anonymous auth when there is no session so RLS and APIs still get a JWT.
 * Enable "Anonymous sign-ins" in Supabase → Authentication → Providers.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const signedInAtRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);
  /** While true, ignore null-session auth events so INITIAL_SESSION does not race ahead of signInAnonymously(). */
  const bootstrapPendingRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    resolvedRef.current = false;
    bootstrapPendingRef.current = true;
    const resolve = (readyState: boolean) => {
      if (!cancelled) {
        resolvedRef.current = true;
        setReady(readyState);
      }
    };

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          signedInAtRef.current = Date.now();
          resolve(true);
          return;
        }
        const { data, error } = await supabase.auth.signInAnonymously();
        if (cancelled) return;
        if (error || !data.session) {
          console.warn("[AuthGuard] Anonymous sign-in failed:", error?.message);
          router.replace("/sign-in?guest=1");
          return;
        }
        signedInAtRef.current = Date.now();
        resolve(true);
      } catch {
        if (!cancelled) router.replace("/");
      } finally {
        if (!cancelled) bootstrapPendingRef.current = false;
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        signedInAtRef.current = Date.now();
        resolve(true);
        return;
      }
      if (bootstrapPendingRef.current) return;
      const graceMs = 5000;
      const signedInAt = signedInAtRef.current;
      const withinGrace = signedInAt && Date.now() - signedInAt < graceMs;
      if (event === "SIGNED_OUT" || !withinGrace) {
        router.replace("/");
      }
    });

    const t = setTimeout(() => {
      if (!cancelled && !resolvedRef.current) router.replace("/");
    }, 12000);

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
