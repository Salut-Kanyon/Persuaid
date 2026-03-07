"use client";

import { useState, useEffect } from "react";

interface Suggestion {
  id: string;
  type: "objection" | "next-step" | "talking-point" | "question";
  title: string;
  text: string;
  priority: "high" | "medium" | "low";
}

const initialSuggestions: Suggestion[] = [
  {
    id: "1",
    type: "objection",
    title: "Objection Handling",
    text: "Address her concern about finding the right fit. Ask: 'What specific challenges have you faced with previous solutions?'",
    priority: "high",
  },
  {
    id: "2",
    type: "next-step",
    title: "Next Step",
    text: "Share a relevant case study that matches her industry. Mention ROI metrics.",
    priority: "medium",
  },
  {
    id: "3",
    type: "talking-point",
    title: "Talking Point",
    text: "Emphasize the real-time guidance feature. This addresses her need for immediate support.",
    priority: "medium",
  },
];

export function AISuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const newSuggestion: Suggestion = {
          id: Date.now().toString(),
          type: ["objection", "next-step", "talking-point", "question"][Math.floor(Math.random() * 4)] as any,
          title: ["Objection Handling", "Next Step", "Talking Point", "Discovery Question"][Math.floor(Math.random() * 4)],
          text: "Consider asking about their current workflow to better understand their needs.",
          priority: ["high", "medium", "low"][Math.floor(Math.random() * 3)] as any,
        };
        setSuggestions((prev) => [newSuggestion, ...prev].slice(0, 5));
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getTypeIcon = (type: string) => {
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
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      default:
        return "bg-text-dim/20 border-text-dim/30 text-text-dim";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-surface">
      {/* Panel Header */}
      <div className="h-14 px-5 border-b border-border/50 flex items-center justify-between bg-background-elevated/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-green-primary/20 border border-green-primary/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-text-primary tracking-tight">AI Suggestions</h2>
        </div>
        <button className="p-1.5 hover:bg-background-surface rounded-lg transition-colors text-text-dim hover:text-green-accent">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={index === 0 && suggestion.priority === "high"
              ? "bg-green-primary/10 border border-green-primary/30 rounded-lg p-4 relative overflow-hidden group hover:bg-green-primary/15 transition-all duration-300"
              : "bg-background-elevated border border-border/50 rounded-lg p-4 hover:border-border transition-all duration-300"
            }
          >
            {index === 0 && suggestion.priority === "high" && (
              <div className="absolute top-0 left-0 w-1 h-full bg-green-primary"></div>
            )}
            <div className="flex items-start gap-3">
              <div className={index === 0 && suggestion.priority === "high"
                ? "w-6 h-6 rounded bg-green-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-green-primary"
                : "w-6 h-6 rounded bg-background-surface border border-border/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-text-dim"
              }>
                {getTypeIcon(suggestion.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-bold text-text-primary">{suggestion.title}</div>
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{suggestion.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
