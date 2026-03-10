"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import type { CallsOverTimeEntry } from "@/lib/analytics";

type RangeDays = 7 | 30 | 90;

interface AnalyticsChartProps {
  data: CallsOverTimeEntry[];
  rangeDays: RangeDays;
  onRangeChange: (days: RangeDays) => void;
  className?: string;
}

const RANGES: { days: RangeDays; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export function AnalyticsChart({
  data,
  rangeDays,
  onRangeChange,
  className,
}: AnalyticsChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      })),
    [data]
  );

  const maxCalls = Math.max(1, ...chartData.map((d) => d.calls));

  return (
    <div
      className={cn(
        "rounded-2xl bg-background-surface/60 border border-border/50 p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-sm font-semibold text-text-primary">Calls over time</h2>
        <div className="flex rounded-xl bg-background-elevated/50 border border-border/50 p-1">
          {RANGES.map(({ days, label }) => (
            <button
              key={days}
              type="button"
              onClick={() => onRangeChange(days)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                rangeDays === days
                  ? "bg-green-primary/20 text-green-accent border border-green-primary/30"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-dim text-sm">
          No call data in this range
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green-primary, #10b981)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--green-primary, #10b981)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--text-dim)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, maxCalls]}
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--text-dim)" }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={(value) => [value ?? 0, "Calls"]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
