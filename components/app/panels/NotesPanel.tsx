"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";
import { loadSettings } from "@/lib/settings";

interface SavedNote {
  id: string;
  title: string | null;
  content: string;
  updated_at: string;
}

export function NotesPanel() {
  const { setNotesContext } = useSession();
  const [currentNote, setCurrentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [rewriteStyle, setRewriteStyle] = useState<"headings" | "clean_bullets" | "checklist" | "paragraph">("headings");
  const [importOpen, setImportOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft autosave (local only) controlled by Settings.
  useEffect(() => {
    try {
      const s = loadSettings();
      if (!s.autoSaveEnabled) return;
      const raw = localStorage.getItem("persuaid_notes_draft_v1");
      if (raw && !currentNote.trim()) setCurrentNote(raw);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setNotesContext(currentNote), 400);
    return () => clearTimeout(t);
  }, [currentNote, setNotesContext]);

  useEffect(() => {
    try {
      const s = loadSettings();
      if (!s.autoSaveEnabled) return;
      const t = setTimeout(() => localStorage.setItem("persuaid_notes_draft_v1", currentNote), 500);
      return () => clearTimeout(t);
    } catch {
      return;
    }
  }, [currentNote]);

  const handleSave = async () => {
    const content = currentNote.trim();
    if (!content) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: null,
      content,
      tags: [],
      completed: false,
    });

    setSaving(false);
    if (!error) {
      setCurrentNote("");
      setSaveMessage("Note saved");
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  const handleRewrite = async () => {
    const content = currentNote.trim();
    if (!content) return;
    setRewriteError(null);
    setRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, style: rewriteStyle }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (res.ok && typeof data.text === "string") {
        setCurrentNote(data.text);
      } else {
        setRewriteError(data.error || "Rewrite failed");
      }
    } catch {
      setRewriteError("Request failed");
    } finally {
      setRewriting(false);
    }
  };

  const handleLoadFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") setCurrentNote(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const openImport = async () => {
    setImportOpen(true);
    setImportLoading(true);
    const { data } = await supabase
      .from("notes")
      .select("id, title, content, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    setSavedNotes((data as SavedNote[]) ?? []);
    setImportLoading(false);
  };

  const importNote = (note: SavedNote) => {
    const toAppend = note.content?.trim() || "";
    if (toAppend) {
      setCurrentNote((prev) => (prev.trim() ? prev + "\n\n" + toAppend : toAppend));
    }
    setImportOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/30 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown,text/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={handleLoadFile}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-background-surface/60 border border-border/50 text-text-primary hover:bg-background-surface transition-colors"
        >
          Load from file
        </button>
        <button
          type="button"
          onClick={openImport}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-background-surface/60 border border-border/50 text-text-primary hover:bg-background-surface transition-colors"
        >
          Import from my notes
        </button>
        <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background-surface/40 border border-border/40 text-xs text-text-muted">
          Style
          <select
            value={rewriteStyle}
            onChange={(e) => setRewriteStyle(e.target.value as typeof rewriteStyle)}
            className="rounded-md border border-border/60 bg-background-elevated/60 px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-primary/40"
          >
            <option value="headings">Headings</option>
            <option value="clean_bullets">Clean bullets</option>
            <option value="checklist">Checklist</option>
            <option value="paragraph">Paragraph</option>
          </select>
        </label>
        <button
          type="button"
          onClick={handleRewrite}
          disabled={rewriting || !currentNote.trim()}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
            "bg-green-primary/20 text-green-700 dark:text-green-400 border border-green-primary/30",
            "hover:bg-green-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {rewriting ? (
            <>
              <span className="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
              <span>Rewriting…</span>
            </>
          ) : (
            "Rewrite with AI"
          )}
        </button>
      </div>
      {rewriteError && (
        <div className="flex-shrink-0 px-4 py-1.5 text-xs text-red-500 dark:text-red-400">
          {rewriteError}
        </div>
      )}
      {importOpen && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-border/30 bg-background-surface/40">
          <p className="text-xs text-text-muted mb-2">Choose a note to append to current notes:</p>
          {importLoading ? (
            <p className="text-xs text-text-dim">Loading…</p>
          ) : savedNotes.length === 0 ? (
            <p className="text-xs text-text-dim">No saved notes. Save notes from the Notes page in the sidebar.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {savedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => importNote(note)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-background-elevated/60 border border-border/50 text-text-primary hover:bg-green-primary/15 hover:border-green-primary/30 transition-colors text-left max-w-full truncate"
                  title={note.title || note.content?.slice(0, 100) || "Untitled"}
                >
                  {note.title || note.content?.slice(0, 40) || "Untitled"}
                  {!note.title && (note.content?.length ?? 0) > 40 ? "…" : ""}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setImportOpen(false)}
            className="mt-2 text-xs text-text-dim hover:text-text-primary"
          >
            Close
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Paste or type notes. Use Rewrite with AI to improve for the call."
          className="flex-1 w-full px-5 py-5 bg-transparent border-0 resize-none text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none leading-relaxed"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        />
        <div className="flex-shrink-0 px-5 pb-4 space-y-2">
          {saveMessage && (
            <div className="text-xs text-green-primary/90 text-center animate-in fade-in">
              {saveMessage}
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !currentNote.trim()}
            className="w-full px-4 py-2.5 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-sm font-medium hover:bg-green-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
