"use client";

import { cn } from "@/lib/utils";
import type { AICoachingInsights } from "@/lib/analytics";

interface AICoachingPanelProps {
  insights: AICoachingInsights;
  className?: string;
}

export function AICoachingPanel({ insights, className }: AICoachingPanelProps) {
  const {
    whatToSayCount,
    followUpQuestionsCount,
    averageResponseLength,
    topSuggestedPhrases,
  } = insights;

  return (
    <div
      className={cn(
        "rounded-2xl bg-background-surface/60 border border-border/50 p-6",
        className
      )}
    >
      <h2 className="text-sm font-semibold text-text-primary mb-4">AI coaching insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
            &quot;What to say&quot; responses
          </p>
          <p className="text-lg font-semibold text-green-accent tabular-nums">
            {whatToSayCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
            Follow-up questions generated
          </p>
          <p className="text-lg font-semibold text-green-accent tabular-nums">
            {followUpQuestionsCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-1">
            Avg AI response length
          </p>
          <p className="text-lg font-semibold text-text-primary">
            {averageResponseLength != null ? `${averageResponseLength} chars` : "—"}
          </p>
          {averageResponseLength == null && (
            <p className="text-xs text-text-dim mt-0.5">Requires response logging</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
            Top suggested phrases
          </p>
          {topSuggestedPhrases.length === 0 ? (
            <p className="text-sm text-text-muted">—</p>
          ) : (
            <ul className="space-y-1.5">
              {topSuggestedPhrases.map((phrase, i) => (
                <li key={i} className="text-sm text-text-secondary truncate">
                  {phrase}
                </li>
              ))}
            </ul>
          )}
          {topSuggestedPhrases.length === 0 && (
            <p className="text-xs text-text-dim mt-0.5">Requires phrase tracking</p>
          )}
        </div>
      </div>
    </div>
  );
}
