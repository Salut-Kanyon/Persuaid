"use client";

import { useState } from "react";
import { useAnalytics } from "@/components/app/analytics/useAnalytics";
import { AnalyticsCard } from "@/components/app/analytics/AnalyticsCard";
import { AnalyticsChart } from "@/components/app/analytics/AnalyticsChart";
import { CallInsightsPanel } from "@/components/app/analytics/CallInsightsPanel";

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

export default function AnalyticsPage() {
  const {
    loading,
    summary,
    callsOverTime,
    callInsights,
    formatDuration,
  } = useAnalytics();
  const [chartRange, setChartRange] = useState<ChartRange>(30);

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
  const callsLast7Days = callsOverTime(7).reduce((acc, d) => acc + d.calls, 0);
  const avgCallLength =
    summary.totalCalls === 0 ? 0 : Math.round(summary.totalTalkTimeMinutes / summary.totalCalls);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Call performance and AI coaching insights
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Top summary cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AnalyticsCard
              label="Total calls"
              value={summary.totalCalls}
              icon={ICON_CALL}
            />
            <AnalyticsCard
              label="Total talk time"
              value={formatDuration(summary.totalTalkTimeMinutes)}
              icon={ICON_CLOCK}
            />
            <AnalyticsCard
              label="Calls (last 7 days)"
              value={callsLast7Days}
              icon={ICON_TREND}
            />
            <AnalyticsCard
              label="Avg call length"
              value={avgCallLength ? `${avgCallLength} min` : "—"}
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

          {/* Conversation insights */}
          <section className="grid grid-cols-1 gap-8">
            <CallInsightsPanel insights={callInsights} />
          </section>
        </div>
      </div>
    </div>
  );
}
