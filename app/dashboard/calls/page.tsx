"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { fetchApi } from "@/lib/api-fetch";

type SessionRow = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  transcript_full: string | null;
  analysis: string | null;
};

type CoachingInsightType = "strength" | "improve" | "moment" | "next_step";
type CoachingInsight = { type: CoachingInsightType; title: string; text: string };
type StoredAnalysisV1 = { v: 1; summary?: string; coaching?: { insights: CoachingInsight[] } };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function previewText(s: SessionRow) {
  const t = (s.transcript_full ?? "").trim();
  if (!t) return "—";
  return t.replace(/\s+/g, " ").slice(0, 140);
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function normalizeInsightArray(arr: unknown): CoachingInsight[] {
  if (!Array.isArray(arr)) return [];
  const allowed: CoachingInsightType[] = ["strength", "improve", "moment", "next_step"];
  return arr
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const o = x as { type?: unknown; title?: unknown; text?: unknown };
      const type = allowed.includes(o.type as CoachingInsightType) ? (o.type as CoachingInsightType) : "moment";
      const title = typeof o.title === "string" ? o.title.slice(0, 120) : "";
      const text = typeof o.text === "string" ? o.text.slice(0, 1200) : "";
      return { type, title, text };
    })
    .filter((x) => x.title.trim() || x.text.trim());
}

function parseStoredAnalysis(raw: string | null): { summary: string | null; insights: CoachingInsight[] } {
  const t = (raw ?? "").trim();
  if (!t) return { summary: null, insights: [] };

  const obj = safeJsonParse<StoredAnalysisV1>(t);
  if (obj && typeof obj === "object" && obj.v === 1) {
    const summary = typeof obj.summary === "string" && obj.summary.trim() ? obj.summary.trim() : null;
    const insights = normalizeInsightArray(obj.coaching?.insights);
    return { summary, insights };
  }

  const arr = safeJsonParse<unknown>(t);
  const insights = normalizeInsightArray(arr);
  if (insights.length > 0) return { summary: null, insights };

  // Legacy: plain-text summary or raw model output
  return { summary: t, insights: [] };
}

function buildStoredAnalysis(next: { prevRaw: string | null; summary?: string; coachingInsights?: CoachingInsight[] }): string {
  const prev = parseStoredAnalysis(next.prevRaw);
  const merged: StoredAnalysisV1 = {
    v: 1,
    summary: typeof next.summary === "string" ? next.summary.trim() : prev.summary ?? undefined,
    coaching:
      next.coachingInsights
        ? { insights: next.coachingInsights }
        : prev.insights.length > 0
          ? { insights: prev.insights }
          : undefined,
  };
  return JSON.stringify(merged);
}

function badgeForInsightType(type: CoachingInsightType) {
  switch (type) {
    case "strength":
      return {
        label: "Strength",
        cls: "border-green-primary/30 bg-green-primary/10 text-green-accent",
      };
    case "improve":
      return {
        label: "Improve",
        cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      };
    case "next_step":
      return {
        label: "Next step",
        cls: "border-blue-500/30 bg-blue-500/10 text-blue-200",
      };
    default:
      return {
        label: "Moment",
        cls: "border-border/60 bg-background-elevated/30 text-text-dim",
      };
  }
}

export default function CallsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<"summary" | "coaching" | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const selected = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [selectedId, sessions]
  );

  const selectedParsed = useMemo(() => parseStoredAnalysis(selected?.analysis ?? null), [selected?.analysis]);
  const hasSummary = !!selectedParsed.summary;
  const hasCoaching = selectedParsed.insights.length > 0;

  const selectedFromUrl = searchParams.get("session");

  useEffect(() => {
    if (!selected) return;
    setRenaming(false);
    setRenameError(null);
    setRenameDraft(selected.title ?? "");
  }, [selected?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("id,title,started_at,ended_at,duration_minutes,transcript_full,analysis")
        .order("started_at", { ascending: false })
        .limit(200);
      if (!mounted) return;
      if (error) {
        setSessions([]);
      } else {
        const rows = (data as SessionRow[]) ?? [];
        setSessions(rows);
        setSelectedId((prev) => prev ?? selectedFromUrl ?? rows[0]?.id ?? null);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [selectedFromUrl]);

  const reloadSessions = async (preferSelectId?: string | null) => {
    const { data, error } = await supabase
      .from("sessions")
      .select("id,title,started_at,ended_at,duration_minutes,transcript_full,analysis")
      .order("started_at", { ascending: false })
      .limit(200);
    if (error) return;
    const rows = (data as SessionRow[]) ?? [];
    setSessions(rows);
    setSelectedId((prev) => preferSelectId ?? prev ?? rows[0]?.id ?? null);
  };

  const downloadTranscript = () => {
    if (!selected) return;
    const transcript = (selected.transcript_full ?? "").trim();
    if (!transcript) return;

    const title = (selected.title || "Untitled call").trim();
    const startedLabel = selected.started_at ? formatDateTime(selected.started_at) : "";
    const durationLabel = selected.duration_minutes ? `${selected.duration_minutes} min` : "—";

    const header = [
      `Title: ${title}`,
      startedLabel ? `Started: ${startedLabel}` : null,
      `Duration: ${durationLabel}`,
      "",
      "Transcript:",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    const content = `${header}${transcript}\n`;

    const safeBase = (title || "call")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "call";
    const datePart = selected.started_at ? new Date(selected.started_at).toISOString().slice(0, 10) : "unknown-date";
    const filename = `${safeBase}-${datePart}.txt`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const saveRename = async () => {
    if (!selected || renameSaving || deleting || generating) return;
    const nextTitle = renameDraft.trim();
    setRenameSaving(true);
    setRenameError(null);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ title: nextTitle ? nextTitle : null })
        .eq("id", selected.id);
      if (error) {
        setRenameError("Could not rename call.");
        setRenameSaving(false);
        return;
      }
      setRenaming(false);
      await reloadSessions(selected.id);
      setRenameSaving(false);
    } catch {
      setRenameError("Could not rename call.");
      setRenameSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected || deleting || generating) return;
    const ok = window.confirm("Delete this call? This cannot be undone.");
    if (!ok) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const id = selected.id;
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) {
        setDeleteError("Could not delete call.");
        setDeleting(false);
        return;
      }
      const remaining = sessions.filter((s) => s.id !== id);
      const nextId = remaining[0]?.id ?? null;
      await reloadSessions(nextId);
      setDeleting(false);
    } catch {
      setDeleteError("Could not delete call.");
      setDeleting(false);
    }
  };

  const runAnalysis = async (mode: "summary" | "coaching") => {
    if (!selected || generating) return;
    if (mode === "summary" && hasSummary) return;
    if (mode === "coaching" && hasCoaching) return;
    const transcript = (selected.transcript_full ?? "").trim();
    if (!transcript) {
      setGenError("No transcript to analyze.");
      return;
    }
    setGenerating(mode);
    setGenError(null);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setGenError("Sign in to generate analysis.");
        setGenerating(null);
        return;
      }
      const token = sessionData.session?.access_token;
      if (!token) {
        setGenError("Sign in to generate analysis.");
        setGenerating(null);
        return;
      }

      const res = await fetchApi("/api/ai/analyze-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript, mode }),
      });
      const payload = (await res.json()) as { analysis?: string; error?: string };
      if (!res.ok || !payload.analysis) {
        setGenError(payload.error || "Analysis failed.");
        setGenerating(null);
        return;
      }

      let nextStored = "";
      if (mode === "summary") {
        nextStored = buildStoredAnalysis({ prevRaw: selected.analysis, summary: payload.analysis });
      } else {
        const parsed = safeJsonParse<unknown>(payload.analysis);
        const insights = normalizeInsightArray(parsed);
        nextStored = buildStoredAnalysis({ prevRaw: selected.analysis, coachingInsights: insights });
      }

      const { error: updateErr } = await supabase
        .from("sessions")
        .update({ analysis: nextStored })
        .eq("id", selected.id);
      if (updateErr) {
        setGenError("Could not save analysis.");
        setGenerating(null);
        return;
      }

      await reloadSessions(selected.id);
      setGenerating(null);
    } catch {
      setGenError("Analysis failed.");
      setGenerating(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Calls</h1>
          <p className="text-sm text-text-muted mt-0.5">Saved transcripts and coaching analysis</p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12">
          <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border/60 overflow-y-auto">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-8 text-center">
                  <p className="text-text-muted text-sm">Loading calls…</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 border-dashed p-8 text-center">
                  <p className="text-text-primary font-medium">No saved calls yet</p>
                  <p className="text-sm text-text-muted mt-1">
                    End a call, then save the transcript to see it here.
                  </p>
                </div>
              ) : (
                sessions.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "w-full text-left rounded-2xl border p-4 transition-colors",
                        active
                          ? "bg-white/[0.06] border-white/[0.12]"
                          : "bg-background-surface/40 border-border/50 hover:bg-background-surface/55"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {s.title || "Untitled call"}
                          </p>
                          <p className="text-[11px] text-text-dim mt-0.5">
                            {formatDateTime(s.started_at)}
                            {typeof s.duration_minutes === "number" && s.duration_minutes > 0
                              ? ` · ${s.duration_minutes} min`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-[10px] px-2 py-0.5 rounded-full border",
                            s.analysis
                              ? "border-green-primary/30 bg-green-primary/10 text-green-accent"
                              : "border-border/60 bg-background-elevated/30 text-text-dim"
                          )}
                        >
                          {s.analysis ? "Analyzed" : "Saved"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-text-muted line-clamp-2">{previewText(s)}</p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="lg:col-span-8 overflow-y-auto">
            <div className="p-6">
              {!selected ? (
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-8 text-center">
                  <p className="text-text-muted text-sm">Select a call to view details.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {renaming ? (
                          <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-medium tracking-wide text-text-dim">
                              Call title
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                value={renameDraft}
                                onChange={(e) => setRenameDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void saveRename();
                                  if (e.key === "Escape") {
                                    setRenaming(false);
                                    setRenameError(null);
                                    setRenameDraft(selected.title ?? "");
                                  }
                                }}
                                disabled={renameSaving}
                                className="w-full max-w-[28rem] px-3 py-2 rounded-xl bg-background-surface/60 border border-white/[0.10] text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/35 text-sm"
                                placeholder="Untitled call"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={saveRename}
                                disabled={renameSaving}
                                className={cn(
                                  "px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                                  "border-green-primary/30 bg-green-primary/15 text-green-accent hover:bg-green-primary/22",
                                  renameSaving && "opacity-60 cursor-wait"
                                )}
                              >
                                {renameSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenaming(false);
                                  setRenameError(null);
                                  setRenameDraft(selected.title ?? "");
                                }}
                                disabled={renameSaving}
                                className="px-3 py-2 rounded-xl border border-border/60 bg-background-elevated/20 text-sm font-medium text-text-muted hover:bg-background-elevated/35 transition-colors disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                            {renameError ? (
                              <p className="text-xs text-amber-400">{renameError}</p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-text-primary truncate">
                              {selected.title || "Untitled call"}
                            </h2>
                            <button
                              type="button"
                              onClick={() => setRenaming(true)}
                              disabled={deleting || generating !== null}
                              className={cn(
                                "shrink-0 rounded-lg px-2 py-1 text-[12px] font-medium text-text-dim hover:text-text-primary hover:bg-white/[0.06] transition-colors",
                                (deleting || generating !== null) && "opacity-60 cursor-not-allowed"
                              )}
                              title="Rename call"
                            >
                              Rename
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-text-dim mt-1">
                          {formatDateTime(selected.started_at)}
                        </p>
                        <p className="text-xs text-text-dim mt-1">
                          {selected.duration_minutes ? `${selected.duration_minutes} min` : "—"}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={downloadTranscript}
                          disabled={deleting || generating !== null || renaming || renameSaving || !(selected.transcript_full ?? "").trim()}
                          className={cn(
                            "px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                            "border-border/60 bg-background-elevated/25 text-text-muted hover:bg-background-elevated/40",
                            (deleting || generating !== null || renaming || renameSaving) && "opacity-60 cursor-not-allowed",
                            !(selected.transcript_full ?? "").trim() && "opacity-60 cursor-not-allowed"
                          )}
                          title="Download transcript"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={deleteSelected}
                          disabled={deleting || generating !== null || renaming || renameSaving}
                          className={cn(
                            "px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                            "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
                            (deleting || generating !== null || renaming || renameSaving) && "opacity-60 cursor-not-allowed"
                          )}
                          title="Delete call"
                        >
                          {deleting ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    {deleteError ? (
                      <p className="mt-3 text-xs text-amber-400">{deleteError}</p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Transcript</h3>
                    <pre className="whitespace-pre-wrap text-xs text-text-secondary leading-relaxed">
                      {(selected.transcript_full ?? "").trim() || "—"}
                    </pre>
                  </div>

                  <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Coaching</h3>
                    <p className="text-sm text-text-muted">
                      Generate a summary or a full sales-coach critique from this transcript.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => runAnalysis("summary")}
                        disabled={generating !== null || hasSummary}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                          generating === "summary"
                            ? "bg-green-primary/10 border-green-primary/25 text-green-accent opacity-80 cursor-wait"
                            : "bg-green-primary/20 border-green-primary/30 text-green-accent hover:bg-green-primary/30",
                          (generating && generating !== "summary") && "opacity-60 cursor-not-allowed",
                          hasSummary && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {hasSummary ? "Summary generated" : generating === "summary" ? "Generating…" : "Generate summary"}
                      </button>
                      <button
                        type="button"
                        onClick={() => runAnalysis("coaching")}
                        disabled={generating !== null || hasCoaching}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                          generating === "coaching"
                            ? "bg-background-elevated/20 border-border/60 text-text-muted opacity-80 cursor-wait"
                            : "bg-background-elevated/40 border-border/60 text-sm font-medium text-text-muted hover:bg-background-elevated/55",
                          (generating && generating !== "coaching") && "opacity-60 cursor-not-allowed",
                          hasCoaching && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {hasCoaching
                          ? "Coaching generated"
                          : generating === "coaching"
                            ? "Generating…"
                            : "Generate coaching analysis"}
                      </button>
                    </div>
                    {genError ? (
                      <p className="mt-3 text-xs text-amber-400">{genError}</p>
                    ) : null}

                    {hasSummary ? (
                      <div className="mt-4 rounded-xl border border-border/60 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold tracking-wide text-text-dim">SUMMARY</p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
                          {selectedParsed.summary}
                        </p>
                      </div>
                    ) : null}

                    {hasCoaching ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold tracking-wide text-text-dim">COACHING POINTERS</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedParsed.insights.map((ins, idx) => {
                            const b = badgeForInsightType(ins.type);
                            return (
                              <div
                                key={`${ins.type}-${idx}`}
                                className="rounded-xl border border-border/60 bg-background-elevated/20 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-text-primary truncate">
                                      {ins.title || "Coaching note"}
                                    </p>
                                  </div>
                                  <span className={cn("shrink-0 text-[10px] px-2 py-0.5 rounded-full border", b.cls)}>
                                    {b.label}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                                  {ins.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

