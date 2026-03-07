"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  completed: boolean;
  updated_at: string;
}

const AVAILABLE_TAGS = ["Interest", "Objection", "Action", "Budget", "Contact", "Pain Point"];

export function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickContent, setQuickContent] = useState("");
  const [quickTag, setQuickTag] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, content, tags, completed, updated_at")
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

  useEffect(() => {
    const onUpdate = () => fetchNotes();
    window.addEventListener("persuaid-notes-updated", onUpdate);
    return () => window.removeEventListener("persuaid-notes-updated", onUpdate);
  }, [fetchNotes]);

  const toggleNote = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ completed: !note.completed, updated_at: new Date().toISOString() })
      .eq("id", note.id);
    if (!error) await fetchNotes();
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = quickContent.trim();
    if (!content) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setAdding(true);
    const tags = quickTag ? [quickTag] : [];
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: null,
      content,
      tags,
      completed: false,
    });
    setAdding(false);
    if (!error) {
      setQuickContent("");
      setQuickTag(null);
      await fetchNotes();
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-0">
        {loading ? (
          <p className="text-sm text-text-muted">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-text-muted">No notes yet. Add one below or in Notes.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-3 group hover:bg-background-elevated/15 rounded-xl p-3 -m-3 transition-all duration-300 cursor-pointer"
              onClick={() => toggleNote(note)}
            >
              <div
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm",
                  note.completed
                    ? "bg-green-primary/10 border-green-primary/18"
                    : "bg-background-elevated/30 border-border/18 group-hover:border-green-primary/18"
                )}
              >
                {note.completed && (
                  <svg className="w-2.5 h-2.5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    note.completed ? "text-text-dim/60 line-through" : "text-text-secondary/85"
                  )}
                >
                  {note.title ? `${note.title}: ${note.content}` : note.content || "—"}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-medium border",
                        tag === "Interest"
                          ? "bg-green-primary/6 text-green-accent/85 border-green-primary/12"
                          : "bg-background-elevated/30 text-text-muted/75 border-border/15"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick add */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border/8 bg-background-elevated/15 backdrop-blur-xl space-y-3">
        <form onSubmit={addNote} className="space-y-2">
          <input
            type="text"
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            placeholder="Add a note…"
            className="w-full px-3 py-2 rounded-xl bg-background-surface/50 border border-border/50 text-text-primary placeholder-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/40"
          />
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuickTag(quickTag === tag ? null : tag)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300",
                  quickTag === tag
                    ? "bg-green-primary/15 text-green-accent border-green-primary/25"
                    : "bg-background-surface/30 border-border/15 text-text-muted/75 hover:border-green-primary/15 hover:text-green-accent/90"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={adding || !quickContent.trim()}
              className="px-3 py-1.5 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-xs font-medium hover:bg-green-primary/30 disabled:opacity-50 transition-colors"
            >
              {adding ? "Adding…" : "Add note"}
            </button>
            <Link
              href="/dashboard/notes"
              className="text-xs text-text-muted hover:text-green-accent/90 transition-colors"
            >
              Manage notes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
