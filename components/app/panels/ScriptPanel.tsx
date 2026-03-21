"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useSessionOptional } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";

interface ScriptSection {
  id: string;
  title: string;
  items: string[];
}

interface Script {
  id: string;
  title: string;
  description: string;
  category: string;
  sections: ScriptSection[];
  updated_at: string;
}

export function ScriptPanel() {
  const session = useSessionOptional();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    session?.setSelectedScriptId(selectedId);
  }, [selectedId, session]);

  const fetchScripts = useCallback(async () => {
    const { data, error } = await supabase
      .from("scripts")
      .select("id, title, description, category, sections, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch scripts:", error);
      setScripts([]);
      return;
    }
    const list = (data as Script[]) ?? [];
    setScripts(list);
    setSelectedId((prev) => {
      if (prev && list.some((s) => s.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchScripts();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchScripts]);

  const selectedScript = scripts.find((s) => s.id === selectedId);
  const sections = selectedScript?.sections ?? [];

  useEffect(() => {
    if (!session || !selectedScript) {
      session?.setScriptContext("");
      return;
    }
    const context = (selectedScript.sections ?? [])
      .map((s) => `${s.title}: ${(s.items || []).join("; ")}`)
      .join("\n");
    session.setScriptContext(context);
  }, [session, selectedScript]);

  const toggleItem = (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Script selector */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/8">
        <label htmlFor="active-script-select" className="text-[10px] font-medium text-text-dim/60 uppercase tracking-wider block mb-1.5">
          Active script
        </label>
        <select
          id="active-script-select"
          name="activeScriptId"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="w-full px-3 py-2 rounded-xl bg-background-surface/50 border border-border/50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/40"
        >
          <option value="">No script</option>
          {scripts.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <Link
          href="/dashboard/scripts"
          className="mt-2 flex items-center gap-1.5 text-xs text-green-primary/90 hover:text-green-accent"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Manage scripts
        </Link>
      </div>

      {/* Script content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {loading ? (
          <p className="text-sm text-text-muted">Loading scripts…</p>
        ) : !selectedScript ? (
          <p className="text-sm text-text-muted">Select a script above or create one in Scripts.</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-text-muted">This script has no sections yet. Edit it to add talking points.</p>
        ) : (
          sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm bg-background-elevated/30 border-border/18">
                  <h3 className="text-xs font-medium text-text-dim/60 uppercase tracking-wider sr-only">
                    {section.title}
                  </h3>
                </div>
                <h3 className="text-xs font-medium text-text-dim/60 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              <div className="ml-9 space-y-3">
                {(section.items || []).map((item, index) => {
                  const key = `${section.id}-${index}`;
                  const completed = completedItems.has(key);
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 group cursor-pointer"
                      onClick={() => toggleItem(section.id, index)}
                    >
                      <div
                        className={cn(
                          "mt-2 w-4 h-4 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                          completed
                            ? "bg-green-primary/10 border-green-primary/18"
                            : "bg-background-elevated/30 border-border/18 group-hover:border-green-primary/18"
                        )}
                      >
                        {completed && (
                          <svg className="w-2.5 h-2.5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <p className={cn("text-sm leading-relaxed flex-1", completed ? "text-text-dim/60 line-through" : "text-text-secondary/85")}>
                        {item || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
