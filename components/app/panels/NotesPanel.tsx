"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";
import { loadSettings } from "@/lib/settings";

const STORAGE_MY = "persuaid_notes_draft_v1";
const STORAGE_AI = "persuaid_notes_ai_connected_v1";

interface SavedNote {
  id: string;
  title: string | null;
  content: string;
  updated_at: string;
}

type NotesView = "my" | "ai";

export function NotesPanel() {
  const { setNotesContext } = useSession();
  const [myNotes, setMyNotes] = useState("");
  const [aiConnectedNotes, setAiConnectedNotes] = useState("");
  const [notesView, setNotesView] = useState<NotesView>("my");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft + AI layer restore (local only) when Settings allow autosave.
  useEffect(() => {
    try {
      const s = loadSettings();
      if (!s.autoSaveEnabled) return;
      const rawMy = localStorage.getItem(STORAGE_MY);
      const rawAi = localStorage.getItem(STORAGE_AI);
      if (rawMy && !myNotes.trim()) setMyNotes(rawMy);
      if (rawAi && !aiConnectedNotes.trim()) setAiConnectedNotes(rawAi);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Live copilot uses AI-connected text when set; otherwise your My notes. */
  useEffect(() => {
    const forAi = aiConnectedNotes.trim() || myNotes.trim();
    const t = setTimeout(() => setNotesContext(forAi), 400);
    return () => clearTimeout(t);
  }, [myNotes, aiConnectedNotes, setNotesContext]);

  useEffect(() => {
    try {
      const s = loadSettings();
      if (!s.autoSaveEnabled) return;
      const t = setTimeout(() => {
        localStorage.setItem(STORAGE_MY, myNotes);
        if (aiConnectedNotes.trim()) {
          localStorage.setItem(STORAGE_AI, aiConnectedNotes);
        } else {
          localStorage.removeItem(STORAGE_AI);
        }
      }, 500);
      return () => clearTimeout(t);
    } catch {
      return;
    }
  }, [myNotes, aiConnectedNotes]);

  const handleSave = async () => {
    const content = myNotes.trim();
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
      setMyNotes("");
      setAiConnectedNotes("");
      setNotesView("my");
      try {
        localStorage.removeItem(STORAGE_AI);
      } catch {
        // ignore
      }
      setSaveMessage("Note saved");
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  const handleConnectWithAi = async () => {
    const content = myNotes.trim();
    if (!content) return;
    setConnectError(null);
    setConnecting(true);
    try {
      const res = await fetch("/api/ai/rewrite-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (res.ok && typeof data.text === "string") {
        setAiConnectedNotes(data.text);
        setNotesView("ai");
      } else {
        setConnectError(data.error || "Connect failed");
      }
    } catch {
      setConnectError("Request failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleLoadFile = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setMyNotes("");
    setAiConnectedNotes("");
    setNotesContext("");
    setNotesView("my");
    try {
      localStorage.removeItem(STORAGE_MY);
      localStorage.removeItem(STORAGE_AI);
    } catch {
      // ignore
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") setMyNotes(text);
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
      setMyNotes((prev) => (prev.trim() ? prev + "\n\n" + toAppend : toAppend));
    }
    setImportOpen(false);
  };

  const hasAiLayer = aiConnectedNotes.trim().length > 0;
  const editorValue = notesView === "my" ? myNotes : aiConnectedNotes;
  const editorReadOnly = notesView === "ai";

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/30 flex-wrap">
        <input
          id="notes-import-file"
          name="notesImportFile"
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
        <button
          type="button"
          onClick={handleConnectWithAi}
          disabled={connecting || !myNotes.trim()}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
            "bg-green-primary/20 text-green-700 dark:text-green-400 border border-green-primary/30",
            "hover:bg-green-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {connecting ? (
            <>
              <span className="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
              <span>Connecting…</span>
            </>
          ) : (
            "Connect with AI"
          )}
        </button>
      </div>
      {connecting && (
        <div
          className="flex-shrink-0 h-1 w-full bg-border/20 overflow-hidden"
          role="progressbar"
          aria-label="Connecting notes with AI"
          aria-busy="true"
        >
          <div
            className="h-full w-[38%] rounded-full bg-gradient-to-r from-green-primary/30 via-green-primary to-green-primary/30 notes-ai-connect-progress shadow-[0_0_12px_rgba(34,197,94,0.35)]"
          />
        </div>
      )}
      {connectError && (
        <div className="flex-shrink-0 px-4 py-1.5 text-xs text-red-500 dark:text-red-400">
          {connectError}
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
        <div className="flex-shrink-0 px-4 pt-3 pb-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-medium uppercase tracking-wide text-text-dim"
              id="notes-view-label"
            >
              View
            </span>
            <div
              className="inline-flex rounded-xl border border-border/40 bg-background-surface/50 p-0.5"
              role="group"
              aria-labelledby="notes-view-label"
            >
              <button
                type="button"
                onClick={() => setNotesView("my")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors",
                  notesView === "my"
                    ? "bg-background-elevated text-text-primary shadow-sm border border-border/30"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                My notes
              </button>
              <button
                type="button"
                onClick={() => setNotesView("ai")}
                disabled={!hasAiLayer}
                title={!hasAiLayer ? "Connect with AI first" : "Plain text optimized for the live assistant"}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors",
                  notesView === "ai"
                    ? "bg-green-primary/15 text-green-700 dark:text-green-400 border border-green-primary/35 shadow-sm"
                    : "text-text-muted hover:text-text-primary",
                  !hasAiLayer && "opacity-40 cursor-not-allowed hover:text-text-muted"
                )}
              >
                AI connected
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Product knowledge
            </span>
            <span className="text-xs text-green-600/90 dark:text-green-400/90 leading-snug">
              {notesView === "my"
                ? "Bulletins and scratch notes for you. Connect with AI to build a retrieval layer the copilot reads—without changing how you write."
                : "What the live assistant uses when connected. Edit your wording in My notes, then connect again to refresh."}
            </span>
          </div>
        </div>
        <textarea
          id="notes-panel-editor"
          name="productNotes"
          autoComplete="off"
          value={editorValue}
          onChange={(e) => {
            if (notesView === "my") setMyNotes(e.target.value);
          }}
          readOnly={editorReadOnly}
          placeholder={
            notesView === "my"
              ? "Paste or type notes (bullets welcome). Use Connect with AI to sync a plain version for the copilot."
              : "No AI-connected layer yet. Switch to My notes and tap Connect with AI."
          }
          className={cn(
            "flex-1 w-full px-5 py-5 bg-transparent border-0 resize-none text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none leading-relaxed",
            editorReadOnly && "cursor-default opacity-95"
          )}
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        />
        <div className="flex-shrink-0 px-5 pb-4 space-y-2">
          {saveMessage && (
            <div className="text-xs text-green-primary/90 text-center animate-in fade-in">
              {saveMessage}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={!myNotes.trim() && !aiConnectedNotes.trim()}
              className="px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear draft"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !myNotes.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-sm font-medium hover:bg-green-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
