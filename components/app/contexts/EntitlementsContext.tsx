"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import type { Plan } from "@/lib/entitlements";

interface EntitlementsContextValue {
  plan: Plan | null;
  /** True when user has Pro or Team (bypass or subscription). Use this for gating so coach and follow-ups stay in sync. */
  canUseProFeatures: boolean;
  isLoading: boolean;
  /** Show the upgrade modal (feature is Pro-only). */
  openUpgradeModal: () => void;
}

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function useEntitlements(): EntitlementsContextValue {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) {
    throw new Error("useEntitlements must be used within EntitlementsProvider");
  }
  return ctx;
}

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const fetchEntitlements = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPlan("free");
        return;
      }
      const res = await fetch("/api/me/entitlements", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { plan?: Plan };
        setPlan(data.plan ?? "free");
      } else {
        setPlan("free");
      }
    } catch {
      setPlan("free");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchEntitlements().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [fetchEntitlements]);

  // Refetch when auth state changes so bypass works even if initial fetch ran before session was ready
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        fetchEntitlements();
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchEntitlements]);

  const openUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(true);
  }, []);

  const effectivePlan = plan ?? "free";
  // While loading, allow access so bypassed users don't see paywall if the request is slow
  const value: EntitlementsContextValue = {
    plan: effectivePlan,
    canUseProFeatures: effectivePlan === "pro" || effectivePlan === "team" || isLoading,
    isLoading,
    openUpgradeModal,
  };

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </EntitlementsContext.Provider>
  );
}
