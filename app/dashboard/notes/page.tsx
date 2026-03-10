"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const AVAILABLE_TAGS = ["Interest", "Objection", "Action", "Budget", "Contact", "Pain Point"];

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

function tagStyle(tag: string): string {
  if (tag === "Interest") return "bg-green-primary/15 text-green-accent border-green-primary/25";
  return "bg-background-surface/60 text-text-muted border-border";
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | "All">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formCompleted, setFormCompleted] = useState(false);

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
    setFormTags([]);
    setFormCompleted(false);
    setModalOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title ?? "");
    setFormContent(note.content ?? "");
    setFormTags(note.tags ?? []);
    setFormCompleted(note.completed ?? false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
    setSaving(false);
  };

  const toggleTag = (tag: string) => {
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const payload = {
      title: formTitle.trim() || null,
      content: formContent.trim() || "",
      tags: formTags,
      completed: formCompleted,
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

  const handleToggleCompleted = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ completed: !note.completed, updated_at: new Date().toISOString() })
      .eq("id", note.id);
    if (!error) await fetchNotes();
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
      (n.content || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchTag = filterTag === "All" || (n.tags || []).includes(filterTag);
    return matchSearch && matchTag;
  });

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
        <div className="max-w-4xl flex flex-col sm:flex-row gap-4 mb-6">
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
              type="search"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 focus:border-green-primary/30 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...AVAILABLE_TAGS].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filterTag === tag
                    ? "bg-green-primary/20 text-green-accent border border-green-primary/30"
                    : "bg-background-surface/60 text-text-muted border border-border hover:text-text-secondary hover:border-border/80"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl">
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
                  : "Try a different search or tag."}
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
            <ul className="space-y-3">
              {filtered.map((note) => (
                <li key={note.id}>
                  <div className="rounded-2xl bg-background-surface/40 border border-border/50 hover:border-green-primary/20 transition-all p-5 flex items-start gap-4 group">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(note)}
                      className={cn(
                        "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        note.completed
                          ? "bg-green-primary/20 border-green-primary/50"
                          : "bg-background-elevated/50 border-border hover:border-green-primary/30"
                      )}
                    >
                      {note.completed && (
                        <svg className="w-3 h-3 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex-1 text-left min-w-0"
                      onClick={() => openEdit(note)}
                    >
                      {note.title && (
                        <h3 className="text-sm font-semibold text-text-primary group-hover:text-green-accent/90 transition-colors">
                          {note.title}
                        </h3>
                      )}
                      <p className={cn("text-sm mt-0.5 line-clamp-2", note.completed ? "text-text-dim/70 line-through" : "text-text-secondary")}>
                        {note.content || "No content"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(note.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border", tagStyle(tag))}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-dim mt-2">{formatRelativeTime(note.updated_at)}</p>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(note)}
                        className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-background-surface/50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setNoteToDelete(note); }}
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
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
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
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Title (optional)</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Call with Acme Corp"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Note content…"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm resize-y min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        formTags.includes(tag)
                          ? "bg-green-primary/20 text-green-accent border-green-primary/30"
                          : "bg-background-surface/40 text-text-muted border-border hover:border-border/80"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={formCompleted}
                  onClick={() => setFormCompleted((c) => !c)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                    formCompleted ? "bg-green-primary/20 border-green-primary/50" : "border-border"
                  )}
                >
                  {formCompleted && (
                    <svg className="w-3 h-3 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-text-muted">Mark as done</span>
              </div>
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
