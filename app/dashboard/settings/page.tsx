"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

function getEmailInitial(email: string | undefined): string {
  if (!email) return "?";
  const first = email.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? "";
        setDisplayName(name);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setDisplayName(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() || undefined },
    });
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Profile updated." });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Manage your account and preferences
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl space-y-8">
          {/* Profile */}
          <section className="rounded-2xl bg-background-surface/40 border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
              <p className="text-xs text-text-muted mt-0.5">Your identity in Persuaid</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-primary/20 border border-green-primary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-primary text-2xl font-semibold">
                    {getEmailInitial(user?.email)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {displayName.trim() || user?.user_metadata?.full_name || user?.user_metadata?.name || "—"}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{user?.email ?? "—"}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-text-muted mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border text-text-primary text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-text-dim mt-1">Email is managed by your account provider.</p>
                </div>
                <div>
                  <label htmlFor="displayName" className="block text-xs font-medium text-text-muted mb-1.5">
                    Display name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/30 text-sm"
                  />
                </div>
                {message && (
                  <p className={cn("text-sm", message.type === "success" ? "text-green-primary" : "text-red-400")}>
                    {message.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </form>
            </div>
          </section>

          {/* Account */}
          <section className="rounded-2xl bg-background-surface/40 border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h2 className="text-sm font-semibold text-text-primary">Account</h2>
              <p className="text-xs text-text-muted mt-0.5">Sign-in and security</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">Password</p>
                  <p className="text-xs text-text-muted mt-0.5">Change your password in your email provider or reset via Supabase.</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">Signed in with</p>
                  <p className="text-xs text-text-muted mt-0.5">Email · {user?.email ?? "—"}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="rounded-2xl bg-background-surface/40 border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h2 className="text-sm font-semibold text-text-primary">Preferences</h2>
              <p className="text-xs text-text-muted mt-0.5">How Persuaid behaves for you</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">Workspace layout</p>
                  <p className="text-xs text-text-muted mt-0.5">Panel positions are saved per session.</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">Notifications</p>
                  <p className="text-xs text-text-muted mt-0.5">Coming soon.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
