"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface AnalyzableSession {
  id: string;
  title: string | null;
  started_at: string;
  transcript_full: string | null;
  analysis: string | null;
}

interface CoachingInsight {
  type: "strength" | "improve" | "moment" | "next_step";
  title: string;
  text: string;
}

function parseAnalysis(analysis: string | null): CoachingInsight[] | null {
  if (!analysis?.trim()) return null;
  try {
    const parsed = JSON.parse(analysis);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (x: unknown): x is CoachingInsight =>
        x != null &&
        typeof x === "object" &&
        "type" in x &&
        "title" in x &&
        "text" in x &&
        ["strength", "improve", "moment", "next_step"].includes(String((x as CoachingInsight).type))
    ) as CoachingInsight[];
  } catch {
    return null;
  }
}

function getInsightIcon(type: CoachingInsight["type"]) {
  switch (type) {
    case "strength":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case "improve":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "moment":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    case "next_step":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
  }
}

function getInsightStyles(_type: CoachingInsight["type"]) {
  return "bg-green-primary/10 border-green-primary/20 text-green-accent";
}

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");
  const [sessions, setSessions] = useState<AnalyzableSession[]>([]);
  const [selected, setSelected] = useState<AnalyzableSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, started_at, transcript_full, analysis")
      .not("transcript_full", "is", null)
      .order("started_at", { ascending: false });
    if (!error) setSessions((data as AnalyzableSession[]) ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchSessions();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchSessions]);

  useEffect(() => {
    if (!sessionIdFromUrl || sessions.length === 0) return;
    const found = sessions.find((s) => s.id === sessionIdFromUrl);
    if (found) setSelected(found);
  }, [sessionIdFromUrl, sessions]);

  const generateAnalysis = useCallback(async (s: AnalyzableSession) => {
    if (!s.transcript_full) return;
    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        return;
      }
      const res = await fetch("/api/ai/analyze-call", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transcript: s.transcript_full }),
      });
      const json = (await res.json()) as { analysis?: string };
      if (res.ok && json.analysis) {
        await supabase.from("sessions").update({ analysis: json.analysis }).eq("id", s.id);
        setSelected((prev) => (prev?.id === s.id ? { ...prev, analysis: json.analysis! } : prev));
        setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, analysis: json.analysis! } : x)));
      }
    } finally {
      setGenerating(false);
    }
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="flex-shrink-0 px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold text-text-primary">AI Coach</h1>
          <p className="text-sm text-text-muted mt-0.5">Coaching feedback on your calls</p>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6 flex items-center justify-center">
          <p className="text-text-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">AI Coach</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Review your call transcript and coaching feedback
        </p>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* List of saved calls */}
        <aside className="w-64 flex-shrink-0 border-r border-border overflow-y-auto bg-background-surface/30">
          <div className="p-3">
            <p className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
              Saved calls
            </p>
            {sessions.length === 0 ? (
              <p className="text-sm text-text-muted">No calls saved for analysis yet.</p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selected?.id === s.id
                          ? "bg-green-primary/20 text-green-accent border border-green-primary/30"
                          : "text-text-secondary hover:bg-background-surface/60 border border-transparent"
                      }`}
                    >
                      <span className="block truncate font-medium">
                        {s.title || "Untitled call"}
                      </span>
                      <span className="block truncate text-xs text-text-dim mt-0.5">
                        {formatDate(s.started_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Transcript + Analysis */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {!selected ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <p className="text-text-muted">
                {sessions.length === 0
                  ? "Save a call from your Live Session using “Save & analyze” to see the transcript and coaching feedback here."
                  : "Select a call from the list to view the transcript and coaching analysis."}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h2 className="text-sm font-semibold text-text-primary mb-2">Transcript</h2>
                <div className="rounded-xl bg-background-surface/60 border border-border/50 p-4 text-sm text-text-secondary whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                  {selected.transcript_full || "—"}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-text-primary mb-3">Coaching feedback</h2>
                {selected.analysis ? (
                  (() => {
                    const insights = parseAnalysis(selected.analysis);
                    if (insights && insights.length > 0) {
                      return (
                        <div className="space-y-3">
                          {insights.map((insight, i) => (
                            <div
                              key={i}
                              className={`rounded-2xl border p-5 transition-all duration-300 shadow-sm hover:shadow-md ${getInsightStyles(insight.type)}`}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-xl border border-current/20 flex items-center justify-center flex-shrink-0 mt-0.5 bg-black/10">
                                  {getInsightIcon(insight.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1.5">
                                    {insight.type.replace("_", " ")}
                                  </div>
                                  <div className="text-sm font-medium text-text-primary mb-1">
                                    {insight.title}
                                  </div>
                                  <p className="text-sm text-text-secondary/90 leading-relaxed">
                                    {insight.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-xl bg-background-surface/60 border border-border/50 p-5 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {selected.analysis}
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-xl bg-background-surface/60 border border-border/50 p-5">
                    <p className="text-text-muted text-sm mb-3">
                      No feedback yet. Generate coaching insights from this transcript.
                    </p>
                    <button
                      type="button"
                      onClick={() => generateAnalysis(selected)}
                      disabled={generating}
                      className="px-4 py-2.5 rounded-xl bg-green-primary/20 border border-green-primary/40 text-green-accent text-sm font-medium hover:bg-green-primary/30 transition-colors disabled:opacity-50"
                    >
                      {generating ? "Generating…" : "Generate coaching feedback"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
