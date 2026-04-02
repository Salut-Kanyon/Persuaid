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
import { resolveEffectivePlan } from "@/lib/agency";
import { loadMeUsageForClient } from "@/lib/me-usage";

interface EntitlementsContextValue {
  plan: Plan | null;
  /** True when the user is on Pro or Team (paid or bypass). */
  canUseProFeatures: boolean;
  /**
   * True when AI coach features may be used: paid plans, or Free with monthly minutes remaining.
   * While entitlements or usage are loading, this stays true so a slow network does not false-block.
   */
  canUseAiCoach: boolean;
  /** True while monthly usage for the current user is loading (live-time gating uses this). */
  usageLoading: boolean;
  /**
   * Whether the user may start a new live call (mic/STT). False while usage loads, or when monthly minutes are exhausted for the current plan.
   */
  canStartLiveSession: boolean;
  /** Monthly live-listening minutes left (Free / paid caps); null while usage not loaded. */
  remainingLiveMinutes: number | null;
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
  /** When true, monthly live-listening allowance is used up (usage fetch succeeded; any plan). */
  const [liveMinutesExhausted, setLiveMinutesExhausted] = useState(false);
  const [remainingLiveMinutes, setRemainingLiveMinutes] = useState<number | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const loadPlanAndUsage = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPlan("free");
        setLiveMinutesExhausted(false);
        setRemainingLiveMinutes(null);
        return;
      }

      const user = session.user;

      let nextPlan: Plan = "free";
      const entRes = await fetch("/api/me/entitlements", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (entRes.ok) {
        const data = (await entRes.json()) as { plan?: Plan };
        nextPlan = data.plan ?? "free";
      } else {
        const resolved = await resolveEffectivePlan(supabase, user.id, user.email ?? undefined);
        nextPlan = resolved.plan;
      }
      setPlan(nextPlan);

      const usageResult = await loadMeUsageForClient(
        supabase,
        session.access_token,
        user.id,
        user.email ?? undefined,
        nextPlan
      );
      if (usageResult.ok) {
        const remaining = usageResult.data.remainingMinutes;
        setRemainingLiveMinutes(remaining);
        setLiveMinutesExhausted(Number.isFinite(remaining) && remaining <= 0);
      } else {
        setRemainingLiveMinutes(null);
        setLiveMinutesExhausted(false);
      }
    } catch {
      setPlan("free");
      setLiveMinutesExhausted(false);
      setRemainingLiveMinutes(null);
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
    isLoading || usageLoading || !liveMinutesExhausted;

  const canStartLiveSession = !usageLoading && !liveMinutesExhausted;

  const value: EntitlementsContextValue = {
    plan: effectivePlan,
    canUseProFeatures: paid || isLoading,
    canUseAiCoach,
    usageLoading,
    canStartLiveSession,
    remainingLiveMinutes,
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
        plan={effectivePlan}
      />
    </EntitlementsContext.Provider>
  );
}
