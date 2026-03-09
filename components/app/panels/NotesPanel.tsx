"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";

export function NotesPanel() {
  const { setNotesContext } = useSession();
  const [currentNote, setCurrentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setNotesContext(currentNote), 400);
    return () => clearTimeout(t);
  }, [currentNote, setNotesContext]);

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
        body: JSON.stringify({ content }),
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

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/30">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
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
          onClick={handleRewrite}
          disabled={rewriting || !currentNote.trim()}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
            "bg-green-primary/20 text-green-700 dark:text-green-400 border border-green-primary/30",
            "hover:bg-green-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {rewriting ? "Rewriting…" : "Rewrite with AI"}
        </button>
      </div>
      {rewriteError && (
        <div className="flex-shrink-0 px-4 py-1.5 text-xs text-red-500 dark:text-red-400">
          {rewriteError}
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
