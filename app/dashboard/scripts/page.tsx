"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

export type ScriptCategory = "Opening" | "Discovery" | "Objections" | "Closing" | "General";

export interface ScriptSection {
  id: string;
  title: string;
  items: string[];
}

export interface Script {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ScriptCategory;
  sections: ScriptSection[];
  created_at: string;
  updated_at: string;
}

const CATEGORIES: ScriptCategory[] = ["Opening", "Discovery", "Objections", "Closing", "General"];

const categoryStyles: Record<ScriptCategory, string> = {
  Opening: "bg-green-primary/15 text-green-accent border-green-primary/25",
  Discovery: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Objections: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Closing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  General: "bg-background-surface text-text-muted border-border",
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

function newSection(): ScriptSection {
  return { id: crypto.randomUUID(), title: "New section", items: [""] };
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<ScriptCategory | "All">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [saving, setSaving] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<ScriptCategory>("Opening");
  const [formSections, setFormSections] = useState<ScriptSection[]>([]);

  const fetchScripts = useCallback(async () => {
    const { data, error } = await supabase
      .from("scripts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch scripts:", error);
      setScripts([]);
      return;
    }
    setScripts((data as Script[]) ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchScripts();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchScripts]);

  const openCreate = () => {
    setEditingScript(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Opening");
    setFormSections([newSection()]);
    setModalOpen(true);
  };

  const openEdit = (script: Script) => {
    setEditingScript(script);
    setFormTitle(script.title);
    setFormDescription(script.description ?? "");
    setFormCategory(script.category);
    setFormSections(
      script.sections?.length
        ? script.sections.map((s) => ({ ...s, items: [...(s.items || [])] }))
        : [newSection()]
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingScript(null);
    setSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const sections = formSections
      .map((s) => ({
        id: s.id,
        title: s.title || "Untitled",
        items: (s.items || []).filter((i) => i.trim() !== ""),
      }))
      .filter((s) => s.title.trim() !== "" || s.items.length > 0);
    const payload = {
      title: formTitle.trim() || "Untitled script",
      description: formDescription.trim(),
      category: formCategory,
      sections: sections.length ? sections : [{ id: crypto.randomUUID(), title: "Section 1", items: [] }],
      updated_at: new Date().toISOString(),
    };
    if (editingScript) {
      const { error } = await supabase.from("scripts").update(payload).eq("id", editingScript.id);
      if (error) {
        console.error(error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("scripts").insert({ ...payload, user_id: user.id });
      if (error) {
        console.error(error);
        setSaving(false);
        return;
      }
    }
    await fetchScripts();
    closeModal();
  };

  const addSection = () => setFormSections((s) => [...s, newSection()]);
  const removeSection = (index: number) => setFormSections((s) => s.filter((_, i) => i !== index));
  const updateSection = (index: number, updates: Partial<ScriptSection>) => {
    setFormSections((s) => s.map((sec, i) => (i === index ? { ...sec, ...updates } : sec)));
  };
  const setSectionItems = (sectionIndex: number, items: string[]) =>
    updateSection(sectionIndex, { items });
  const addItem = (sectionIndex: number) => {
    setFormSections((s) =>
      s.map((sec, i) => (i === sectionIndex ? { ...sec, items: [...(sec.items || []), ""] } : sec))
    );
  };
  const removeItem = (sectionIndex: number, itemIndex: number) => {
    setFormSections((s) =>
      s.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, items: (sec.items || []).filter((_, j) => j !== itemIndex) }
          : sec
      )
    );
  };
  const setItem = (sectionIndex: number, itemIndex: number, value: string) => {
    setFormSections((s) =>
      s.map((sec, i) =>
        i === sectionIndex
          ? {
              ...sec,
              items: (sec.items || []).map((it, j) => (j === itemIndex ? value : it)),
            }
          : sec
      )
    );
  };

  const handleDelete = async () => {
    if (!scriptToDelete) return;
    setDeleteConfirming(true);
    const { error } = await supabase.from("scripts").delete().eq("id", scriptToDelete.id);
    setDeleteConfirming(false);
    setScriptToDelete(null);
    if (!error) await fetchScripts();
  };

  const filtered = scripts.filter((s) => {
    const matchSearch =
      !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || s.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Scripts</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Your saved talk tracks and scripts for every call
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
          New script
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
              placeholder="Search scripts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 focus:border-green-primary/30 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filterCategory === cat
                    ? "bg-green-primary/20 text-green-accent border border-green-primary/30"
                    : "bg-background-surface/60 text-text-muted border border-border hover:text-text-secondary hover:border-border/80"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl">
          {loading ? (
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 p-12 text-center">
              <p className="text-text-muted text-sm">Loading scripts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-background-surface/40 border border-border/50 border-dashed p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-background-elevated flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-text-primary font-medium">
                {scripts.length === 0 ? "No scripts yet" : "No scripts match your filters"}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {scripts.length === 0
                  ? "Create your first talk track to use during calls."
                  : "Try a different search or category, or create a new script."}
              </p>
              {scripts.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 px-4 py-2 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-sm font-medium hover:bg-green-primary/30 transition-colors"
                >
                  New script
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((script) => (
                <li key={script.id}>
                  <div className="rounded-2xl bg-background-surface/40 border border-border/50 hover:border-green-primary/20 transition-all p-5 flex items-start justify-between gap-4 group">
                    <button
                      type="button"
                      className="flex-1 text-left min-w-0"
                      onClick={() => openEdit(script)}
                    >
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-green-accent/90 transition-colors">
                        {script.title}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                        {script.description || "No description"}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border",
                            categoryStyles[script.category]
                          )}
                        >
                          {script.category}
                        </span>
                        <span className="text-[10px] text-text-dim">
                          {(script.sections?.length ?? 0)} sections · {formatRelativeTime(script.updated_at)}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(script)}
                        className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-background-surface/50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setScriptToDelete(script); }}
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
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">
                {editingScript ? "Edit script" : "New script"}
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
                <label className="block text-xs font-medium text-text-muted mb-1.5">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Cold call opening"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description of when to use this script"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ScriptCategory)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-primary/40 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-text-muted">Sections & talking points</label>
                  <button type="button" onClick={addSection} className="text-xs font-medium text-green-accent hover:underline">
                    + Add section
                  </button>
                </div>
                <div className="space-y-4">
                  {formSections.map((section, sIdx) => (
                    <div key={section.id} className="rounded-xl bg-background-surface/50 border border-border/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                          placeholder="Section title"
                          className="flex-1 px-3 py-2 rounded-lg bg-background-elevated/50 border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/40"
                        />
                        <button
                          type="button"
                          onClick={() => removeSection(sIdx)}
                          className="p-2 rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10"
                          title="Remove section"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-border/50">
                        {(section.items || [""]).map((item, iIdx) => (
                          <div key={iIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => setItem(sIdx, iIdx, e.target.value)}
                              placeholder="Talking point"
                              className="flex-1 px-3 py-1.5 rounded-lg bg-background-elevated/30 border border-border/50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30"
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(sIdx, iIdx)}
                              className="p-1.5 rounded text-text-dim hover:text-red-400"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addItem(sIdx)}
                          className="text-xs text-green-accent hover:underline"
                        >
                          + Add point
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-background-surface/50 text-sm font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingScript ? "Save changes" : "Create script"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {scriptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-text-primary font-medium">Delete &quot;{scriptToDelete.title}&quot;?</p>
            <p className="text-sm text-text-muted mt-1">This cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setScriptToDelete(null)}
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
