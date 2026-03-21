"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useEntitlements } from "@/components/app/contexts/EntitlementsContext";

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

function getInsightStyles(type: CoachingInsight["type"]) {
  switch (type) {
    case "strength":
    case "next_step":
      return "bg-green-primary/10 border-green-primary/20 text-green-700 dark:text-green-400";
    case "improve":
      return "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-400";
    case "moment":
      return "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300";
    default:
      return "bg-green-primary/10 border-green-primary/20 text-green-700 dark:text-green-400";
  }
}

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");
  const { canUseProFeatures, openUpgradeModal } = useEntitlements();
  const [sessions, setSessions] = useState<AnalyzableSession[]>([]);
  const [selected, setSelected] = useState<AnalyzableSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<AnalyzableSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionToRename, setSessionToRename] = useState<AnalyzableSession | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);

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
    setGenerateError(null);
    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        setGenerateError("Sign in to generate analysis.");
        return;
      }
      const res = await fetch("/api/ai/analyze-call", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transcript: s.transcript_full }),
      });
      const json = (await res.json()) as { analysis?: string; error?: string };
      if (!res.ok) {
        setGenerateError(json.error || "Analysis failed. Try again.");
        return;
      }
      if (json.analysis) {
        await supabase.from("sessions").update({ analysis: json.analysis }).eq("id", s.id);
        setSelected((prev) => (prev?.id === s.id ? { ...prev, analysis: json.analysis! } : prev));
        setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, analysis: json.analysis! } : x)));
      } else {
        setGenerateError("No analysis returned. Try again.");
      }
    } catch {
      setGenerateError("Something went wrong. Try again.");
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

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    setSessionToDelete(null);
    setDeletingId(sessionId);
    try {
      const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
      if (!error) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (selected?.id === sessionId) setSelected(null);
      }
    } finally {
      setDeletingId(null);
    }
  }, [selected?.id]);

  useEffect(() => {
    if (sessionToRename) setRenameValue(sessionToRename.title ?? "");
  }, [sessionToRename]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const title = (s.title || "").toLowerCase();
      const dateStr = formatDate(s.started_at).toLowerCase();
      return title.includes(q) || dateStr.includes(q);
    });
  }, [sessions, searchQuery]);

  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim() || null;
    setSessionToRename(null);
    setRenamingId(sessionId);
    try {
      const { error } = await supabase.from("sessions").update({ title: trimmed }).eq("id", sessionId);
      if (!error) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s))
        );
        if (selected?.id === sessionId) setSelected((prev) => (prev ? { ...prev, title: trimmed } : null));
      }
    } finally {
      setRenamingId(null);
    }
  }, [selected?.id]);

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
              <>
                <input
                  id="analyze-saved-calls-search"
                  name="q"
                  type="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or date…"
                  className="w-full mb-2 px-3 py-2 rounded-lg text-sm bg-background-elevated/60 border border-border/50 text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:ring-1 focus:ring-green-primary/40"
                  aria-label="Filter saved calls by title or date"
                />
                {filteredSessions.length === 0 ? (
                  <p className="text-sm text-text-muted">No calls match your search.</p>
                ) : (
                  <ul className="space-y-1">
                    {filteredSessions.map((s) => (
                      <li key={s.id} className="flex items-stretch gap-0.5 group">
                        <button
                          type="button"
                          onClick={() => setSelected(s)}
                          className={`flex-1 min-w-0 text-left px-3 py-2 rounded-l-lg text-sm transition-colors border border-r-0 ${
                            selected?.id === s.id
                              ? "bg-green-primary/20 text-green-accent border-green-primary/30"
                              : "text-text-secondary hover:bg-background-surface/60 border-transparent"
                          }`}
                        >
                          <span className="block truncate font-medium">
                            {s.title || "Untitled call"}
                          </span>
                          <span className="block truncate text-xs text-text-dim mt-0.5">
                            {formatDate(s.started_at)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToRename(s);
                          }}
                          disabled={renamingId === s.id}
                          title="Rename call"
                          className="flex-shrink-0 px-1.5 rounded-none border border-transparent border-l border-l-border/50 text-text-dim opacity-60 hover:opacity-100 hover:bg-background-surface/80 hover:text-text-primary transition-colors disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-green-primary/50 focus:ring-inset"
                          aria-label="Rename call"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(s);
                          }}
                          disabled={deletingId === s.id}
                          title="Delete this saved call"
                          className="flex-shrink-0 px-2 rounded-r-lg border border-transparent border-l border-l-border/50 text-text-dim opacity-70 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 hover:border-l-red-500/40 transition-colors disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-400/50 focus:ring-inset"
                          aria-label="Delete saved call"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Transcript + Analysis */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {!selected ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <p className="text-text-muted">
                {sessions.length === 0
                  ? "Save a call from your Live Session, then open AI Coach and click Generate analysis to see coaching feedback here."
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
                {generating ? (
                  <div className="rounded-2xl border border-green-primary/30 bg-gradient-to-b from-green-primary/5 to-transparent p-8 text-center overflow-hidden relative">
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-48 h-24 bg-green-primary/25 blur-2xl pointer-events-none" />
                    <p className="text-sm font-medium text-text-primary mb-4 relative">Analyzing your call…</p>
                    <div className="flex items-end justify-center gap-1.5 h-8 relative" aria-hidden>
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-green-primary/90"
                          style={{
                            animation: "analyze-bar 0.7s ease-in-out infinite",
                            animationDelay: `${i * 0.09}s`,
                            transformOrigin: "bottom",
                            height: "100%",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-dim mt-4 relative">Finding strengths, moments & next steps</p>
                  </div>
                ) : (() => {
                  const insights = parseAnalysis(selected.analysis);
                  const hasValidFeedback = insights && insights.length > 0;
                  if (hasValidFeedback) {
                    return (
                      <div className="space-y-3">
                        {insights!.map((insight, i) => (
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
                        <button
                          type="button"
                          onClick={() => {
                            if (!canUseProFeatures) {
                              openUpgradeModal();
                              return;
                            }
                            generateAnalysis(selected);
                          }}
                          disabled={generating}
                          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary border border-border/50 hover:border-border transition-colors disabled:opacity-50"
                        >
                          {generating ? "Regenerating…" : "Regenerate analysis"}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-xl bg-background-surface/60 border border-border/50 p-5">
                      <p className="text-text-muted text-sm mb-3">
                        {selected.analysis?.trim() && selected.analysis !== "[]"
                          ? "Analysis failed or returned empty. Try again below."
                          : "No feedback yet. Click below to generate analysis."}
                      </p>
                      {generateError && (
                        <p className="text-sm text-amber-400 mb-3">{generateError}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!canUseProFeatures) {
                            openUpgradeModal();
                            return;
                          }
                          generateAnalysis(selected);
                        }}
                        disabled={generating}
                        className="px-4 py-2.5 rounded-xl bg-green-primary/20 border border-green-primary/40 text-green-accent text-sm font-medium hover:bg-green-primary/30 transition-colors disabled:opacity-50"
                      >
                        {generating ? "Generating…" : "Generate analysis"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </main>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes analyze-bar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.7; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}} />
      </div>

      {/* Delete confirmation modal */}
      {sessionToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-call-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSessionToDelete(null)}
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-border bg-background-near-black p-6 shadow-xl max-w-sm w-full">
            <h2 id="delete-call-title" className="text-lg font-semibold text-text-primary mb-1">
              Delete this call?
            </h2>
            <p className="text-sm text-text-muted mb-4">
              This can&apos;t be undone. The transcript and coaching feedback will be permanently removed.
            </p>
            <p className="text-xs text-text-dim truncate mb-5" title={sessionToDelete.title ?? undefined}>
              {sessionToDelete.title || "Untitled call"} · {formatDate(sessionToDelete.started_at)}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary border border-border/50 hover:border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                disabled={deletingId === sessionToDelete.id}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 border border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === sessionToDelete.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Rename modal */}
      {sessionToRename ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-call-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSessionToRename(null)}
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-border bg-background-near-black p-6 shadow-xl max-w-sm w-full">
            <h2 id="rename-call-title" className="text-lg font-semibold text-text-primary mb-3">
              Rename call
            </h2>
            <input
              id="rename-call-title-input"
              name="callTitle"
              type="text"
              autoComplete="off"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSession(sessionToRename.id, renameValue);
                if (e.key === "Escape") setSessionToRename(null);
              }}
              placeholder="Call title"
              className="w-full mb-4 px-3 py-2 rounded-lg text-sm bg-background-elevated/60 border border-border/50 text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:ring-1 focus:ring-green-primary/40"
              aria-label="Call title"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSessionToRename(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary border border-border/50 hover:border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRenameSession(sessionToRename.id, renameValue)}
                disabled={renamingId === sessionToRename.id}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-primary/20 text-green-accent border border-green-primary/40 hover:bg-green-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {renamingId === sessionToRename.id ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
