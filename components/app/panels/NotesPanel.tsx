"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function NotesPanel() {
  const [currentNote, setCurrentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Text area for writing - takes most space */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Start writing notes…"
          className="flex-1 w-full px-5 py-5 bg-transparent border-0 resize-none text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none leading-relaxed"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        />
        
        {/* Save button and message - inside the text area section */}
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
