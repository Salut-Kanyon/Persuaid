"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getSafeInternalPath } from "@/lib/safe-path";

function signInUrl(returnToPath: string) {
  const next = getSafeInternalPath(returnToPath, "/dashboard");
  return `/sign-in?signin=1&next=${encodeURIComponent(next)}`;
}

/**
 * Dashboard access: requires a normal Supabase session (email, OAuth, etc.).
 * Anonymous sign-in is not used.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const resolvedRef = useRef(false);
  const bootstrapPendingRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    resolvedRef.current = false;
    bootstrapPendingRef.current = true;

    const resolve = (ok: boolean) => {
      if (!cancelled) {
        resolvedRef.current = true;
        setReady(ok);
      }
    };

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          resolve(true);
          return;
        }
        router.replace(signInUrl(pathnameRef.current));
        resolve(false);
      } catch {
        if (!cancelled) router.replace(signInUrl(pathnameRef.current));
      } finally {
        if (!cancelled) bootstrapPendingRef.current = false;
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        resolve(true);
        return;
      }
      if (bootstrapPendingRef.current) return;
      if (event === "SIGNED_OUT" || !session) {
        const p =
          typeof window !== "undefined" ? window.location.pathname : "/dashboard";
        router.replace(signInUrl(p));
      }
    });

    const t = setTimeout(() => {
      if (!cancelled && !resolvedRef.current) {
        router.replace(signInUrl(pathnameRef.current));
      }
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
