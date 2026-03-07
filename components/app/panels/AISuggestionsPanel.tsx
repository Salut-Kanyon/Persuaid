"use client";

import { useSession } from "@/components/app/contexts/SessionContext";
import type { Suggestion } from "@/components/app/contexts/SessionContext";

function getTypeIcon(type: string) {
  switch (type) {
    case "objection":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case "next-step":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
    case "talking-point":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-500/10 border-red-500/15 text-red-400/90";
    case "medium":
      return "bg-yellow-500/10 border-yellow-500/15 text-yellow-400/90";
    default:
      return "bg-text-dim/8 border-text-dim/15 text-text-dim/70";
  }
}

export function AISuggestionsPanel() {
  const { suggestions } = useSession();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-text-muted">
              AI suggestions will appear here as the conversation continues.
            </p>
          </div>
        ) : (
          suggestions.map((suggestion: Suggestion, index: number) => (
            <div
              key={suggestion.id}
              className={
                index === 0 && suggestion.priority === "high"
                  ? "bg-green-primary/6 border border-green-primary/15 rounded-2xl p-5 relative overflow-hidden group hover:bg-green-primary/10 hover:border-green-primary/20 transition-all duration-300 shadow-[0_6px_20px_rgba(16,185,129,0.08)]"
                  : "bg-background-elevated/35 border border-border/18 rounded-2xl p-5 hover:border-border/25 hover:bg-background-elevated/45 transition-all duration-300 shadow-sm"
              }
            >
              {index === 0 && suggestion.priority === "high" && (
                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-green-primary/50 to-green-accent/35 rounded-l-2xl" />
              )}
              <div className="flex items-start gap-3.5">
                <div
                  className={
                    index === 0 && suggestion.priority === "high"
                      ? "w-7 h-7 rounded-xl bg-green-primary/12 flex items-center justify-center flex-shrink-0 mt-0.5 text-green-primary shadow-sm"
                      : "w-7 h-7 rounded-xl bg-background-surface/35 border border-border/18 flex items-center justify-center flex-shrink-0 mt-0.5 text-text-dim/70 shadow-sm"
                  }
                >
                  {getTypeIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="text-xs font-medium text-text-primary">{suggestion.title}</div>
                    <div
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${getPriorityColor(suggestion.priority)}`}
                    >
                      {suggestion.priority}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary/85 leading-relaxed">{suggestion.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
