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
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Notes Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-3 group hover:bg-background-elevated/15 rounded-xl p-3 -m-3 transition-all duration-300 cursor-pointer"
            onClick={() => toggleNote(note.id)}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${
              note.completed
                ? "bg-green-primary/10 border-green-primary/18"
                : "bg-background-elevated/30 border-border/18 group-hover:border-green-primary/18"
            }`}>
              {note.completed && (
                <svg className="w-2.5 h-2.5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${
                note.completed ? "text-text-dim/60 line-through" : "text-text-secondary/85"
              }`}>
                {note.text}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                      tag === "Interest"
                        ? "bg-green-primary/6 text-green-accent/85 border-green-primary/12"
                        : "bg-background-elevated/30 text-text-muted/75 border-border/15"
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
      <div className="px-4 py-3 border-t border-border/8 bg-background-elevated/15 backdrop-blur-xl">
        <div className="text-xs font-medium text-text-dim/50 uppercase tracking-wider mb-3">
          Quick Tags
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-background-surface/30 border border-border/15 text-text-muted/75 hover:border-green-primary/15 hover:text-green-accent/90 hover:bg-background-surface/50 transition-all duration-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
