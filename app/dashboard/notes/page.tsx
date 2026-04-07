"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

type DateBucket = "today" | "yesterday" | "thisWeek" | "older";

const DAY_MS = 86_400_000;

function startOfLocalDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function getDateBucket(iso: string): DateBucket {
  const startToday = startOfLocalDay(new Date());
  const startNote = startOfLocalDay(new Date(iso));
  const diffDays = Math.round((startToday - startNote) / DAY_MS);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "thisWeek";
  return "older";
}

const BUCKET_LABELS: Record<DateBucket, string> = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This week",
  older: "Earlier",
};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

function formatNoteStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch notes:", error);
      setNotes([]);
      return;
    }
    setNotes((data as Note[]) ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchNotes();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchNotes]);

  const openCreate = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");
    setModalOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title ?? "");
    setFormContent(note.content ?? "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
    setSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const payload = {
      title: formTitle.trim() || null,
      content: formContent.trim() || "",
      completed: editingNote ? editingNote.completed : false,
      updated_at: new Date().toISOString(),
    };
    if (editingNote) {
      const { error } = await supabase.from("notes").update(payload).eq("id", editingNote.id);
      if (error) {
        console.error(error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("notes").insert({ ...payload, user_id: user.id });
      if (error) {
        console.error(error);
        setSaving(false);
        return;
      }
    }
    await fetchNotes();
    closeModal();
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    setDeleteConfirming(true);
    const { error } = await supabase.from("notes").delete().eq("id", noteToDelete.id);
    setDeleteConfirming(false);
    setNoteToDelete(null);
    if (!error) await fetchNotes();
  };

  const filtered = notes.filter((n) => {
    const matchSearch =
      !search.trim() ||
      (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.content || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const groupedNotes = useMemo(() => {
    const buckets: Record<DateBucket, Note[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    for (const n of filtered) {
      buckets[getDateBucket(n.updated_at)].push(n);
    }
    return buckets;
  }, [filtered]);

  const sectionsToShow = (["today", "yesterday", "thisWeek", "older"] as const).filter(
    (k) => groupedNotes[k].length > 0
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Notes</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Capture call insights, action items, and follow-ups
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white text-sm font-medium transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New note
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="notes-list-search"
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 focus:border-green-primary/30 text-sm"
            />
          </div>
        </div>

        <div className="max-w-5xl">
          {loading ? (
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-12 text-center">
              <p className="text-text-muted text-sm">Loading notes…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 border-dashed p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-background-elevated flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-text-primary font-medium">
                {notes.length === 0 ? "No notes yet" : "No notes match your filters"}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {notes.length === 0
                  ? "Add notes from calls, meetings, and follow-ups."
                  : "Try a different search."}
              </p>
              {notes.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 px-4 py-2 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-sm font-medium hover:bg-green-primary/30 transition-colors"
                >
                  New note
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {sectionsToShow.map((bucket) => (
                <section key={bucket} aria-labelledby={`notes-section-${bucket}`}>
                  <div className="mb-4 flex items-end gap-3 border-b border-border/40 pb-2">
                    <h2
                      id={`notes-section-${bucket}`}
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-dim"
                    >
                      {BUCKET_LABELS[bucket]}
                    </h2>
                    <span className="text-[10px] text-text-dim/80 tabular-nums">
                      {groupedNotes[bucket].length} note{groupedNotes[bucket].length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {groupedNotes[bucket].map((note) => (
                      <li key={note.id}>
                        <article
                          className={cn(
                            "relative flex h-full flex-col rounded-2xl border border-border/50 bg-gradient-to-b from-background-surface/50 to-background-surface/25 p-5",
                            "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
                            "transition-[border-color,box-shadow] hover:border-green-primary/25 hover:shadow-[0_0_0_1px_rgba(26,157,120,0.12)]"
                          )}
                        >
                          <div
                            className="pointer-events-none absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-green-primary/50 to-green-primary/15"
                            aria-hidden
                          />
                          <div className="flex items-start justify-between gap-3 pl-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-text-primary">
                                {note.title?.trim() ? note.title : (
                                  <span className="font-medium text-text-dim">Untitled note</span>
                                )}
                              </h3>
                              <p className="text-sm leading-relaxed text-text-secondary line-clamp-4">
                                {note.content?.trim() ? note.content : (
                                  <span className="text-text-dim/80 italic">No content yet</span>
                                )}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => openEdit(note)}
                                className="rounded-lg p-2 text-text-dim transition-colors hover:bg-background-surface/80 hover:text-green-accent"
                                title="Edit note"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNoteToDelete(note)}
                                className="rounded-lg p-2 text-text-dim transition-colors hover:bg-red-500/10 hover:text-red-400"
                                title="Delete note"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 border-t border-border/30 pt-3 pl-3 text-[11px] text-text-dim">
                            <span
                              className="inline-flex items-center gap-1.5 tabular-nums"
                              title={formatNoteStamp(note.updated_at)}
                            >
                              <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Updated {formatRelativeTime(note.updated_at)}
                            </span>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60">
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-5xl min-h-[min(85vh,720px)] max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">
                {editingNote ? "Edit note" : "New note"}
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
            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 sm:p-8 space-y-5">
              <div>
                <label htmlFor="note-form-title" className="block text-xs font-medium text-text-muted mb-1.5">
                  Title (optional)
                </label>
                <input
                  id="note-form-title"
                  name="title"
                  type="text"
                  autoComplete="off"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Call with Acme Corp"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <label htmlFor="note-form-content" className="block text-xs font-medium text-text-muted mb-1.5">
                  Content
                </label>
                <textarea
                  id="note-form-content"
                  name="content"
                  autoComplete="off"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Note content…"
                  rows={16}
                  className="min-h-[min(55vh,420px)] w-full flex-1 resize-y rounded-xl border border-border bg-background-surface/60 px-4 py-3 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40"
                />
              </div>
              <div className="flex shrink-0 justify-end gap-2 pt-2">
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
                  {saving ? "Saving…" : editingNote ? "Save changes" : "Create note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-text-primary font-medium">Delete this note?</p>
            <p className="text-sm text-text-muted mt-1 line-clamp-2">
              {noteToDelete.title || noteToDelete.content || "Untitled note"}
            </p>
            <p className="text-xs text-text-dim mt-2">This cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
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
