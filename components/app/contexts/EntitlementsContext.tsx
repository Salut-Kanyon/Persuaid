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
  /** True when the user is on Pro or Team (paid or bypass). */
  canUseProFeatures: boolean;
  /**
   * True when AI coach features may be used: paid plans, or Free with monthly minutes remaining.
   * While entitlements or usage are loading, this stays true so a slow network does not false-block.
   */
  canUseAiCoach: boolean;
  isLoading: boolean;
  openUpgradeModal: () => void;
  /** Refetch usage (e.g. after tab focus) so free-tier limits stay accurate. */
  refetchUsage: () => void;
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
  const [usageLoading, setUsageLoading] = useState(true);
  /** When true, Free plan has no AI minutes left this month (usage fetch succeeded). */
  const [freeMinutesExhausted, setFreeMinutesExhausted] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const loadPlanAndUsage = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPlan("free");
        setFreeMinutesExhausted(false);
        return;
      }

      const [entRes, usageRes] = await Promise.all([
        fetch("/api/me/entitlements", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch("/api/me/usage", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      let nextPlan: Plan = "free";
      if (entRes.ok) {
        const data = (await entRes.json()) as { plan?: Plan };
        nextPlan = data.plan ?? "free";
      }
      setPlan(nextPlan);

      if (usageRes.ok) {
        const u = (await usageRes.json()) as { remainingMinutes?: number };
        const remaining = Number(u.remainingMinutes);
        setFreeMinutesExhausted(nextPlan === "free" && Number.isFinite(remaining) && remaining <= 0);
      } else {
        setFreeMinutesExhausted(false);
      }
    } catch {
      setPlan("free");
      setFreeMinutesExhausted(false);
    } finally {
      setIsLoading(false);
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setUsageLoading(true);
    loadPlanAndUsage().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [loadPlanAndUsage]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setIsLoading(true);
        setUsageLoading(true);
        loadPlanAndUsage();
      }
    });
    return () => subscription.unsubscribe();
  }, [loadPlanAndUsage]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void loadPlanAndUsage();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadPlanAndUsage]);

  const openUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(true);
  }, []);

  const effectivePlan = plan ?? "free";
  const paid = effectivePlan === "pro" || effectivePlan === "team";
  const canUseAiCoach =
    isLoading ||
    usageLoading ||
    paid ||
    (effectivePlan === "free" && !freeMinutesExhausted);

  const value: EntitlementsContextValue = {
    plan: effectivePlan,
    canUseProFeatures: paid || isLoading,
    canUseAiCoach,
    isLoading,
    openUpgradeModal,
    refetchUsage: loadPlanAndUsage,
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
