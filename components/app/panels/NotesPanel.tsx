"use client";

import { useState } from "react";

interface Note {
  id: string;
  text: string;
  tags: string[];
  completed: boolean;
}

const initialNotes: Note[] = [
  {
    id: "1",
    text: "Interested in real-time guidance",
    tags: ["Interest"],
    completed: true,
  },
  {
    id: "2",
    text: "Has tried other solutions before",
    tags: ["Objection"],
    completed: false,
  },
  {
    id: "3",
    text: "Follow up: Send case study",
    tags: ["Action"],
    completed: false,
  },
  {
    id: "4",
    text: "Budget: $50k-100k range",
    tags: ["Budget"],
    completed: false,
  },
  {
    id: "5",
    text: "Decision maker: Sarah Chen",
    tags: ["Contact"],
    completed: true,
  },
];

const availableTags = ["Interest", "Objection", "Action", "Budget", "Contact", "Pain Point"];

export function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const toggleNote = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
  };

  return (
    <div className="h-full flex flex-col bg-background-surface">
      {/* Panel Header */}
      <div className="h-14 px-5 border-b border-border/50 flex items-center justify-between bg-background-elevated">
        <h2 className="text-sm font-bold text-text-primary tracking-tight">Notes</h2>
        <button className="p-1.5 hover:bg-background-surface rounded-lg transition-colors text-text-dim hover:text-text-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Notes Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-3 group hover:bg-background-elevated/50 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
            onClick={() => toggleNote(note.id)}
          >
            <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              note.completed
                ? "bg-green-primary/20 border-green-primary/40"
                : "bg-background-elevated border-border/50 group-hover:border-green-primary/40"
            }`}>
              {note.completed && (
                <svg className="w-2.5 h-2.5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${
                note.completed ? "text-text-dim line-through" : "text-text-secondary"
              }`}>
                {note.text}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      tag === "Interest"
                        ? "bg-green-primary/10 text-green-accent border border-green-primary/20"
                        : "bg-background-elevated text-text-muted border border-border/50"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tags Section */}
      <div className="px-5 py-4 border-t border-border/50 bg-background-elevated">
        <div className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
          Quick Tags
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => (
            <button
              key={tag}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background-surface border border-border/50 text-text-muted hover:border-green-primary/40 hover:text-green-accent transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
