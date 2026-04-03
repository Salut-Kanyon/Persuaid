"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/components/app/analytics/useAnalytics";
import { AnalyticsCard } from "@/components/app/analytics/AnalyticsCard";
import { AnalyticsChart } from "@/components/app/analytics/AnalyticsChart";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { openMarketingPricing } from "@/lib/electron-client";
import { loadMeUsageForClient } from "@/lib/me-usage";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";

type ChartRange = 7 | 30 | 90;

const ICON_CALL = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const ICON_CLOCK = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ICON_TREND = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 4 4 6-6" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7v6h-6" />
  </svg>
);
const ICON_TAG = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M3 7a4 4 0 004 4h0l6.586 6.586a2 2 0 002.828 0l3.172-3.172a2 2 0 000-2.828L13 5h0a4 4 0 00-4-4H7a4 4 0 00-4 4v2z" />
  </svg>
);

type UsagePayload = {
  plan?: unknown;
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  periodLabel: string;
  usedLabel: string;
  remainingLabel: string;
  limitLabel: string;
  error?: string;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { plan } = useEntitlements();
  const {
    loading,
    summary,
    callsOverTime,
    formatDuration,
    usesLiveListeningAnalytics,
    liveListening,
  } = useAnalytics();
  const [chartRange, setChartRange] = useState<ChartRange>(30);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchUsage = async () => {
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) {
          if (!mounted) return;
          setUsage(null);
          setUsageError("Sign in to view usage.");
          setUsageLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const result = await loadMeUsageForClient(
          supabase,
          session?.access_token,
          user.id,
          user.email ?? undefined,
          plan ?? undefined
        );
        if (!mounted) return;
        if (!result.ok) {
          setUsage(null);
          setUsageError("Could not load usage.");
          setUsageLoading(false);
          return;
        }
        setUsage(result.data);
        setUsageError(null);
        setUsageLoading(false);
      } catch {
        if (!mounted) return;
        setUsage(null);
        setUsageError("Could not load usage.");
        setUsageLoading(false);
      }
    };

    void fetchUsage();

    const onFocus = () => void fetchUsage();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(fetchUsage, 30000);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [plan]);

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="flex-shrink-0 px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Call performance and AI coaching insights
          </p>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-background-surface/40 border border-border/50 p-5 animate-pulse"
                >
                  <div className="h-3 w-20 bg-background-elevated rounded mb-3" />
                  <div className="h-8 w-16 bg-background-elevated rounded" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-6 h-80 animate-pulse" />
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-12 text-center">
              <p className="text-text-muted text-sm">Loading analytics…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = callsOverTime(chartRange);
  const callsLast7Days =
    usesLiveListeningAnalytics && liveListening
      ? liveListening.last7DaysEventCount
      : callsOverTime(7).reduce((acc, d) => acc + d.calls, 0);
  const avgCallLengthFromSessions =
    summary.totalCalls === 0 ? 0 : Math.round(summary.totalTalkTimeMinutes / summary.totalCalls);
  const usagePctExact =
    usage && usage.limitMinutes > 0 ? (usage.usedMinutes / usage.limitMinutes) * 100 : 0;
  const usagePctForBar =
    usage && usage.limitMinutes > 0
      ? Math.min(100, Math.max(0, usagePctExact > 0 && usagePctExact < 1 ? 1 : Math.round(usagePctExact)))
      : 0;
  const usagePctLabel =
    usage && usage.limitMinutes > 0
      ? usagePctExact > 0 && usagePctExact < 1
        ? "<1%"
        : `${Math.min(100, Math.max(0, Math.round(usagePctExact)))}%`
      : "—";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Call performance and AI coaching insights
          </p>
          {usesLiveListeningAnalytics && (
            <p className="text-xs text-text-dim/90 mt-2 max-w-xl">
              Summary metrics use live listening for the current month (same source as Usage below).
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Top summary cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AnalyticsCard
              label={usesLiveListeningAnalytics ? "Live sessions (month)" : "Total calls"}
              value={summary.totalCalls}
              icon={ICON_CALL}
            />
            <AnalyticsCard
              label={usesLiveListeningAnalytics ? "Live time (month)" : "Total talk time"}
              value={formatDuration(summary.totalTalkTimeMinutes)}
              icon={ICON_CLOCK}
            />
            <AnalyticsCard
              label={usesLiveListeningAnalytics ? "Sessions (last 7 days)" : "Calls (last 7 days)"}
              value={callsLast7Days}
              icon={ICON_TREND}
            />
            <AnalyticsCard
              label={usesLiveListeningAnalytics ? "Avg session (month)" : "Avg call length"}
              value={
                usesLiveListeningAnalytics && liveListening
                  ? liveListening.avgSessionLengthMinutes > 0
                    ? `${liveListening.avgSessionLengthMinutes} min`
                    : "—"
                  : avgCallLengthFromSessions
                    ? `${avgCallLengthFromSessions} min`
                    : "—"
              }
              icon={ICON_TAG}
            />
          </section>

          {/* Calls over time */}
          <section>
            <AnalyticsChart
              data={chartData}
              rangeDays={chartRange}
              onRangeChange={setChartRange}
            />
          </section>

          {/* Usage (plan) */}
          <section className="rounded-2xl bg-background-surface/60 border border-border/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-text-primary">Usage</h2>
                <p className="text-sm text-text-muted mt-0.5">
                  {usage?.periodLabel ? `${usage.periodLabel} usage` : "This month"}
                </p>
              </div>
              <div className="shrink-0 flex items-start gap-3">
                {usage && (
                  <div className="text-right">
                    <p className="text-xs text-text-dim">Used</p>
                    <p className="text-sm font-semibold text-text-primary tabular-nums">
                      {formatDuration(usage.usedMinutes)} / {formatDuration(usage.limitMinutes)}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void openMarketingPricing(router)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                    "bg-green-primary text-white hover:bg-green-dark",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                  )}
                >
                  Upgrade
                </button>
              </div>
            </div>

            {usageLoading ? (
              <div className="mt-5">
                <div className="h-2 rounded-full bg-background-elevated/40 overflow-hidden">
                  <div className="h-full w-1/3 bg-green-primary/25" />
                </div>
                <p className="mt-3 text-xs text-text-dim">Loading usage…</p>
              </div>
            ) : usageError ? (
              <p className="mt-4 text-sm text-amber-400">{usageError}</p>
            ) : usage ? (
              <div className="mt-5 space-y-3">
                <div className="h-2 rounded-full bg-background-elevated/40 overflow-hidden">
                  <div
                    className="h-full bg-green-primary"
                    style={{ width: `${usagePctForBar}%` }}
                    aria-label={`Usage ${usagePctLabel}`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-text-dim">
                    Remaining:{" "}
                    <span className="text-text-secondary tabular-nums">
                      {formatDuration(usage.remainingMinutes)}
                    </span>
                  </p>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border",
                      usagePctExact >= 100
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : usagePctExact >= 80
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-green-primary/30 bg-green-primary/10 text-green-accent"
                    )}
                  >
                    {usagePctLabel} used
                  </span>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
