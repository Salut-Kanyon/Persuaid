"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

export interface Session {
  id: string;
  user_id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  outcome: string | null;
  script_id: string | null;
  created_at: string;
}

interface ScriptOption {
  id: string;
  title: string;
}

const OUTCOMES = ["Won", "Lost", "Pending", "No answer"] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getStartOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function outcomeStyle(outcome: string | null): string {
  if (!outcome) return "bg-background-surface/60 text-text-muted border-border";
  switch (outcome) {
    case "Won":
      return "bg-green-primary/15 text-green-accent border-green-primary/25";
    case "Lost":
      return "bg-red-500/15 text-red-400 border-red-500/25";
    case "Pending":
      return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    case "No answer":
      return "bg-background-surface/60 text-text-muted border-border";
    default:
      return "bg-background-surface/60 text-text-muted border-border";
  }
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formStartedAt, setFormStartedAt] = useState("");
  const [formDurationMinutes, setFormDurationMinutes] = useState(30);
  const [formOutcome, setFormOutcome] = useState<string | null>(null);
  const [formScriptId, setFormScriptId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [sessRes, scriptsRes, notesRes] = await Promise.all([
      supabase.from("sessions").select("*").order("started_at", { ascending: false }),
      supabase.from("scripts").select("id, title").order("title"),
      supabase.from("notes").select("id", { count: "exact", head: true }),
    ]);
    if (!sessRes.error) setSessions((sessRes.data as Session[]) ?? []);
    if (!scriptsRes.error) setScripts((scriptsRes.data as ScriptOption[]) ?? []);
    if (!notesRes.error) setNotesCount(notesRes.count ?? 0);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchData();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchData]);

  const openLogCall = () => {
    setEditingSession(null);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 30);
    setFormTitle("");
    setFormStartedAt(now.toISOString().slice(0, 16));
    setFormDurationMinutes(30);
    setFormOutcome(null);
    setFormScriptId(null);
    setModalOpen(true);
  };

  const openEdit = (session: Session) => {
    setEditingSession(session);
    setFormTitle(session.title ?? "");
    setFormStartedAt(session.started_at.slice(0, 16));
    setFormDurationMinutes(session.duration_minutes);
    setFormOutcome(session.outcome);
    setFormScriptId(session.script_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSession(null);
    setSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const started = new Date(formStartedAt);
    const ended = new Date(started.getTime() + formDurationMinutes * 60 * 1000);
    const payload = {
      title: formTitle.trim() || null,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      duration_minutes: Math.max(0, formDurationMinutes),
      outcome: formOutcome || null,
      script_id: formScriptId || null,
    };
    if (editingSession) {
      const { error } = await supabase.from("sessions").update(payload).eq("id", editingSession.id);
      if (error) {
        console.error(error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("sessions").insert({ ...payload, user_id: user.id });
      if (error) {
        console.error(error);
        setSaving(false);
        return;
      }
    }
    await fetchData();
    closeModal();
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    setDeleteConfirming(true);
    const { error } = await supabase.from("sessions").delete().eq("id", sessionToDelete.id);
    setDeleteConfirming(false);
    setSessionToDelete(null);
    if (!error) await fetchData();
  };

  const totalCalls = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const callsThisWeek = sessions.filter((s) => new Date(s.started_at) >= weekAgo).length;
  const scriptsCount = scripts.length;

  const chartDays = 14;
  const chartStart = new Date(now);
  chartStart.setDate(chartStart.getDate() - chartDays);
  const dayCounts: Record<string, number> = {};
  for (let i = 0; i < chartDays; i++) {
    const d = new Date(chartStart);
    d.setDate(d.getDate() + i);
    dayCounts[getStartOfDay(d)] = 0;
  }
  sessions.forEach((s) => {
    const day = getStartOfDay(new Date(s.started_at));
    if (day in dayCounts) dayCounts[day]++;
  });
  const maxCalls = Math.max(1, ...Object.values(dayCounts));
  const chartEntries = Object.entries(dayCounts).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Call activity, talk time, and performance
          </p>
        </div>
        <button
          type="button"
          onClick={openLogCall}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white text-sm font-medium transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log call
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl space-y-8">
          {loading ? (
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-12 text-center">
              <p className="text-text-muted text-sm">Loading analytics…</p>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                  <p className="text-xs font-medium text-text-dim uppercase tracking-wider">Total calls</p>
                  <p className="text-2xl font-semibold text-text-primary mt-1">{totalCalls}</p>
                </div>
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                  <p className="text-xs font-medium text-text-dim uppercase tracking-wider">Talk time</p>
                  <p className="text-2xl font-semibold text-text-primary mt-1">{formatDuration(totalMinutes)}</p>
                </div>
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                  <p className="text-xs font-medium text-text-dim uppercase tracking-wider">This week</p>
                  <p className="text-2xl font-semibold text-green-accent mt-1">{callsThisWeek}</p>
                </div>
                <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-5">
                  <p className="text-xs font-medium text-text-dim uppercase tracking-wider">Scripts & notes</p>
                  <p className="text-2xl font-semibold text-text-primary mt-1">{scriptsCount} / {notesCount}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-6">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Calls per day (last 14 days)</h2>
                <div className="flex items-end gap-1 h-32">
                  {chartEntries.map(([day, count]) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t-md bg-green-primary/40 min-h-[4px] transition-all"
                        style={{ height: `${Math.max(4, (count / maxCalls) * 100)}%` }}
                      />
                      <span className="text-[10px] text-text-dim truncate w-full text-center">
                        {new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent sessions */}
              <div>
                <h2 className="text-sm font-semibold text-text-primary mb-4">Recent sessions</h2>
                {sessions.length === 0 ? (
                  <div className="rounded-2xl bg-background-surface/40 border border-border/50 border-dashed p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-background-elevated flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-text-primary font-medium">No calls logged yet</p>
                    <p className="text-sm text-text-muted mt-1">Log a call to track time and outcomes.</p>
                    <button
                      type="button"
                      onClick={openLogCall}
                      className="mt-4 px-4 py-2 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-sm font-medium hover:bg-green-primary/30 transition-colors"
                    >
                      Log call
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {sessions.map((session) => (
                      <li key={session.id}>
                        <div className="rounded-2xl bg-background-surface/40 border border-border/50 hover:border-green-primary/20 transition-all p-5 flex items-center gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {session.title || "Untitled call"}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {formatDate(session.started_at)} · {formatTime(session.started_at)} · {formatDuration(session.duration_minutes)}
                            </p>
                            {session.outcome && (
                              <span className={cn("inline-flex mt-2 px-2 py-0.5 rounded-md text-[10px] font-medium border", outcomeStyle(session.outcome))}>
                                {session.outcome}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(session)}
                              className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-background-surface/50 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSessionToDelete(session)}
                              className="p-2 rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Log / Edit session modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">
                {editingSession ? "Edit session" : "Log call"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-background-surface/50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Title (optional)</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Discovery with Acme Corp"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Start</label>
                  <input
                    type="datetime-local"
                    value={formStartedAt}
                    onChange={(e) => setFormStartedAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Outcome (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setFormOutcome(formOutcome === o ? null : o)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        formOutcome === o ? "bg-green-primary/20 text-green-accent border-green-primary/30" : "bg-background-surface/40 text-text-muted border-border"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              {scripts.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Script used (optional)</label>
                  <select
                    value={formScriptId ?? ""}
                    onChange={(e) => setFormScriptId(e.target.value || null)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                  >
                    <option value="">None</option>
                    {scripts.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-background-surface/50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingSession ? "Save changes" : "Log call"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-text-primary font-medium">Delete this session?</p>
            <p className="text-sm text-text-muted mt-1">
              {sessionToDelete.title || "Untitled call"} · {formatDate(sessionToDelete.started_at)}
            </p>
            <p className="text-xs text-text-dim mt-2">This cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-background-surface/50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirming}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
              >
                {deleteConfirming ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
