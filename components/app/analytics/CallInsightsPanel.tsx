"use client";

import { cn } from "@/lib/utils";
import type { CallInsights } from "@/lib/analytics";

interface CallInsightsPanelProps {
  insights: CallInsights;
  className?: string;
}

function formatMinutes(m: number): string {
  if (m < 1) return "< 1 min";
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return min ? `${h}h ${min}m` : `${h}h`;
}

export function CallInsightsPanel({ insights, className }: CallInsightsPanelProps) {
  const {
    averageCallLengthMinutes,
    talkVsListenRatio,
    objectionKeywords,
    mostUsedScripts,
  } = insights;

  return (
    <div
      className={cn(
        "rounded-2xl bg-background-surface/60 border border-border/50 p-6",
        className
      )}
    >
      <h2 className="text-sm font-semibold text-text-primary mb-4">Conversation insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
            Average call length
          </p>
          <p className="text-lg font-semibold text-text-primary">
            {formatMinutes(averageCallLengthMinutes)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
            Talk vs listen ratio
          </p>
          <p className="text-lg font-semibold text-text-primary">
            {talkVsListenRatio ?? "—"}
          </p>
          {!talkVsListenRatio && (
            <p className="text-xs text-text-dim mt-0.5">Requires transcript analysis</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
            Most used scripts
          </p>
          {mostUsedScripts.length === 0 ? (
            <p className="text-sm text-text-muted">No scripts used yet</p>
          ) : (
            <ul className="space-y-1.5">
              {mostUsedScripts.map(({ scriptTitle, count }) => (
                <li
                  key={scriptTitle}
                  className="flex items-center justify-between text-sm text-text-secondary"
                >
                  <span className="truncate mr-2">{scriptTitle}</span>
                  <span className="text-text-dim font-medium tabular-nums">{count} calls</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
            Common objection keywords
          </p>
          {objectionKeywords.length === 0 ? (
            <p className="text-sm text-text-muted">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {objectionKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          {objectionKeywords.length === 0 && (
            <p className="text-xs text-text-dim mt-0.5">Requires transcript analysis</p>
          )}
        </div>
      </div>
    </div>
  );
}
