"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";
import { loadSettings } from "@/lib/settings";
import { fetchApi } from "@/lib/api-fetch";

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
  const { setNotesContext, setNotesUserPlain } = useSession();
  const [myNotes, setMyNotes] = useState("");
  const [aiConnectedNotes, setAiConnectedNotes] = useState("");
  const [notesView, setNotesView] = useState<NotesView>("my");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [savedSidebarOpen, setSavedSidebarOpen] = useState(true);
  const [activeSavedNoteId, setActiveSavedNoteId] = useState<string | null>(null);
  const [savedNoteActionId, setSavedNoteActionId] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SavedNote | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedNote | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSavedNotes = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSavedNotes([]);
        return;
      }
      const { data } = await supabase
        .from("notes")
        .select("id, title, content, updated_at")
        .order("updated_at", { ascending: false })
        .limit(80);
      setSavedNotes((data as SavedNote[]) ?? []);
    } catch {
      setSavedNotes([]);
    }
  }, []);

  useEffect(() => {
    void refreshSavedNotes();
  }, [refreshSavedNotes]);

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

  /** Copilot APIs get AI-connected text when set; HUD and display use `notesUserPlain` (My notes only). */
  useEffect(() => {
    const forAi = aiConnectedNotes.trim() || myNotes.trim();
    const t = setTimeout(() => {
      setNotesContext(forAi);
      setNotesUserPlain(myNotes);
    }, 400);
    return () => clearTimeout(t);
  }, [myNotes, aiConnectedNotes, setNotesContext, setNotesUserPlain]);

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

  /** Drop AI-connected layer so the user reconnects after notes change materially (import, file, clear). */
  const invalidateAiLayer = useCallback(() => {
    setAiConnectedNotes("");
    setNotesView("my");
    setConnectError(null);
    try {
      localStorage.removeItem(STORAGE_AI);
    } catch {
      // ignore
    }
  }, []);

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
      completed: false,
    });

    setSaving(false);
    if (!error) {
      setMyNotes("");
      invalidateAiLayer();
      setActiveSavedNoteId(null);
      setSaveMessage("Note saved");
      setTimeout(() => setSaveMessage(null), 2000);
      void refreshSavedNotes();
    }
  };

  const handleConnectWithAi = async () => {
    const content = myNotes.trim();
    if (!content) return;
    setConnectError(null);
    setConnecting(true);
    try {
      const res = await fetchApi("/api/ai/rewrite-notes", {
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
    setActiveSavedNoteId(null);
    invalidateAiLayer();
    setNotesContext("");
    setNotesUserPlain("");
    try {
      localStorage.removeItem(STORAGE_MY);
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
      if (typeof text === "string") {
        invalidateAiLayer();
        setMyNotes(text);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const selectSavedNote = (note: SavedNote) => {
    const text = note.content?.trim() || "";
    invalidateAiLayer();
    setMyNotes(text);
    setActiveSavedNoteId(note.id);
    setNotesView("my");
  };

  const openRenameModal = (note: SavedNote) => {
    if (savedNoteActionId) return;
    setRenameTarget(note);
    setRenameDraft((note.title ?? "").trim());
    setRenameError(null);
    setRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    if (savedNoteActionId) return;
    setRenameModalOpen(false);
    setRenameTarget(null);
    setRenameDraft("");
    setRenameError(null);
  };

  const submitRename = async () => {
    if (!renameTarget || savedNoteActionId) return;
    const title = renameDraft.trim();
    setSavedNoteActionId(renameTarget.id);
    setRenameError(null);
    try {
      const { error } = await supabase
        .from("notes")
        .update({ title: title ? title : null })
        .eq("id", renameTarget.id);
      if (error) {
        setRenameError("Could not rename note.");
        return;
      }
      setRenameModalOpen(false);
      setRenameTarget(null);
      setRenameDraft("");
      void refreshSavedNotes();
    } finally {
      setSavedNoteActionId(null);
    }
  };

  const openDeleteModal = (note: SavedNote) => {
    if (savedNoteActionId) return;
    setDeleteTarget(note);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (savedNoteActionId) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || savedNoteActionId) return;
    setSavedNoteActionId(deleteTarget.id);
    try {
      const { error } = await supabase.from("notes").delete().eq("id", deleteTarget.id);
      if (!error) {
        if (activeSavedNoteId === deleteTarget.id) setActiveSavedNoteId(null);
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        void refreshSavedNotes();
      }
    } finally {
      setSavedNoteActionId(null);
    }
  };

  const hasAiLayer = aiConnectedNotes.trim().length > 0;
  const editorValue = notesView === "my" ? myNotes : aiConnectedNotes;
  const editorReadOnly = notesView === "ai";

  return (
    <div className="flex h-full min-h-0 w-full flex-col sm:flex-row">
      {renameModalOpen && renameTarget && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-note-title"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeRenameModal} aria-hidden />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-background-elevated border border-white/[0.08] shadow-2xl">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="rename-note-title" className="text-base font-semibold text-text-primary">
                  Rename note
                </h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Set a title for this saved note.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRenameModal}
                className="shrink-0 rounded-lg p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
                disabled={savedNoteActionId === renameTarget.id}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="rename-note-input" className="block text-xs font-medium text-text-muted mb-1.5">
                  Title (optional)
                </label>
                <input
                  id="rename-note-input"
                  type="text"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitRename();
                    if (e.key === "Escape") closeRenameModal();
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-white/[0.10] text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/35 text-sm"
                  placeholder="e.g. Horizon Life Insurance"
                  autoFocus
                  disabled={savedNoteActionId === renameTarget.id}
                />
              </div>
              {renameError && <p className="text-xs text-amber-400">{renameError}</p>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRenameModal}
                  disabled={savedNoteActionId === renameTarget.id}
                  className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-white/[0.06] text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRename}
                  disabled={savedNoteActionId === renameTarget.id}
                  className="px-4 py-2.5 rounded-xl bg-green-primary/20 border border-green-primary/35 text-green-accent text-sm font-medium hover:bg-green-primary/30 disabled:opacity-50"
                >
                  {savedNoteActionId === renameTarget.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && deleteTarget && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-note-title"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeDeleteModal} aria-hidden />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-background-elevated border border-white/[0.08] shadow-2xl">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="delete-note-title" className="text-base font-semibold text-text-primary">
                  Delete note?
                </h2>
                <p className="text-sm text-text-muted mt-0.5">
                  This will permanently remove the saved note.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="shrink-0 rounded-lg p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
                disabled={savedNoteActionId === deleteTarget.id}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-xs text-text-dim">
                  {deleteTarget.title?.trim()
                    ? `“${deleteTarget.title.trim()}”`
                    : (deleteTarget.content?.slice(0, 80) || "Untitled")}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={savedNoteActionId === deleteTarget.id}
                  className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-white/[0.06] text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={savedNoteActionId === deleteTarget.id}
                  className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/22 disabled:opacity-50"
                >
                  {savedNoteActionId === deleteTarget.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside
        className={cn(
          "flex shrink-0 flex-col bg-background-near-black transition-[width,max-height] duration-300 ease-out",
          "border-b border-white/[0.06] sm:border-b-0 sm:border-r sm:border-white/[0.06]",
          savedSidebarOpen
            ? "max-h-[min(240px,38vh)] w-full sm:max-h-none sm:w-[min(19rem,30vw)] lg:w-80"
            : "max-h-[2.75rem] w-full overflow-hidden sm:max-h-none sm:w-[2.75rem] sm:min-w-[2.75rem] sm:overflow-visible"
        )}
      >
        {savedSidebarOpen ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 sm:px-3.5">
              <p className="min-w-0 truncate text-[10px] font-medium uppercase tracking-label text-text-dim/80">
                Saved notes
              </p>
              <button
                type="button"
                onClick={() => setSavedSidebarOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors duration-300 ease-out hover:bg-white/[0.05] hover:text-text-primary"
                aria-label="Collapse saved notes"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2 sm:p-2.5">
              {savedNotes.length === 0 ? (
                <p className="px-1.5 py-2 text-xs font-normal leading-relaxed text-text-dim/75">
                  Saved notes appear here. Use Save below to add one.
                </p>
              ) : (
                savedNotes.map((note) => (
                  <div
                    key={note.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectSavedNote(note)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectSavedNote(note);
                      }
                    }}
                    className={cn(
                      "group w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-300 ease-out",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary/35",
                      activeSavedNoteId === note.id
                        ? "bg-white/[0.07] text-text-primary"
                        : "text-text-muted hover:bg-white/[0.04] hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-normal">
                          {note.title || note.content?.slice(0, 56) || "Untitled"}
                        </span>
                        <span className="mt-1 block truncate text-[10px] text-text-dim/75">
                          {new Date(note.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openRenameModal(note);
                          }}
                          disabled={savedNoteActionId === note.id}
                          className="rounded-md p-1.5 text-text-dim/70 hover:bg-white/[0.06] hover:text-text-primary disabled:opacity-50"
                          title="Rename"
                          aria-label="Rename"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 012.97 2.97L8.5 17.79 4 19l1.21-4.5L16.862 3.487z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-2-2" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteModal(note);
                          }}
                          disabled={savedNoteActionId === note.id}
                          className="rounded-md p-1.5 text-red-400/80 hover:bg-red-500/[0.10] hover:text-red-300 disabled:opacity-50"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 14h8l1-14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[2.75rem] items-center justify-between gap-2 px-2 py-2 sm:min-h-0 sm:flex-1 sm:flex-col sm:justify-start sm:px-0 sm:py-3">
            <button
              type="button"
              onClick={() => setSavedSidebarOpen(true)}
              className="flex h-9 w-full items-center justify-center rounded-lg text-text-muted transition-colors duration-300 ease-out hover:bg-white/[0.05] hover:text-text-primary sm:h-10 sm:w-10"
              aria-label="Expand saved notes"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="truncate pl-2 text-[11px] font-normal tracking-label text-text-dim/80 sm:hidden">Saved</span>
          </div>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
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
          className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-normal text-text-primary transition-colors duration-300 ease-out hover:bg-white/[0.09]"
        >
          Load from file
        </button>
        <button
          type="button"
          onClick={handleConnectWithAi}
          disabled={connecting || !myNotes.trim()}
          className={cn(
            "inline-flex min-h-[2.5rem] flex-wrap items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold tracking-tight text-white transition-[background-color,opacity,box-shadow] duration-300 ease-out",
            "bg-green-primary shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
            "hover:bg-green-dark hover:shadow-[0_2px_6px_rgba(0,0,0,0.22)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background-near-black",
            "disabled:cursor-not-allowed disabled:bg-green-primary/28 disabled:text-white/75 disabled:shadow-none disabled:hover:bg-green-primary/28 disabled:hover:shadow-none",
            hasAiLayer && !connecting && "bg-green-dark"
          )}
        >
          {connecting ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-white/25 border-t-white"
                aria-hidden
              />
              <span className="font-medium">Connecting…</span>
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center justify-center gap-2">
              <span>Connect to AI</span>
              {!hasAiLayer && myNotes.trim() && (
                <span
                  className="text-[11px] font-normal text-white/85"
                  title="Builds a clean layer the copilot reads during calls"
                >
                  Recommended
                </span>
              )}
            </span>
          )}
        </button>

        <div className="flex-1" aria-hidden />

        {saveMessage && (
          <div className="hidden sm:block animate-in fade-in text-xs font-normal text-text-muted">
            {saveMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleClear}
          disabled={!myNotes.trim() && !aiConnectedNotes.trim()}
          className="rounded-lg px-3 py-2 text-xs font-medium text-text-muted transition-colors duration-300 ease-out hover:bg-white/[0.06] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
          title="Clear draft"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !myNotes.trim()}
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-300 ease-out",
            "bg-green-primary/18 border border-green-primary/25 text-green-accent hover:bg-green-primary/26",
            "disabled:cursor-not-allowed disabled:opacity-45"
          )}
          title="Save note"
        >
          {saving ? "Saving…" : "Save to notes"}
        </button>
      </div>
      {connecting && (
        <div
          className="h-px w-full flex-shrink-0 overflow-hidden bg-white/[0.06]"
          role="progressbar"
          aria-label="Connecting to AI"
          aria-busy="true"
        >
          <div className="h-full w-[32%] bg-white/25 notes-ai-connect-progress" />
        </div>
      )}
      {connectError && (
        <div className="flex-shrink-0 px-4 py-1.5 text-xs text-red-500 sm:px-6 dark:text-red-400">
          {connectError}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pb-1.5 pt-1 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-medium uppercase tracking-label text-text-dim/75"
              id="notes-view-label"
            >
              View
            </span>
            <div
              className="inline-flex rounded-lg bg-white/[0.04] p-0.5"
              role="group"
              aria-labelledby="notes-view-label"
            >
              <button
                type="button"
                onClick={() => setNotesView("my")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-normal transition-colors duration-300 ease-out",
                  notesView === "my"
                    ? "bg-white/[0.08] text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                My notes
              </button>
              <button
                type="button"
                onClick={() => setNotesView("ai")}
                disabled={!hasAiLayer}
                title={
                  !hasAiLayer
                    ? "Run Connect to AI from My notes first"
                    : "AI-processed version used by the assistant during calls"
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all duration-300 ease-out",
                  notesView === "ai"
                    ? "notes-ai-version-selected bg-green-primary font-medium text-white"
                    : hasAiLayer
                      ? "font-normal text-green-primary hover:bg-green-primary/12"
                      : "font-normal text-text-muted hover:text-text-primary",
                  !hasAiLayer && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-text-muted"
                )}
              >
                {hasAiLayer && notesView !== "ai" && (
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-primary/50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-primary" />
                  </span>
                )}
                AI version
              </button>
            </div>
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
              ? "Paste or type product knowledge, bullets welcome. Use Connect to AI when you want a clean layer for calls."
              : "No AI version yet. Switch to My notes and run Connect to AI."
          }
          className={cn(
            "min-h-0 w-full flex-1 resize-none border-0 bg-transparent px-4 py-3 text-[15px] font-normal leading-relaxed text-text-primary placeholder:text-text-dim/40 focus:outline-none sm:px-6 sm:py-4 sm:text-[0.9375rem]",
            editorReadOnly && "cursor-default opacity-90"
          )}
          style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
        />
        {saveMessage && (
          <div className="sm:hidden flex-shrink-0 px-4 pb-4 text-center text-xs font-normal text-text-muted animate-in fade-in">
            {saveMessage}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
